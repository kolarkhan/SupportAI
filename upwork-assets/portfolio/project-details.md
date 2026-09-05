# Project Details — SupportAI

*(Full breakdown for the Upwork portfolio project page.)*

## Overview

SupportAI is a multi-tenant, AI-powered customer support platform. Businesses train an AI agent on their own knowledge (documents, a website, FAQs), embed a chat widget or share a hosted chat link, and manage every conversation, escalation, ticket, and performance metric from a single dashboard.

This was built as a complete, working product — not a proof-of-concept script — covering authentication, multi-tenant data isolation, a real RAG pipeline, human handoff logic, ticketing, and analytics, all wired together end-to-end.

## The Problem

Most small and mid-sized businesses can't staff 24/7 live chat, and generic chatbot tools either:
- hallucinate answers because they aren't grounded in the business's actual documentation, or
- have no safe, automatic way to hand a conversation to a human when the AI shouldn't be answering (billing disputes, legal questions, angry customers, or anything outside the knowledge base).

## The Solution

An AI agent that:
1. **Answers only from what it's been given** — uploaded PDFs/DOCX/CSVs, a connected website, and written FAQs, retrieved via semantic similarity search at answer time.
2. **Knows when to step back** — a confidence score, configurable escalation keywords, and a "no matching content" fallback all trigger automatic handoff to a human, with full conversation context preserved.
3. **Gives the business full visibility** — a dashboard for conversations, tickets, knowledge base management, agent behavior tuning, team roles, and analytics.

## Key Features

- **Knowledge base ingestion** — PDF, DOCX, TXT, and CSV upload (with type/size validation and a visible processing pipeline: queued → processing → processed/failed with error messages), a website URL as a knowledge source, and manually written FAQs — all indexed into the same retrieval pipeline.
- **Grounded AI chat widget** — a polished, embeddable chat widget (single `<script>` tag) plus a standalone hosted chat page per agent, with streaming responses, suggested-question chips, message feedback (👍/👎), and a "talk to a human" action.
- **Human handoff & ticketing** — automatic escalation on low confidence, keyword match, or missing knowledge; auto-created support tickets linked to the originating conversation; in-app notifications; a dashboard view for staff to reply, add private internal notes, and resolve conversations.
- **Agent Builder** — a configuration UI covering personality/tone, system instructions, AI provider selection, strictness (KB-only vs. general-knowledge fallback), escalation thresholds and keywords, business hours, and widget branding — all without touching code.
- **Team & role management** — invite teammates with Owner / Admin / Support Agent / Viewer roles, each with different permissions enforced server-side.
- **Analytics dashboard** — conversation volume trends, AI-vs-human resolution breakdown, escalation-reason breakdown, and top customer question categories, filterable by date range, with an export-ready chart layer.
- **Ticket system** — auto-generated from escalations, with priority/status management and a searchable table (desktop) / card view (mobile).

## AI / RAG Functionality

The retrieval-augmented generation pipeline is fully implemented, not simulated:

`Upload → Extract text (pdf-parse / mammoth / plain text / CSV-to-rows) → Clean → Chunk (paragraph-aware, ~900 chars with overlap) → Embed → Store as vectors → Cosine-similarity retrieval at chat time → Prompt-injection-safe context assembly → Streamed, grounded generation`

- **Provider-agnostic AI layer** — the app never calls a vendor SDK directly; it goes through a common interface with OpenAI, Anthropic Claude, and a deterministic built-in provider (so the whole product is demoable with zero API cost and zero external calls, and a client can switch to a real model with one setting change).
- **Prompt-injection defense** — retrieved document content is explicitly framed to the model as untrusted reference data, never as instructions, with an explicit rule set so a document containing "ignore previous instructions" can't hijack the agent.
- **Streaming responses** — answers stream token-by-token to the UI (no waiting for the full response), with source attribution and a confidence score attached to each AI message.
- **Vector storage** — embeddings are stored natively in MongoDB (`Float[]` per chunk) with in-process cosine-similarity search, architected with a documented upgrade path to MongoDB Atlas Vector Search for larger knowledge bases.

## Technologies

**Frontend** — Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Radix UI primitives, Recharts

**Backend** — Next.js Route Handlers (REST API), Zod input validation on every endpoint

**Database** — MongoDB via Prisma ORM, multi-document transactions for data-integrity-critical flows (signup, escalation, ingestion)

**AI** — OpenAI API, Anthropic Claude API, custom provider-agnostic abstraction layer

**Auth & Security** — JWT sessions (`jose`) in httpOnly cookies, bcrypt password hashing, Next.js middleware route protection, workspace-scoped server-side authorization on every API call, in-memory rate limiting on auth/chat endpoints

## My Role

Full-stack solo developer — product architecture, database schema design, the entire RAG pipeline, authentication and multi-tenant authorization, all API routes, the full dashboard UI, the chat widget, and the design system (including a dedicated pass on chart accessibility/color and mobile responsiveness).

## Business Value

- Cuts response time on repetitive questions from hours to seconds, without giving up accuracy — answers are grounded in the business's real content, not the model's general training data.
- Reduces support headcount pressure by automatically resolving the questions that don't need a human, while cleanly routing the ones that do.
- Gives support leads real visibility (resolution rate, escalation patterns, common questions) to actually improve the knowledge base over time instead of guessing.
- Multi-tenant from day one, so it's architected to serve many client businesses from one deployment, not just one.

## Capabilities Demonstrated (not claimed results)

*(Per Upwork best practice: these describe what the system does, not unverified production metrics from a live paying customer.)*

- Near-instant streamed first-token response verified in local testing with the built-in provider (real OpenAI/Anthropic latency depends on their APIs, not something under this system's control).
- Zero-cost, zero-API-key demo mode that still runs the full RAG pipeline end-to-end.
- Verified against real browser automation testing (not just code review) across desktop and mobile viewports.

## Call to Action

Looking for an AI-powered support, onboarding, or internal-tools product — grounded in your own content, with a real escalation path to your team? I build exactly this kind of system, from data model to dashboard. Message me with your use case and I'll tell you honestly what's a fit and what a realistic build looks like.
