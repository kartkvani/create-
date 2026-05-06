"""Iteration 3 tests: POST /api/inquiries rate-limit + GET /api/inquiries/analytics.

Also verifies:
- _rate_ip field is never leaked in responses.
- Previous endpoints (login, blogs, products) regression.

Note: Resend live — each successful POST actually sends email to kartk.vani@gmail.com.
Tests keep total created inquiries small and clean up everything created via DELETE.
"""
import os
import time
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@olevia.com"
ADMIN_PASSWORD = "olevia2025"


# ---------- fixtures ----------

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
def sample_products(api):
    r = api.get(f"{BASE_URL}/api/products")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 3
    return items


def _make_payload(product, suffix, ip):
    return {
        "name": f"TEST_ RateLimit {suffix}",
        "email": f"ratelimit-{suffix}@example.com",
        "message": f"Test inquiry for rate limit / analytics suite #{suffix}.",
        "product_id": product["id"],
        "product_name": product["name"],
    }


# ---------- cleanup helper ----------

def _cleanup_test_inquiries(api, auth_headers):
    r = api.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
    if r.status_code != 200:
        return 0
    removed = 0
    for inq in r.json():
        if isinstance(inq.get("name"), str) and inq["name"].startswith("TEST_"):
            dr = api.delete(f"{BASE_URL}/api/inquiries/{inq['id']}", headers=auth_headers)
            if dr.status_code == 200:
                removed += 1
    return removed


@pytest.fixture(scope="module", autouse=True)
def cleanup_after_module(api, auth_headers):
    # baseline cleanup BEFORE tests so counts are predictable
    _cleanup_test_inquiries(api, auth_headers)
    yield
    _cleanup_test_inquiries(api, auth_headers)


# ---------- 1. Rate-limit ----------

class TestRateLimit:
    IP = "203.0.113.77"  # TEST-NET-3 reserved; unique per run

    def test_five_succeed_then_sixth_429(self, api, sample_products):
        headers = {"Content-Type": "application/json", "X-Forwarded-For": self.IP}
        product = sample_products[0]
        successes = 0
        for i in range(5):
            r = requests.post(
                f"{BASE_URL}/api/inquiries",
                json=_make_payload(product, f"rl{i}", self.IP),
                headers=headers,
                timeout=20,
            )
            # Most should succeed; allow one transient fail but require >=4
            if r.status_code == 200:
                successes += 1
            elif r.status_code == 429:
                # Unexpected early limit (possibly polluted from prior run) - break
                break
        assert successes >= 4, f"Expected >=4 successes before limit, got {successes}"

        # Next should be 429
        r = requests.post(
            f"{BASE_URL}/api/inquiries",
            json=_make_payload(product, "rl_over", self.IP),
            headers=headers,
            timeout=20,
        )
        assert r.status_code == 429, f"Expected 429, got {r.status_code}: {r.text}"
        detail = r.json().get("detail", "").lower()
        assert "too many" in detail or "rate" in detail or "try again" in detail

    def test_different_ip_not_blocked(self, api, sample_products):
        # A distinct IP should not be affected by the first IP's bucket
        different_ip = "198.51.100.42"  # TEST-NET-2
        headers = {"Content-Type": "application/json", "X-Forwarded-For": different_ip}
        r = requests.post(
            f"{BASE_URL}/api/inquiries",
            json=_make_payload(sample_products[1], "diffip", different_ip),
            headers=headers,
            timeout=20,
        )
        assert r.status_code == 200, f"Different IP should not be rate-limited: {r.status_code} {r.text}"
        body = r.json()
        assert "_rate_ip" not in body
        assert body["status"] == "new"

    def test_fallback_no_xff_header_path(self, api, sample_products):
        # Without X-Forwarded-For, server falls back to request.client.host.
        # We just verify the endpoint still functions (returns 200 or 429 cleanly).
        r = requests.post(
            f"{BASE_URL}/api/inquiries",
            json=_make_payload(sample_products[2], "noxff", "none"),
            headers={"Content-Type": "application/json"},
            timeout=20,
        )
        assert r.status_code in (200, 429), r.text
        if r.status_code == 200:
            assert "_rate_ip" not in r.json()


# ---------- 2. GET /api/inquiries/analytics ----------

