from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr

# ---- DB ----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---- App ----
app = FastAPI(title="Olevia API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
JWT_EXP_HOURS = 24


# ---------- Utility ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")[:80] or uuid.uuid4().hex[:8]


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Models ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    excerpt: str = Field(..., min_length=10, max_length=400)
    content: str = Field(..., min_length=20)
    cover_image: str = Field(..., description="Image URL")
    category: str = Field(default="Wellness")
    author: str = Field(default="Olevia Editorial")
    read_time: str = Field(default="5 min read")


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    read_time: Optional[str] = None


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    title: str
    excerpt: str
    content: str
    cover_image: str
    category: str
    author: str
    read_time: str
    created_at: datetime
    updated_at: datetime


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    category: str  # diffuser_blends | roll_ons | plants | soaps
    description: str
    benefits: List[str]
    price: float
    currency: str = "USD"
    image: str
    featured: bool = False


# ---------- Auth Endpoints ----------
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    return LoginResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"], email=user["email"], name=user["name"], role=user["role"]
        ),
    )


@api_router.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return UserPublic(**user)


# ---------- Blog Endpoints ----------
@api_router.get("/blogs", response_model=List[BlogPost])
async def list_blogs():
    docs = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        for k in ("created_at", "updated_at"):
            if isinstance(d.get(k), str):
                d[k] = datetime.fromisoformat(d[k])
    return docs


@api_router.get("/blogs/{slug}", response_model=BlogPost)
async def get_blog(slug: str):
    doc = await db.blog_posts.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Blog post not found")
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), str):
            doc[k] = datetime.fromisoformat(doc[k])
    return doc


