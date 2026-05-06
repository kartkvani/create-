"""Olevia inquiry endpoint tests - POST/GET/PATCH/DELETE + Resend email."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@olevia.com"
ADMIN_PASSWORD = "olevia2025"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text}")
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def sample_product(api):
    r = api.get(f"{BASE_URL}/api/products")
    assert r.status_code == 200
    return r.json()[0]


# ---------- Inquiry CREATE ----------
class TestInquiryCreate:
    def test_create_inquiry_success(self, api, sample_product):
        payload = {
            "name": "TEST_ Test User",
            "email": "test-inquiry@example.com",
            "message": "Hello, I am interested in this product. Please send details.",
            "product_id": sample_product["id"],
            "product_name": sample_product["name"],
        }
        r = api.post(f"{BASE_URL}/api/inquiries", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert data["message"] == payload["message"]
        assert data["product_id"] == sample_product["id"]
        assert data["product_name"] == sample_product["name"]
        assert data["status"] == "new"
        assert "email_sent" in data
        assert "_id" not in data
        # Stash for later tests
        TestInquiryCreate.inquiry_id = data["id"]
        TestInquiryCreate.email_sent = data["email_sent"]

    def test_email_sent_true(self):
        # Verifies Resend integration succeeded (live key + verified destination)
        assert TestInquiryCreate.email_sent is True, (
            "email_sent should be True with live Resend key and verified destination"
        )

    def test_invalid_email_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/inquiries", json={
            "name": "TEST_ Bad Email",
            "email": "not-an-email",
            "message": "Hello there friend",
        })
        assert r.status_code == 422

    def test_short_message_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/inquiries", json={
            "name": "TEST_ Short Msg",
            "email": "ok@example.com",
            "message": "hi",
        })
        assert r.status_code == 422

    def test_short_name_returns_422(self, api):
        r = api.post(f"{BASE_URL}/api/inquiries", json={
            "name": "A",
            "email": "ok@example.com",
            "message": "Hello there friend",
        })
        assert r.status_code == 422


# ---------- Inquiry LIST (admin) ----------
class TestInquiryList:
    def test_list_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/inquiries")
        assert r.status_code == 401

    def test_list_with_admin(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        # Sorted desc by created_at
        dates = [i["created_at"] for i in items]
        assert dates == sorted(dates, reverse=True), "Inquiries not sorted desc by created_at"
        # No ObjectId leak
        for i in items:
            assert "_id" not in i
        # Must contain the inquiry created above
        ids = [i["id"] for i in items]
        assert TestInquiryCreate.inquiry_id in ids


# ---------- Inquiry PATCH ----------
class TestInquiryUpdate:
    def test_patch_to_handled(self, api, auth_headers):
        iid = TestInquiryCreate.inquiry_id
        r = api.patch(f"{BASE_URL}/api/inquiries/{iid}?status=handled", headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "handled"
        # Verify persistence
        r2 = api.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        match = next((i for i in r2.json() if i["id"] == iid), None)
        assert match is not None
        assert match["status"] == "handled"

    def test_patch_invalid_status_returns_400(self, api, auth_headers):
        iid = TestInquiryCreate.inquiry_id
        r = api.patch(f"{BASE_URL}/api/inquiries/{iid}?status=bogus", headers=auth_headers)
        assert r.status_code == 400

    def test_patch_unknown_id_returns_404(self, api, auth_headers):
        r = api.patch(f"{BASE_URL}/api/inquiries/does-not-exist-xyz?status=new", headers=auth_headers)
        assert r.status_code == 404

    def test_patch_requires_auth(self, api):
        iid = TestInquiryCreate.inquiry_id
        r = api.patch(f"{BASE_URL}/api/inquiries/{iid}?status=new")
        assert r.status_code == 401


# ---------- Inquiry DELETE ----------
class TestInquiryDelete:
    def test_delete_requires_auth(self, api):
        iid = TestInquiryCreate.inquiry_id
        r = api.delete(f"{BASE_URL}/api/inquiries/{iid}")
        assert r.status_code == 401

    def test_delete_success(self, api, auth_headers):
        iid = TestInquiryCreate.inquiry_id
        r = api.delete(f"{BASE_URL}/api/inquiries/{iid}", headers=auth_headers)
        assert r.status_code == 200

    def test_delete_again_returns_404(self, api, auth_headers):
        iid = TestInquiryCreate.inquiry_id
        r = api.delete(f"{BASE_URL}/api/inquiries/{iid}", headers=auth_headers)
        assert r.status_code == 404


# ---------- Regression: previous endpoints still healthy ----------
class TestRegression:
    def test_products_still_works(self, api):
        r = api.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        assert len(r.json()) >= 12

    def test_blogs_still_works(self, api):
        r = api.get(f"{BASE_URL}/api/blogs")
        assert r.status_code == 200
        assert len(r.json()) >= 5

    def test_login_still_works(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
