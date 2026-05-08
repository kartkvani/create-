# Olevia – Aromatherapy Brand Site

## Original Problem Statement
- User uploaded a self-contained vanilla HTML/CSS/JS site (`/app/olevia.html`) for the Olevia aromatherapy brand and asked to:
  1. Set `olevia.html` as the live app.
  2. Remove the "5 min read" journal blog ("Why Scent Reaches the Brain Before Thought Does") shown on the Shop/Journal tab.

## Architecture
- The CRA frontend (`/app/frontend`) renders a tiny shim (`App.js`) that redirects `/` → `/olevia.html`.
- The actual site lives at `/app/frontend/public/olevia.html` (copied from `/app/olevia.html`). Edit either, then re-copy to public for changes to go live.
- Backend (`/app/backend`) and MongoDB are unused for this static site.

## Implemented (Feb 2026)
- **Live serve of olevia.html**: `App.js` replaces window location to `/olevia.html`; the file is served from CRA's public folder.
- **Removed blog `b1`** (`Why Scent Reaches the Brain Before Thought Does`, 5 min read) from the `BLOGS` array in `olevia.html`. Journal hero now starts with `The Roll-On Ritual` (b2). Shop tab unaffected (products-only as before).
- **Removed blog `b2`** (`The Roll-On Ritual: Topical Aromatherapy for the Rest of Us`) — was bleeding into the Active Blends page. Journal hero now starts with `Gattefossé and the Burn That Changed Everything` (b3).
- **Fixed malformed HTML in `#page-blogs`**: removed an extra `</div>` after `blogs-header` that was prematurely closing the page wrapper, causing `#blogs-hero-section` and `#blogs-grid-section` to render outside `.page` and leak onto the Shop/Active Blends view.
- **Renamed Diffuser Blend (`p4`) → "Seasonal Change", price set to $15** in the Active Blends page.
- **Updated cold-process soap blog (`b4`) cover image** to a verified Unsplash URL of artisan soap bars with lavender (replaced broken Pexels link).

## Files of Reference
- `/app/olevia.html` – source of truth for site content (BLOGS / PRODUCTS hardcoded JS arrays, line ~1248 onward).
- `/app/frontend/public/olevia.html` – served copy; must be re-synced after edits.
- `/app/frontend/src/App.js` – redirect shim.

## Backlog / Roadmap
- P1: Decide whether to symlink `/app/frontend/public/olevia.html` → `/app/olevia.html` to avoid the manual copy step.
- P2: Wire "Inquire" buttons to a backend endpoint (FastAPI + Mongo) for product enquiries / order capture.
- P2: Migrate hardcoded BLOGS / PRODUCTS arrays into a small JSON or backend service for easier content updates.
- P3: Optimise base64 image payload (file is 4 MB) by extracting images to `/public/img/`.

## Test Credentials
- N/A – static site, no auth.
