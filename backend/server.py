from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# ── Inquiry models & email endpoint ──────────────────────────────────────────
class InquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(min_length=5, max_length=2000)
    product_id: Optional[str] = None
    product_name: Optional[str] = None


def _send_inquiry_email(payload: InquiryCreate) -> None:
    host = os.environ['SMTP_HOST']
    port = int(os.environ['SMTP_PORT'])
    user = os.environ['SMTP_USER']
    password = os.environ['SMTP_PASSWORD']
    to_addr = os.environ['INQUIRY_TO_EMAIL']

    subject_product = payload.product_name or 'General'
    msg = EmailMessage()
    msg['Subject'] = f"New Olevia Inquiry — {subject_product}"
    msg['From'] = f"Olevia Site <{user}>"
    msg['To'] = to_addr
    msg['Reply-To'] = f"{payload.name} <{payload.email}>"

    text_body = (
        f"You have a new product inquiry from the Olevia site.\n\n"
        f"Name:    {payload.name}\n"
        f"Email:   {payload.email}\n"
        f"Product: {subject_product}"
        + (f" (id: {payload.product_id})" if payload.product_id else "")
        + f"\n\nMessage:\n{payload.message}\n"
    )
    html_body = f"""
    <div style="font-family:Georgia,serif;color:#1f2a24;max-width:560px">
      <h2 style="color:#3d5240;margin:0 0 12px">New inquiry — {subject_product}</h2>
      <table style="font-size:14px;line-height:1.6">
        <tr><td><strong>Name</strong></td><td style="padding-left:12px">{payload.name}</td></tr>
        <tr><td><strong>Email</strong></td><td style="padding-left:12px"><a href="mailto:{payload.email}">{payload.email}</a></td></tr>
        <tr><td><strong>Product</strong></td><td style="padding-left:12px">{subject_product}{f' (id: {payload.product_id})' if payload.product_id else ''}</td></tr>
      </table>
      <h3 style="color:#3d5240;margin-top:20px">Message</h3>
      <p style="white-space:pre-wrap;background:#faf6ee;padding:14px 16px;border-radius:8px">{payload.message}</p>
      <p style="font-size:12px;color:#7a7a7a;margin-top:24px">Reply directly to this email to respond to {payload.name}.</p>
    </div>
    """
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype='html')

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(user, password)
        server.send_message(msg)


@api_router.post("/inquiries")
async def create_inquiry(inquiry: InquiryCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": inquiry.name,
        "email": inquiry.email,
        "message": inquiry.message,
        "product_id": inquiry.product_id,
        "product_name": inquiry.product_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "email_sent": False,
        "email_error": None,
    }
    try:
        _send_inquiry_email(inquiry)
        doc["email_sent"] = True
    except Exception as e:
        doc["email_error"] = str(e)
        logger.exception("Failed to send inquiry email")
        # Persist regardless so we never lose a lead
        await db.inquiries.insert_one(doc)
        raise HTTPException(status_code=502, detail="Could not send email. Please try again or use WhatsApp / direct email.")

    await db.inquiries.insert_one(doc)
    return {"ok": True, "id": doc["id"]}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()