class TestAnalyticsAuth:
    def test_analytics_requires_auth(self, api):
        r = api.get(f"{BASE_URL}/api/inquiries/analytics")
        assert r.status_code == 401

    def test_analytics_shape_with_admin(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/inquiries/analytics", headers=auth_headers)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ("total", "new", "handled", "top_products", "daily"):
            assert key in data, f"Missing key: {key}"
        assert isinstance(data["total"], int)
        assert isinstance(data["new"], int)
        assert isinstance(data["handled"], int)
        assert isinstance(data["top_products"], list)
        assert isinstance(data["daily"], list)
        # daily always 7 entries covering last 7 days ending today
        assert len(data["daily"]) == 7
        today_iso = date.today().isoformat()
        dates = [d["date"] for d in data["daily"]]
        assert dates[-1] == today_iso, f"Last daily entry should be today {today_iso}, got {dates[-1]}"
        # Ensure strictly consecutive previous 6 days
        for i, d_entry in enumerate(data["daily"]):
            expected = (date.today() - timedelta(days=6 - i)).isoformat()
            assert d_entry["date"] == expected, f"daily[{i}].date should be {expected}, got {d_entry['date']}"
            assert isinstance(d_entry["count"], int)


class TestAnalyticsAggregation:
    created_ids: list = []

    def test_top_products_aggregation(self, api, auth_headers, sample_products):
        # Clean slate for deterministic top_products
        _cleanup_test_inquiries(api, auth_headers)

        # Use 3 distinct products: counts 3 / 2 / 1
        # Use a throw-away IP not used elsewhere to avoid rate-limit collision.
        ip = "198.51.100.200"
        headers = {"Content-Type": "application/json", "X-Forwarded-For": ip}
        plan = [
            (sample_products[0], 3),
            (sample_products[1], 2),
            (sample_products[2], 1),
        ]
        created = []
        for product, count in plan:
            for i in range(count):
                r = requests.post(
                    f"{BASE_URL}/api/inquiries",
                    json=_make_payload(product, f"agg-{product['id'][:6]}-{i}", ip),
                    headers=headers,
                    timeout=20,
                )
                if r.status_code == 429:
                    # Switch IP mid-way to bypass per-IP rate limit
                    ip = f"198.51.100.{201 + len(created)}"
                    headers = {"Content-Type": "application/json", "X-Forwarded-For": ip}
                    r = requests.post(
                        f"{BASE_URL}/api/inquiries",
                        json=_make_payload(product, f"agg-{product['id'][:6]}-{i}r", ip),
                        headers=headers,
                        timeout=20,
                    )
                assert r.status_code == 200, f"Seeding failed: {r.status_code} {r.text}"
                body = r.json()
                assert "_rate_ip" not in body, "Response leaked _rate_ip"
                created.append(body["id"])
        TestAnalyticsAggregation.created_ids = created

        # Also create one with null/empty product_name to verify it's excluded from top
        r_null = requests.post(
            f"{BASE_URL}/api/inquiries",
            json={
                "name": "TEST_ NullProd",
                "email": "nullprod@example.com",
                "message": "Generic question with no product attached at all.",
            },
            headers={"Content-Type": "application/json", "X-Forwarded-For": "198.51.100.250"},
            timeout=20,
        )
        assert r_null.status_code == 200, r_null.text
        TestAnalyticsAggregation.created_ids.append(r_null.json()["id"])

        # Fetch analytics and verify aggregation
        time.sleep(1)
        r = api.get(f"{BASE_URL}/api/inquiries/analytics", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()

        top = data["top_products"]
        assert len(top) >= 3
        # Must be sorted desc by count
        counts = [p["count"] for p in top]
        assert counts == sorted(counts, reverse=True), f"top_products not sorted desc: {counts}"

        # Our 3 seeded products should appear with expected counts
        by_name = {p["product_name"]: p["count"] for p in top}
        for product, expected_count in plan:
            assert product["name"] in by_name, f"{product['name']} missing in top_products"
            assert by_name[product["name"]] >= expected_count

        # None entries must not leak in (i.e., no top entry with null product_name)
        for p in top:
            assert p["product_name"] is not None

        # totals include the null-product inquiry
        assert data["total"] >= 7  # 3+2+1+1

        # today's daily count should be >= 7 (all we just created land on today)
        today_iso = date.today().isoformat()
        today_entry = next(d for d in data["daily"] if d["date"] == today_iso)
        assert today_entry["count"] >= 7

    def test_list_inquiries_does_not_leak_rate_ip(self, api, auth_headers):
        r = api.get(f"{BASE_URL}/api/inquiries", headers=auth_headers)
        assert r.status_code == 200
        for inq in r.json():
            assert "_rate_ip" not in inq
            assert "_id" not in inq


# ---------- 3. Regression ----------

class TestRegression:
    def test_login(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200

    def test_products(self, api):
        r = api.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        assert len(r.json()) >= 12

    def test_blogs(self, api):
        r = api.get(f"{BASE_URL}/api/blogs")
        assert r.status_code == 200
        assert len(r.json()) >= 5
