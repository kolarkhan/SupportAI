# Upwork Sales & Portfolio Assets — SupportAI

This folder contains everything needed to present and sell SupportAI on Upwork: portfolio copy, a case study, a demo video script, a screenshot plan, and a full service/pricing offering.

**This folder is entirely separate from the application.** Nothing here affects `src/`, `prisma/`, or any running code — it's marketing and sales content only, describing the app that already exists in this repository.

## Folder Structure

```
upwork-assets/
├── portfolio/        # Copy for an Upwork portfolio project entry
├── case-study/        # A full technical case study (also reusable as a blog post / LinkedIn article)
├── demo/               # A timed script for a 60–90 second demo video
├── screenshots/        # A shot list for the portfolio's image gallery
├── service/            # An Upwork "Services" (fixed-scope offering) listing
└── README.md            # This file
```

## Accuracy — read this before publishing anything

Every claim in these files was written after inspecting the actual SupportAI codebase, not assumed. In particular:

- **What's real:** the full RAG pipeline (extraction → chunking → embedding → cosine-similarity retrieval → grounded generation), streaming chat, confidence-based human handoff, ticket auto-creation, multi-tenant workspace isolation, role-based permissions, and a working analytics dashboard.
- **What's honestly framed as a capability, not a proven metric:** response-time and satisfaction figures shown in the demo dashboard come from seeded demo data for presentation purposes, not from a live paying customer — the files here never claim otherwise.
- **What's explicitly NOT implemented (don't oversell these):** third-party integrations (Slack, Zendesk, etc. — shown only as a landing-page marketing/roadmap section), billing/payment processing, multi-page website crawling (current ingestion is one URL per source), and outbound email delivery for notifications/password resets.

If you add new claims to any of these files later, hold them to the same bar: verify against the code, or label it as a "capability" rather than a "result."

## How to use each part

### Portfolio (`portfolio/`)

1. Pick a title from `portfolio-title.md`.
2. Use `portfolio-description.md` as the short overview field on the Upwork portfolio project.
3. Use `project-details.md` for the longer body/detail section (Upwork portfolio entries support a full write-up — paste this in, trimming if there's a length limit).
4. Add the tags from `skills.md` to both the portfolio project and your profile's skills.
5. Attach 6–8 images from the `screenshots/` plan and, ideally, the demo video.

### Screenshots (`screenshots/screenshot-plan.md`)

Work through the 8 shots in order — they're already prioritized. Use the real seeded demo workspace ("Acme Cloud," via `npm run db:seed`), not placeholder data. Recommended order in the actual Upwork gallery: Dashboard → AI Chat → RAG Sources → Knowledge Base → Agent Builder → Human Handoff → Analytics → Mobile, so the strongest "does this actually work" proof (dashboard, live chat, RAG sources) appears first.

### Demo video (`demo/demo-script.md`)

1. Reseed the database (`npm run db:seed`) for clean, realistic data right before recording.
2. Record screen capture following each timed section.
3. Record voiceover separately and sync in editing — don't rely on live narration matching the screen timing exactly.
4. Add captions — most portfolio views happen muted.
5. Upload the finished video to the Upwork portfolio project alongside the screenshots.

### Service listing (`service/`)

1. `service-title.md` → the Upwork Service listing title.
2. `service-description.md` → the short + full description fields.
3. `pricing-packages.md` → set up as three Upwork service tiers (Basic / Standard / Premium). Treat the price ranges as a starting point for your own market/rate calibration, not a fixed rate card — adjust for your experience level and target market.
4. `faq.md` → paste directly into the Upwork Service FAQ section.

## Customization ideas

- **Swap in your own name/branding** in the "My Role" section of `project-details.md` and anywhere the case study refers to "I built."
- **Adjust pricing** in `pricing-packages.md` to your actual market/experience level — the ranges given are reasonable starting points, not a mandate.
- **Tailor the FAQ** if you already know your typical client's biggest objection (budget, timeline, "will it replace my whole team," etc.) — add a targeted answer.
- **Re-record the demo** whenever you add a genuinely new feature to the underlying app — keep the video in sync with what the product actually does.
- **Localize or vertical-ize** the case study for a specific niche (e.g., "AI Support for E-Commerce") if you're targeting a specific client industry — the underlying architecture description stays accurate either way.

## When you extend the actual application

If you build new features into SupportAI later, revisit these files — especially `project-details.md`, `case-study.md`, and `faq.md` — and update the "what's real" vs. "what's not yet built" lists accordingly. Selling a feature that used to be aspirational-but-is-now-real is a good problem to have; selling one that's still aspirational as if it's shipped is the mistake this whole folder was written to avoid.
