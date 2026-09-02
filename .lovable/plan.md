# PromptStore-inspired public experience

## Goal
Replace the current generic public landing/login presentation with a dark, marketplace-first AccelDocs experience inspired by PromptStore, without copying its branding or content.

## Changes
- Rebuild the public home page around a compact marketplace header, strong product-search hero, category filters, and dense service listings loaded from the existing catalog.
- Keep clear **Log in** and **Create account** actions in the header, but remove the current oversized promotional landing-page treatment.
- Restyle the authentication page as a focused dark access screen that visually matches the marketplace rather than feeling like a second landing page.
- Preserve all existing authentication, pricing, purchase links, and backend behavior.
- Correct the app title and social metadata to AccelDocs.
- Verify responsive rendering and login navigation on desktop and mobile.

## Technical details
- Update `src/pages/Index.tsx`, `src/pages/Auth.tsx`, and semantic tokens in `src/index.css` only where needed.
- Update `index.html` metadata because the current title and descriptions are template placeholders.
- Reuse the existing service catalog and UI components; no database schema changes.
