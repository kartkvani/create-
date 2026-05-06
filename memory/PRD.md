# Olevia — Aromatherapy Website

## Original Problem Statement
Create an aromatherapy website for healing people — brand name **Olevia**, slogan **"Balance Begins Here"**. Home page (what is aromatherapy + history), Products page (diffuser blends, roll-ons / pain blends, therapeutic plants, soaps), Blogs page.

## User Choices (session 1)
- E-commerce: **Display only** (catalog + Inquire via WhatsApp / email)
- Blogs: **Pre-populated sample posts + admin panel** to create/edit/delete
- Contact / Newsletter: **Skip**
- Product images: **Curated stock images** (Unsplash / Pexels)
- Design vibe: **Calming earthy / editorial** (sage green + cream + amber — Cormorant Garamond + Manrope)

## Architecture
- **Backend**: FastAPI + Motor (MongoDB). All routes `/api/*`. JWT (Bearer) auth for single admin. Idempotent seeding on startup (admin + 12 products + 5 blogs).
- **Frontend**: React 19 + React Router 7 + Tailwind + framer-motion + Lenis smooth scroll. AuthContext with localStorage (`olevia_token`).
- **Pages**: `/`, `/products`, `/blogs`, `/blogs/:slug`, `/login`, `/admin`.

## Implemented (2026-05-05 · session 1)
- Home: hero with slogan, "What is Aromatherapy" editorial section, bento grid of 5 benefits (Sleep/Focus/Breath/Pain/Mood), vertical timeline of aromatherapy history, featured products, latest journal, CTA.
- Products: category filter pills, editorial product cards with image/description/benefits/price, Inquire modal (WhatsApp + Email + Copy message).
- Blogs: hero post + grid; detail page with preserved formatting.
- Admin: protected dashboard with table + modal editor to create/edit/delete blogs.
- Login: JWT Bearer token, error formatting.
- Navbar (sticky, mobile hamburger full-screen) + Forest-green rounded footer.
- Design: Cormorant Garamond + Manrope fonts, sage/cream/amber palette, grain overlays, staggered fade-ups.
- Backend: `/api/auth/login`, `/api/auth/me`, `/api/products` (+ category filter), `/api/blogs` CRUD (read public, write admin), bcrypt + PyJWT, idempotent seed.
- 17/18 backend pytest tests pass. Frontend flows verified end-to-end.

## Test Credentials
- Admin: `admin@olevia.com` / `olevia2025` (see `/app/memory/test_credentials.md`).

## Backlog
- **P1**: Resend/SendGrid integration for "Inquire" form submissions so inquiries land in an inbox instead of relying on external WhatsApp/mailto intents. Newsletter signup.
- **P1**: Per-product detail page (`/products/:slug`) with extended story, ingredients, ritual instructions.
- **P2**: Stripe/Razorpay checkout when ready to sell online.
- **P2**: Rich-text / markdown editor for the admin blog modal (currently plain textarea with `\n` handling).
- **P2**: Rate-limit login endpoint + brute-force lockout.
- **P3**: Cover image uploads (currently URL-only) via cloud storage.
- **P3**: SEO meta tags per page + OG images.