@api_router.post("/blogs", response_model=BlogPost)
async def create_blog(data: BlogPostCreate, _: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    base_slug = slugify(data.title)
    slug = base_slug
    suffix = 1
    while await db.blog_posts.find_one({"slug": slug}):
        suffix += 1
        slug = f"{base_slug}-{suffix}"
    doc = {
        "id": str(uuid.uuid4()),
        "slug": slug,
        **data.model_dump(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    await db.blog_posts.insert_one(doc)
    doc.pop("_id", None)
    doc["created_at"] = now
    doc["updated_at"] = now
    return doc


@api_router.put("/blogs/{blog_id}", response_model=BlogPost)
async def update_blog(blog_id: str, data: BlogPostUpdate, _: dict = Depends(require_admin)):
    existing = await db.blog_posts.find_one({"id": blog_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found")
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if "title" in update and update["title"] != existing["title"]:
        base_slug = slugify(update["title"])
        slug = base_slug
        suffix = 1
        while await db.blog_posts.find_one({"slug": slug, "id": {"$ne": blog_id}}):
            suffix += 1
            slug = f"{base_slug}-{suffix}"
        update["slug"] = slug
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.blog_posts.update_one({"id": blog_id}, {"$set": update})
    doc = await db.blog_posts.find_one({"id": blog_id}, {"_id": 0})
    for k in ("created_at", "updated_at"):
        if isinstance(doc.get(k), str):
            doc[k] = datetime.fromisoformat(doc[k])
    return doc


@api_router.delete("/blogs/{blog_id}")
async def delete_blog(blog_id: str, _: dict = Depends(require_admin)):
    res = await db.blog_posts.delete_one({"id": blog_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"ok": True}


# ---------- Product Endpoints ----------
@api_router.get("/products", response_model=List[Product])
async def list_products(category: Optional[str] = None):
    query = {"category": category} if category else {}
    docs = await db.products.find(query, {"_id": 0}).to_list(500)
    return docs


# ---------- Seed Data ----------
SAMPLE_BLOGS = [
    {
        "title": "A Brief History of Aromatherapy: From Ancient Egypt to Modern Wellness",
        "excerpt": "Discover how fragrant plant oils have been soothing body and mind for more than 4,500 years — and why science is finally catching up.",
        "content": (
            "Aromatherapy — the therapeutic use of volatile plant oils — is often thought of as a modern wellness trend, "
            "but its roots stretch back thousands of years. The earliest records come from ancient Egypt, where priests "
            "infused resins like frankincense and myrrh into religious rituals, embalming, and daily bathing.\n\n"
            "In ancient India, the practice of Ayurveda integrated aromatic oils as a core healing modality, while traditional "
            "Chinese medicine combined fragrant herbs with acupuncture and massage. The Greeks and Romans carried the art "
            "westward: Hippocrates himself prescribed aromatic baths and inhalations, writing that 'the way to health is to "
            "have an aromatic bath and scented massage every day.'\n\n"
            "The term 'aromathérapie' was coined in 1937 by French chemist René-Maurice Gattefossé after he burned his hand "
            "in a lab accident and instinctively plunged it into lavender oil — the rapid healing and lack of scarring "
            "sparked a lifetime of research into essential oils.\n\n"
            "Today, peer-reviewed studies confirm what ancient traditions intuited: lavender and bergamot reduce cortisol, "
            "peppermint sharpens focus, and eucalyptus opens the airways. At Olevia, every blend we craft stands on the "
            "shoulders of this long, fragrant lineage."
        ),
        "cover_image": "https://images.unsplash.com/photo-1603719614761-f5437f81a61d",
        "category": "History",
        "author": "Olevia Editorial",
        "read_time": "6 min read",
    },
    {
        "title": "Five Diffuser Blends to Calm an Anxious Mind",
        "excerpt": "Science-backed essential oil combinations for stress, restlessness, and that Sunday-night spiral.",
        "content": (
            "Anxiety lives in the nervous system, and the nervous system listens closely to scent. The olfactory bulb "
            "connects directly to the amygdala and hippocampus — the brain's emotion and memory centers — which is why "
            "a single inhalation can shift your mood in seconds.\n\n"
            "1. Lavender + Bergamot (3:2) — the classic 'wind down' combination. Lavender lowers heart rate; bergamot "
            "lifts the spirits without the sedation.\n\n"
            "2. Roman Chamomile + Sweet Orange (1:3) — gentle, childlike, grounding. Perfect for evening reading.\n\n"
            "3. Frankincense + Cedarwood (1:2) — deepens the breath and creates a meditative 'forest floor' feeling.\n\n"
            "4. Ylang Ylang + Pink Grapefruit (1:4) — floral and bright, a mid-afternoon reset for racing thoughts.\n\n"
            "5. Vetiver + Sandalwood + Lavender (1:1:2) — our most requested blend for insomnia and overthinking.\n\n"
            "Add 6–8 total drops to a 150 ml ultrasonic diffuser with filtered water. Run for 30 minutes, pause for 30. "
            "Your nervous system will thank you."
        ),
        "cover_image": "https://images.unsplash.com/photo-1552017650-c117c3535f68",
        "category": "Diffuser Blends",
        "author": "Olevia Editorial",
        "read_time": "4 min read",
    },
    {
        "title": "Roll-Ons 101: How to Use Pain & Mood Blends Safely",
        "excerpt": "Dilution ratios, pulse points, and the small rituals that make topical aromatherapy genuinely effective.",
        "content": (
            "A roll-on bottle looks innocent enough — ten milliliters of oil, a tiny steel ball — but it is one of the most "
            "powerful delivery systems in aromatherapy. Applied to pulse points, the essential oils warm with body heat, "
            "evaporate into your breathing zone, and absorb through the skin into the bloodstream within minutes.\n\n"
            "**Dilution matters.** For daily use on adults, a 2–3% dilution is both safe and effective: that's roughly 12–18 "
            "drops of essential oil in a 10 ml carrier like fractionated coconut or jojoba. Olevia's pain blends run slightly "
            "stronger (5%) for targeted relief on sore muscles, and our mood blends stay gentle (2%) for frequent reapplication.\n\n"
            "**Pulse points to try:** inner wrists, behind the ears, base of the skull, temples (avoid the eyes), the soft "
            "spot above the collarbones, and the arches of the feet before bed.\n\n"
            "**The ritual is part of the medicine.** Roll, cup your palms over your nose, take three slow breaths, then "
            "apply. The pause matters as much as the oil."
        ),
        "cover_image": "https://images.unsplash.com/photo-1707858950463-d47f5fcaacfa",
        "category": "How-To",
        "author": "Olevia Editorial",
        "read_time": "5 min read",
    },
    {
        "title": "Therapeutic Plants to Keep on Your Desk",
        "excerpt": "Living air purifiers that also release subtle, mood-shifting aromatics throughout the day.",
        "content": (
            "Essential oils are concentrated plant medicine, but the whole plant has its own quiet gifts. NASA's Clean Air "
            "Study identified dozens of houseplants that measurably filter formaldehyde, benzene, and trichloroethylene — "
            "the same VOCs that accumulate in closed offices.\n\n"
            "Our favorites for a desk or reading nook:\n\n"
            "**Rosemary** — brush the leaves while you work; the released 1,8-cineole is linked in studies to improved "
            "memory and alertness.\n\n"
            "**Lavender** — a small potted English lavender on a sunny sill offers both ornamental beauty and a mild "
            "calming aroma when touched.\n\n"
            "**Eucalyptus (silver dollar)** — cut stems last weeks in a vase and release a gentle respiratory-supportive scent.\n\n"
            "**Jasmine** — night-blooming and intoxicating; studies place its sedative effect on par with valium at the "
            "receptor level, without the side effects.\n\n"
            "**Aloe Vera** — first-aid plant and air purifier in one. Snap a leaf for minor burns or skin irritation."
        ),
        "cover_image": "https://images.unsplash.com/photo-1659834742700-67c738ee539c",
        "category": "Plants",
        "author": "Olevia Editorial",
        "read_time": "4 min read",
    },
    {
        "title": "Why Cold-Process Soap Is Worth the Wait",
        "excerpt": "The chemistry, the patience, and the skin-loving glycerin that mass-market bars quietly strip away.",
        "content": (
            "Commercial soap is, quite literally, a byproduct — manufacturers of industrial glycerin create soap as a "
            "side effect, then sell the glycerin (the most luxurious, moisturizing component) separately. What remains "
            "is a hard, dehydrating detergent bar.\n\n"
            "Cold-process soap flips the equation. We combine nourishing oils — olive, coconut, shea, castor — with a "
            "careful amount of sodium hydroxide and let saponification do its slow, beautiful work over 4–6 weeks of curing. "
            "Every drop of natural glycerin stays in the bar.\n\n"
            "When you add essential oils, botanical infusions, and clays at 'trace' (the pudding-like stage of emulsion), "
            "you get a functional ritual object: lavender + oatmeal for sensitive skin, activated charcoal + tea tree for "
            "clarifying, rose clay + geranium for a bright glow.\n\n"
            "Olevia's bars cure for a full 6 weeks. They last longer, lather creamier, and leave your skin feeling like "
            "skin — not like it just survived a wash."
        ),
        "cover_image": "https://images.unsplash.com/photo-1605264660294-f060dc6bb0a3",
        "category": "Soaps",
        "author": "Olevia Editorial",
        "read_time": "5 min read",
    },
]

SAMPLE_PRODUCTS = [
    # Diffuser Blends
    {
        "name": "Stillness Diffuser Blend",
        "category": "diffuser_blends",
        "description": "Lavender, bergamot and Roman chamomile come together in a whisper-soft blend for evening unwinding and bedtime rituals.",
        "benefits": ["Reduces stress", "Promotes restful sleep", "Calms the nervous system"],
        "price": 28.0,
        "image": "https://images.pexels.com/photos/7771975/pexels-photo-7771975.jpeg",
        "featured": True,
    },
    {
        "name": "Morning Clarity Diffuser Blend",
        "category": "diffuser_blends",
        "description": "Peppermint, rosemary and sweet orange — a crisp, uplifting blend to start the day with clear focus and gentle energy.",
        "benefits": ["Sharpens focus", "Uplifts mood", "Supports clarity"],
        "price": 28.0,
        "image": "https://images.unsplash.com/photo-1585147369770-3c0663b96b48?auto=format&fit=crop&w=940",
        "featured": True,
    },
    {
        "name": "Forest Breath Diffuser Blend",
        "category": "diffuser_blends",
        "description": "Frankincense, cedarwood and eucalyptus evoke a quiet walk through ancient woods — grounding, deep, breath-opening.",
        "benefits": ["Opens airways", "Grounds the mind", "Deepens breath"],
        "price": 32.0,
        "image": "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=940",
        "featured": False,
    },
    # Roll-ons
    {
        "name": "Release Pain Relief Roll-On",
        "category": "roll_ons",
        "description": "Arnica-infused jojoba with peppermint, wintergreen and ginger — targeted relief for sore muscles, tension headaches and tight shoulders.",
        "benefits": ["Soothes sore muscles", "Eases tension headaches", "Cooling & warming relief"],
        "price": 22.0,
        "image": "https://images.unsplash.com/photo-1647943746660-1640133068d5",
        "featured": True,
    },
    {
        "name": "Calm Anxiety Roll-On",
        "category": "roll_ons",
        "description": "Lavender, vetiver and ylang ylang in fractionated coconut oil — a pulse-point companion for nervous moments and racing thoughts.",
        "benefits": ["Eases anxiety", "Grounds the nervous system", "Pocket-sized ritual"],
        "price": 20.0,
        "image": "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=940",
        "featured": True,
    },
    {
        "name": "Sleep Well Roll-On",
        "category": "roll_ons",
        "description": "Roman chamomile, cedarwood and sweet marjoram in a gentle jojoba base — apply to wrists and soles of feet 20 minutes before bed.",
        "benefits": ["Promotes deep sleep", "Quiets the mind", "Safe for nightly use"],
        "price": 22.0,
        "image": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=940",
        "featured": False,
    },
    # Therapeutic Plants
    {
        "name": "Potted English Lavender",
        "category": "plants",
        "description": "A live, fragrant English lavender plant in a handthrown terracotta pot — touch the leaves anytime for an instant calming aroma.",
        "benefits": ["Live aromatherapy", "Calming scent on demand", "Air-purifying"],
        "price": 34.0,
        "image": "https://images.unsplash.com/photo-1595351479937-7aa5cc64f1cb?auto=format&fit=crop&w=940",
        "featured": False,
    },
    {
        "name": "Rosemary for Memory",
        "category": "plants",
        "description": "A compact upright rosemary — keep it by your desk, brush the leaves while you work, and breathe in the 1,8-cineole that supports focus.",
        "benefits": ["Supports focus & memory", "Culinary use", "Low-maintenance"],
        "price": 28.0,
        "image": "https://images.unsplash.com/photo-1550411294-098063f05f99?auto=format&fit=crop&w=940",
        "featured": False,
    },
    {
        "name": "Aloe Vera Healing Plant",
        "category": "plants",
        "description": "The gentle first-aid plant. Snap a leaf for burns, dry skin, or minor irritations. Thrives on neglect and sun.",
        "benefits": ["Soothes burns", "Air-purifying", "Hardy & forgiving"],
        "price": 24.0,
        "image": "https://images.unsplash.com/photo-1596547609652-9cf5d8c10d4e?auto=format&fit=crop&w=940",
        "featured": False,
    },
    # Soaps
    {
        "name": "Lavender & Oatmeal Cold-Process Soap",
        "category": "soaps",
        "description": "A cured 6-week cold-process bar with organic lavender buds and colloidal oatmeal — gentle enough for sensitive skin, indulgent as a daily ritual.",
        "benefits": ["Calms sensitive skin", "Retains natural glycerin", "Long-lasting lather"],
        "price": 14.0,
        "image": "https://images.unsplash.com/photo-1605264660294-f060dc6bb0a3",
        "featured": True,
    },
    {
        "name": "Charcoal & Tea Tree Soap",
        "category": "soaps",
        "description": "Activated charcoal draws impurities while tea tree clarifies and refreshes. Our pick for oily skin and post-workout washes.",
        "benefits": ["Deep cleansing", "Clarifies pores", "Naturally antibacterial"],
        "price": 14.0,
        "image": "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=940",
        "featured": False,
    },
    {
        "name": "Rose Clay & Geranium Soap",
        "category": "soaps",
        "description": "French pink rose clay with Bourbon geranium — softly floral, softly pink, and leaves the skin with a visible glow.",
        "benefits": ["Brightens skin", "Balances oil", "Luxurious feel"],
        "price": 16.0,
        "image": "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=940",
        "featured": False,
    },
]


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@olevia.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "olevia2025")
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Olevia Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {email}")
    elif not verify_password(password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": email}, {"$set": {"password_hash": hash_password(password)}}
        )
        logger.info(f"Refreshed admin password for: {email}")


async def seed_blogs():
    for post in SAMPLE_BLOGS:
        slug = slugify(post["title"])
        if await db.blog_posts.find_one({"slug": slug}):
            continue
        now = datetime.now(timezone.utc).isoformat()
        await db.blog_posts.insert_one({
            "id": str(uuid.uuid4()),
            "slug": slug,
            **post,
            "created_at": now,
            "updated_at": now,
        })


async def seed_products():
    for p in SAMPLE_PRODUCTS:
        if await db.products.find_one({"name": p["name"]}):
            continue
        await db.products.insert_one({
            "id": str(uuid.uuid4()),
            **p,
            "currency": "USD",
        })


# ---------- Registration & Startup ----------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.blog_posts.create_index("slug", unique=True)
        await db.blog_posts.create_index("id", unique=True)
        await db.products.create_index("id", unique=True)
        await seed_admin()
        await seed_blogs()
        await seed_products()
    except Exception as e:
        logger.exception(f"Startup seeding error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


@api_router.get("/")
async def root():
    return {"message": "Olevia API", "version": "1.0"}
