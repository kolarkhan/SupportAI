# Demo Video Script — SupportAI (60–90 seconds)

**Goal:** show a working product, not slides. Every shot below uses real seeded demo data ("Acme Cloud" workspace) — no mockups needed.

**Before recording:**
- Run `npm run db:seed` for clean, realistic demo data (customers, conversations, tickets, FAQs, sample documents already show ~90% AI resolution, which is real seeded data, not a scripted claim).
- Log in as `owner@acmecloud.com` in one browser tab; have the public chat page (`/chat/<agentId>`, printed by the seed script) open in a second tab or a phone/responsive view.
- Record at 1440×900 (desktop) with one short mobile-viewport cut for the responsive shot.
- Use screen capture + a clean voiceover recorded separately, synced in editing — don't rely on live narration timing.

---

### 0:00–0:10 — Hook & Problem

**On screen:** Start on the SupportAI landing page hero (`/`), then a quick cut to a blank/generic "AI chatbot gives wrong answer" visual metaphor (optional — can skip and stay on the hero if keeping it simple).

**Click:** none yet — just let the hero load, the entrance animation plays automatically.

**Voice-over:**
> "Most AI chatbots either make things up, or have no way to bring in a human when they should. SupportAI does neither — it's an AI support agent that only answers from your own content, and knows exactly when to hand off."

**Duration:** 10s

---

### 0:10–0:25 — Dashboard

**On screen:** Cut to the logged-in dashboard overview (`/dashboard`) — stat cards (Total Conversations, AI Resolution Rate, Avg Response Time, Customer Satisfaction), the conversations-over-time chart, and the recent conversations list.

**Click:** Land directly on `/dashboard` (already logged in). Optionally hover over a chart to show the tooltip.

**Voice-over:**
> "Everything lives in one dashboard — live conversation volume, resolution rate, response time, and what's happening right now, all pulled from real conversation data."

**Duration:** 15s

---

### 0:25–0:40 — Knowledge Base / Document Upload

**On screen:** Navigate to Knowledge Base → Documents (`/dashboard/knowledge/documents`). Show the existing processed documents list (status badges: Processed, chunk counts), then drag a sample PDF onto the upload zone and show it move through Queued → Processing → Processed.

**Click:** Sidebar → "Knowledge Base" → "Documents" tab → drag-and-drop a file (or click "Choose files").

**Voice-over:**
> "Training the agent means uploading what you already have — PDFs, docs, spreadsheets, even a website URL. It's chunked, embedded, and searchable within seconds."

**Duration:** 15s

---

### 0:40–0:55 — AI Customer Conversation

**On screen:** Switch to the public chat widget (`/chat/<agentId>`). Type a real question that matches the seeded knowledge base, e.g. **"What is your refund policy?"** Show the typing indicator, then the streamed response appearing token-by-token.

**Click:** Click into the message input, type the question, press Enter (or click Send).

**Voice-over:**
> "From the customer's side, it's a clean chat experience — and the answer isn't generic. It's generated live, streaming in real time, grounded in the business's actual documentation."

**Duration:** 15s

---

### 0:55–1:10 — RAG Sources & Human Handoff

**On screen:** Cut to the dashboard's conversation detail view (`/dashboard/conversations/:id`) for that same conversation, showing the AI message with its confidence badge and "Sources used" panel (document name + match score) — the widget itself keeps the customer-facing view clean; source attribution is a staff-facing feature. Then show an escalation: send a message like **"I want to speak to a human about a refund"** in the widget and cut back to the dashboard to show the conversation flip to "Human Required" with the warning banner.

**Click:** Send an escalation-triggering message in the chat → switch to the dashboard conversation view → point out the "AI has handed this conversation to you" banner.

**Voice-over:**
> "Every answer shows exactly what it came from. And when a question needs a real person — low confidence, a sensitive topic, or the customer just asks — it hands off automatically, with a ticket and a notification already waiting for the team."

**Duration:** 15s

---

### 1:10–1:25 — Analytics & Ticket Management

**On screen:** Cut to Analytics (`/dashboard/analytics`) — show the resolution-rate chart, AI-vs-human breakdown, and escalation-reasons chart. Quick cut to Tickets (`/dashboard/tickets`) showing the auto-created ticket from the escalation, with its priority and status.

**Click:** Sidebar → "Analytics" → (2–3s) → Sidebar → "Tickets".

**Voice-over:**
> "Support leads get real visibility — what's getting resolved, what's escalating, and why — plus a full ticket queue for anything that needs follow-up."

**Duration:** 15s

---

### 1:25–1:30 — Closing CTA

**On screen:** End on the SupportAI logo/hero, or a split screen of the desktop dashboard and the mobile chat widget to emphasize responsiveness. Overlay text: **"Built end-to-end — front-end, back-end, AI pipeline. Let's build yours."**

**Click:** none — static closing frame with overlay text.

**Voice-over:**
> "This is what I build — full-stack AI products, grounded and production-minded. Message me to talk about yours."

**Duration:** 5s

---

## Production notes

- Keep every cut purposeful — no idle mouse movement, no waiting on spinners (trim in editing).
- Captions/subtitles recommended — most Upwork portfolio views are silent/muted.
- If time runs short, the segments that can compress first are 0:00–0:10 (hook) and 1:10–1:25 (analytics/tickets) — the chat + RAG + handoff sequence (0:40–1:10) is the core proof of the AI actually working and should stay full length.
