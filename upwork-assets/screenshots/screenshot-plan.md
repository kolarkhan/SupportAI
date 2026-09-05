# Screenshot Plan — SupportAI

8 screenshots, prioritized in the order a client should see them. Capture at 1440×900 for desktop shots and 390×844 (or similar) for the mobile shot, using the seeded "Acme Cloud" demo data (`npm run db:seed`) logged in as `owner@acmecloud.com`. Use a real browser or headless screenshot tool — don't mock these up in a design tool, since the whole pitch is that this is a working product.

---

### 1. Dashboard Overview

- **Page:** `/dashboard`
- **What should be visible:** The four top stat cards (Total Conversations, AI Resolution Rate, Avg Response Time, Customer Satisfaction), the "Conversations over time" and "AI vs. human resolution" charts, and the "Recent conversations" list with status badges.
- **Data displayed:** Real seeded metrics (e.g., 24 conversations, ~90% AI resolution) and 5–6 real recent conversations with customer names and status pills (AI Handling / Open / Resolved / Waiting / Human Required).
- **Why it's valuable:** This is the single image that proves "this is a real, working dashboard" in one glance — it's usually the first (and sometimes only) screenshot a client scans before deciding to open the profile.

### 2. AI Chat Widget — Live Conversation

- **Page:** `/chat/<agentId>` (the public hosted chat page)
- **What should be visible:** The agent header (avatar, name, "Online" status), a real customer question and a streamed AI answer bubble, and the suggested-question chips if the conversation is fresh.
- **Data displayed:** A realistic support question (e.g., "What is your refund policy?") answered with an actual grounded response from the seeded knowledge base.
- **Why it's valuable:** This is the product from the *end customer's* point of view — the part every prospective client is really buying. It needs to look clean and trustworthy, not like a debug console.

### 3. RAG Source Attribution (Conversation Detail)

- **Page:** `/dashboard/conversations/[id]` — a conversation where the AI answered
- **What should be visible:** An AI message bubble with its confidence badge (e.g., "82% confidence") and the "Sources used" panel underneath, listing the document name and match percentage.
- **Data displayed:** A real answer traced back to a real uploaded document or FAQ.
- **Why it's valuable:** This is the proof point that separates a real RAG system from "ChatGPT with a system prompt" — clients evaluating AI vendors specifically look for grounding/traceability, and this screenshot answers that question visually without needing an explanation.

### 4. Knowledge Base — Document Upload & Processing

- **Page:** `/dashboard/knowledge/documents`
- **What should be visible:** The drag-and-drop upload zone, and a list of documents with status badges (Processed / Processing / Failed) and chunk counts.
- **Data displayed:** A few real processed documents (e.g., "Company Policies.pdf", "Product Documentation.pdf") with realistic chunk counts.
- **Why it's valuable:** Shows the ingestion pipeline is a real, observable process (not a black box) — clients want to see that failures are visible and documents are actually indexed, not just "uploaded."

### 5. Agent Builder — Configuration

- **Page:** `/dashboard/agent` (Behavior or Human Handoff tab)
- **What should be visible:** The toggles for "Answer only from knowledge base," "Escalate uncertain questions," the confidence threshold, and the escalation keywords field.
- **Data displayed:** Real default configuration values (e.g., confidence threshold 0.55, keywords "refund, cancel, legal, angry, speak to a human, manager").
- **Why it's valuable:** Demonstrates that escalation behavior is genuinely configurable by a non-technical business owner, not hardcoded — a key differentiator from a fixed chatbot script.

### 6. Human Handoff in Action

- **Page:** `/dashboard/conversations/[id]` — a conversation with status "Human Required"
- **What should be visible:** The red "AI has handed this conversation to you" banner, the message thread showing the escalation point, and the human-agent reply composer.
- **Data displayed:** A real escalated conversation (e.g., triggered by an escalation keyword or low confidence).
- **Why it's valuable:** This is the trust-building shot — it proves the system doesn't just "hope" the AI is right, it has a real, visible safety net.

### 7. Analytics Dashboard

- **Page:** `/dashboard/analytics`
- **What should be visible:** The 8-metric stat grid, the "AI vs. human resolution" stacked bar chart with legend, the "Escalation reasons" donut chart, and the "Top customer questions" horizontal bar chart.
- **Data displayed:** Real aggregated data over the seeded 30-day period.
- **Why it's valuable:** Shows the product isn't just a chat window — it's a manageable business tool with reporting a support lead would actually use to justify the investment.

### 8. Mobile / Responsive View

- **Page:** `/dashboard` and/or `/chat/<agentId>` at a phone-width viewport (~390px)
- **What should be visible:** The dashboard collapsed into a single-column mobile layout with the hamburger menu, or the chat widget filling a phone-sized screen.
- **Data displayed:** Same real data as the desktop shots, just at mobile width.
- **Why it's valuable:** A large share of Upwork clients will check this on their phone before ever opening a laptop — showing it isn't broken on mobile (a common failure point for portfolio pieces) directly builds confidence in the code quality.

---

## General guidance

- Always use real seeded data — never lorem ipsum or placeholder "Customer 1 / Customer 2" names in a screenshot meant to sell the product.
- Keep browser chrome out of the frame (or use a clean mock browser bar) so the focus stays on the product.
- Take shots in both light contexts consistently — don't mix inconsistent zoom levels or window sizes across the set.
- If any screenshot requires interacting with a chart tooltip or a dropdown to look its best, capture that interaction state deliberately rather than the default idle state.
