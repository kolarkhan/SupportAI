# Upwork Skills / Keywords

Add these to the Upwork portfolio project and to your profile's skill tags. Grouped by relevance; only technologies actually used in this project are listed.

## AI / High-value keywords

- AI Agent Development
- Generative AI
- RAG (Retrieval-Augmented Generation)
- LLM Integration
- AI Chatbot Development
- Customer Support Automation
- Conversational AI
- Prompt Engineering
- OpenAI API
- Anthropic Claude API
- Vector Search / Semantic Search
- Embeddings

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Responsive Web Design

## Backend / Data

- Node.js
- REST API Development
- MongoDB
- Prisma ORM
- Zod (schema validation)
- JWT Authentication

## Product / Domain

- SaaS Development
- Multi-Tenant Architecture
- Dashboard Development
- Data Visualization
- Full-Stack Development

## Also relevant

- Helpdesk Software
- Live Chat Software
- Knowledge Base Software
- CRM Integration *(architected for; see project-details.md for exact scope)*

---

### Notes for whoever manages the profile (not for the client-facing listing)

A few commonly-requested Upwork AI keywords were **deliberately left off** because they don't match this codebase — don't add them just because they're high-traffic search terms:

- **Python / FastAPI** — this project's entire backend is Next.js/TypeScript (Route Handlers), not Python. Do not list Python skills against this specific project.
- **PostgreSQL** — the database is MongoDB (via Prisma), not PostgreSQL.
- **"Vector Database"** (as a named product like Pinecone/Weaviate/pgvector) — not used. The project stores embeddings natively in MongoDB and does in-process cosine-similarity search, with a documented (not yet implemented) upgrade path to MongoDB Atlas Vector Search. "Vector Search" / "Embeddings" are accurate; a specific vector-database product name is not.

If a client's job post specifically requires Python/FastAPI/PostgreSQL/Pinecone, that's a different tech stack than this portfolio piece demonstrates — say so honestly rather than stretching this project's tags to match.
