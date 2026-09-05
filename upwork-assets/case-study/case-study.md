# Case Study: SupportAI — An AI Customer Support Platform Built on Real RAG

## Project Overview

SupportAI is a multi-tenant SaaS platform that lets a business train an AI support agent on its own knowledge (documents, a website, FAQs), deploy it via an embeddable chat widget or hosted chat page, and manage the full support lifecycle — conversations, human handoff, tickets, team roles, and analytics — from one dashboard.

It was built solo, full-stack, from data model to UI polish, as a demonstration of production-grade AI product architecture: not a single-file chatbot demo, but a system with authentication, authorization, multi-tenancy, a real retrieval pipeline, and the operational tooling a support team would actually need.

## Business Problem

AI chatbots have a trust problem. Two failure modes show up constantly in real deployments:

1. **Hallucination.** A model answering from general training data will confidently invent a refund policy, a price, or a feature that doesn't exist — a serious liability for a support channel.
2. **No safe exit.** Even a well-grounded AI will hit questions it shouldn't answer alone (billing disputes, legal requests, an angry customer). Without a reliable, automatic path to a human, the AI either keeps guessing or the business has no visibility that a customer is stuck.

A business evaluating "AI support" needs both problems solved together — grounded answers *and* a trustworthy escalation path — or the tool isn't safe to put in front of real customers.

## Proposed Solution

Build the AI agent so it can *only* speak from content the business actually gave it, and give it explicit, configurable rules for stepping back to a human — with the resulting handoff, ticket, and notification happening automatically, not as an afterthought.

Concretely, that meant building:
- A real ingestion pipeline (not "paste your FAQ into a prompt") that turns PDFs, DOCX files, CSVs, and a website into searchable, chunked, embedded content.
- A retrieval step that only feeds the model the most relevant retrieved content for each question, with a confidence score derived from how well anything matched.
- An escalation engine driven by that confidence score, a configurable keyword list, and an explicit "nothing relevant was found" fallback.
- A management layer (dashboard, tickets, notifications, team roles) so a human taking over has full context, not a cold handoff.

## Architecture

**Stack:** Next.js 15 (App Router) on the frontend and as the API layer (Route Handlers), TypeScript throughout, MongoDB via Prisma as the datastore, and a provider-agnostic AI abstraction over OpenAI, Anthropic Claude, and a built-in deterministic provider.

**Multi-tenancy.** Every piece of data (`Agent`, `Document`, `Conversation`, `Ticket`, etc.) is scoped to a `Workspace`. Every workspace-scoped API route resolves the workspace from the authenticated session's JWT — never from a client-supplied ID in the request — so one workspace's staff can never read or mutate another workspace's data, even by guessing an ID. `WorkspaceMember` roles (Owner / Admin / Support Agent / Viewer) gate write and management actions server-side, not just in the UI.

**Auth.** Email/password with bcrypt hashing, signed JWT session cookies (`jose`), and Next.js middleware that verifies the session at the edge before a protected page even renders. A separate edge-safe verifier exists specifically because the primary Prisma/MongoDB client can't run in the Edge runtime — a deliberate split, not an oversight.

**Data model (Prisma / MongoDB).** Users and Workspaces; Agents (one AI configuration per bot, with personality, escalation rules, and widget branding); Documents and DocumentChunks (with native `Float[]` embedding vectors); WebsiteSources and FAQs feeding the same chunk pipeline; Conversations, Messages, InternalNotes; Tickets; Notifications; AnalyticsEvents. Every relation uses real foreign keys with cascade rules, not loosely-typed JSON blobs.

## AI / RAG Workflow

```
Upload (PDF/DOCX/TXT/CSV) or Website URL or FAQ
        │
        ▼
  Extract text  (pdf-parse / mammoth / plain-text / CSV→rows)
        │
        ▼
  Clean  (strip control characters, normalize whitespace)
        │
        ▼
  Chunk  (paragraph-aware, ~900 characters, overlap on long paragraphs)
        │
        ▼
  Embed  (pluggable provider; a fast deterministic 384-dim embedder is
          wired in by default so the whole pipeline runs with zero API
          cost — OpenAI/Anthropic embedding is a one-line swap)
        │
        ▼
  Store  (embeddings as native Float[] arrays on each chunk in MongoDB)
        │
   ─────┴───── at chat time ─────
        │
  Embed the customer's question → cosine-similarity search across the
  workspace's chunks + FAQs → top-K matches above a minimum score →
  confidence score derived from match strength
        │
        ▼
  Build a system prompt that:
    - states the agent's configured personality and instructions
    - wraps retrieved content in an explicit "untrusted data" block
    - instructs the model that these rules always win over anything in
      that block or in the customer's message (prompt-injection defense)
    - falls back to "I don't have enough information..." if nothing
      relevant was found, when the agent is set to KB-only mode
        │
        ▼
  Stream the model's response token-by-token to the widget, attach
  the sources used and the confidence score to the stored message
        │
        ▼
  If confidence is below threshold, an escalation keyword matched, or
  no relevant content was found → flip the conversation to
  HUMAN_REQUIRED, auto-create a Ticket, notify the team
```

