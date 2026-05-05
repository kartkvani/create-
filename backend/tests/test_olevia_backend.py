"""Olevia backend API tests - auth, blogs, products."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://olevia-healing.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@olevia.com"
ADMIN_PASSWORD = "olevia2025"


@pytest.fixture(scope="session")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ---------- Health ----------
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json().get("message") == "Olevia API"


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data and isinstance(data["access_token"], str)
        u = data["user"]
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "admin"
        assert "id" in u and "name" in u

    def test_login_wrong_password(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_login_unknown_user(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": "noone@olevia.com", "password": "x"})
        assert r.status_code == 401

    def test_me_with_token(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL
        assert r.json()["role"] == "admin"

    def test_me_without_token(self, api):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


# ---------- Products ----------
class TestProducts:
    def test_list_products(self, api):
        r = api.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 12, f"Expected >=12 products, got {len(items)}"
        sample = items[0]
        for k in ("id", "name", "category", "description", "benefits", "price", "image", "featured"):
            assert k in sample, f"Missing {k}"
        # No mongodb _id leak
        for p in items:
            assert "_id" not in p

    def test_filter_diffuser_blends(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"category": "diffuser_blends"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for p in items:
            assert p["category"] == "diffuser_blends"

    def test_filter_roll_ons(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"category": "roll_ons"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "roll_ons"

    def test_filter_plants(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"category": "plants"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "plants"

    def test_filter_soaps(self, api):
        r = api.get(f"{BASE_URL}/api/products", params={"category": "soaps"})
        assert r.status_code == 200
        for p in r.json():
            assert p["category"] == "soaps"


# ---------- Blogs (Public) ----------
class TestBlogsPublic:
    def test_list_blogs_sorted_desc(self, api):
        r = api.get(f"{BASE_URL}/api/blogs")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 5
        # Verify required fields
        for b in items:
            for k in ("id", "slug", "title", "excerpt", "content",
                      "cover_image", "category", "author", "read_time",
                      "created_at", "updated_at"):
                assert k in b, f"Missing {k}"
            assert "_id" not in b
        # Sorted desc
        dates = [b["created_at"] for b in items]
        assert dates == sorted(dates, reverse=True)

    def test_get_blog_by_slug(self, api):
        # Get any seeded blog and look it up
        r = api.get(f"{BASE_URL}/api/blogs")
        slug = r.json()[0]["slug"]
        r2 = api.get(f"{BASE_URL}/api/blogs/{slug}")
        assert r2.status_code == 200
        assert r2.json()["slug"] == slug

    def test_get_blog_unknown_slug(self, api):
        r = api.get(f"{BASE_URL}/api/blogs/this-slug-does-not-exist-xyz")
        assert r.status_code == 404


# ---------- Blogs (Admin CRUD) ----------
class TestBlogsAdmin:
    def test_create_blog_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/blogs", json={
            "title": "Unauthorized post",
            "excerpt": "Should be blocked here",
            "content": "Content content content content",
            "cover_image": "https://example.com/img.jpg",
        })
        assert r.status_code == 401

    def test_blog_full_crud(self, api, auth_headers):
        # CREATE
        payload = {
            "title": "TEST_ Pytest Created Post",
            "excerpt": "An excerpt for pytest test post",
            "content": "Full content body for pytest verification ritual.",
            "cover_image": "https://images.unsplash.com/photo-1603719614761-f5437f81a61d",
            "category": "Test",
            "author": "Pytest",
            "read_time": "1 min read",
        }
        r = api.post(f"{BASE_URL}/api/blogs", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["title"] == payload["title"]
        assert created["slug"] == "test-pytest-created-post"
        assert "_id" not in created
        blog_id = created["id"]

        # GET by slug to verify persistence
        r2 = api.get(f"{BASE_URL}/api/blogs/{created['slug']}")
        assert r2.status_code == 200
        assert r2.json()["id"] == blog_id

        # UPDATE - change title -> slug regenerates
        upd = {"title": "TEST_ Pytest Updated Title"}
        r3 = api.put(f"{BASE_URL}/api/blogs/{blog_id}", headers=auth_headers, json=upd)
        assert r3.status_code == 200
        updated = r3.json()
        assert updated["title"] == upd["title"]
        assert updated["slug"] == "test-pytest-updated-title"

        # GET via new slug
        r4 = api.get(f"{BASE_URL}/api/blogs/{updated['slug']}")
        assert r4.status_code == 200

        # DELETE
        r5 = api.delete(f"{BASE_URL}/api/blogs/{blog_id}", headers=auth_headers)
        assert r5.status_code == 200

        # Verify gone
        r6 = api.get(f"{BASE_URL}/api/blogs/{updated['slug']}")
        assert r6.status_code == 404

    def test_delete_nonexistent_returns_404(self, api, auth_headers):
        r = api.delete(f"{BASE_URL}/api/blogs/does-not-exist-uuid", headers=auth_headers)
        assert r.status_code == 404

    def test_update_nonexistent_returns_404(self, api, auth_headers):
        r = api.put(f"{BASE_URL}/api/blogs/does-not-exist-uuid",
                    headers=auth_headers, json={"title": "x"})
        assert r.status_code == 404