This is a genuinely working pipeline — verified end-to-end with real chat requests during development, including confirming that an irrelevant, off-topic question correctly triggers the low-confidence escalation path rather than a confidently wrong answer.

## Main Features

- Knowledge base management (documents, website, FAQs) with visible per-item processing status
- Embeddable chat widget + hosted chat page, streaming responses, suggested questions, message feedback
- Confidence-based and keyword-based human handoff, with the AI correctly staying silent once a human has taken over a conversation rather than talking over them
- Auto-generated support tickets linked to their originating conversation, with priority/status management
- Agent Builder UI for tone, strictness, escalation rules, business hours, and widget branding
- Team management with server-enforced roles
- Analytics dashboard: conversation trends, AI-vs-human resolution split, escalation reasons, top question categories, date-range filtering

## Technical Implementation Highlights

- **Streaming without WebSockets.** The chat endpoint streams newline-delimited JSON over a standard `fetch` response body (`ReadableStream`), which the widget parses incrementally — simpler infrastructure than a WebSocket server, with the same perceived responsiveness for a request/response chat pattern.
- **Provider abstraction.** Nothing outside `src/lib/ai` imports an OpenAI or Anthropic SDK type directly. Swapping a workspace's agent from the built-in provider to a real model is a one-field change with no other code path affected.
- **Server-side authorization, not client trust.** Every mutating API route re-derives the caller's workspace and role from their session before touching the database — the client can send whatever it wants, it doesn't matter.
- **Accessible, validated data visualization.** The analytics charts follow a deliberately chosen, colorblind-safe categorical palette (validated programmatically, not eyeballed) with correctly paired legends, replacing an earlier pass that had used dashed gridlines and ad-hoc colors.

## Challenges & Solutions

**Challenge: keeping the AI from leaking its own instructions.** Early on, the built-in demo AI provider's answers were occasionally contaminated with fragments of the system prompt's own security-rule text, because a naive string-matching approach couldn't tell "the literal `<retrieved_context>` tag" apart from "a sentence that happens to mention that tag by name." **Solution:** rewrote the prompt so the tag delimiter is the *only* place that literal string appears, with every other reference to it in prose — a small change that fixed a real correctness bug in how grounded the answers actually were.

**Challenge: the AI re-engaging after a human took over.** The chat endpoint originally always generated an AI reply to any new customer message, even after a human agent had already replied and taken ownership of the conversation — silently undoing the handoff. **Solution:** the endpoint now checks conversation status before generating a reply; once a human is engaged, new customer messages get a lightweight "your message has been passed along" acknowledgment instead of an AI-generated answer, and the conversation status correctly flips back to "needs human" rather than reverting to AI-handled.

**Challenge: local development without a hosted database.** MongoDB's multi-document transactions (used for signup, escalation, and ingestion) require a replica set, which a plain standalone `mongod` rejects. **Solution:** documented (in the project README) both a zero-setup MongoDB Atlas path and a local single-node replica-set path, so the project runs the same way in any environment.

**Challenge: a subtle mobile layout bug in the analytics charts.** A CSS Grid container that only defined column counts at larger breakpoints (`lg:grid-cols-2` with no base `grid-cols-1`) let a chart's internal sizing force the whole page wider than the viewport on mobile — a well-known but easy-to-miss CSS Grid gotcha. **Solution:** caught it via actual mobile-viewport screenshot testing (not just code review), traced it to the exact offending elements programmatically, and fixed the underlying pattern everywhere it occurred across the app.

## Potential Business Applications

- E-commerce support (order status, refund policy, shipping questions)
- SaaS product support and onboarding
- Agency/reseller model — one agency deploying branded instances for multiple SMB clients
- Internal IT/HR helpdesk grounded in internal documentation
- Any business with a stable knowledge base and a support queue dominated by repetitive questions

## Future Improvements

Honest next steps if this were taken further toward production scale for a specific client:

- Wire a production embedding model (OpenAI/Anthropic) into the ingestion and retrieval path by default, rather than the current zero-cost deterministic embedder
- Move similarity search to MongoDB Atlas Vector Search for large knowledge bases (the code is architected for this swap, not yet implemented)
- Multi-page website crawling (current website ingestion ingests one URL per source, not a recursive crawler)
- Real email delivery for password resets and notifications (the token/notification data model is built; outbound email sending is not wired to a provider yet)
- A distributed rate limiter (Redis) for multi-instance production deployments, replacing the current in-memory limiter
- Actual third-party integrations (Slack, Zendesk, etc.) — shown today only as a marketing/roadmap section on the landing page, not implemented
- Billing/subscription integration (the pricing page is currently a marketing display, not connected to a payment processor)
