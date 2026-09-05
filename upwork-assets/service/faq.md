# FAQ — AI Customer Support Development Service

**Do I need my own OpenAI or Anthropic API key?**
Not to get started — the underlying architecture includes a built-in, zero-cost AI mode for development and demos. For a production deployment, you'll want a real model (OpenAI or Anthropic), and you'll need your own API key/billing account for that — I don't resell API access.

**Will the AI make things up?**
The system is specifically architected to avoid this: it retrieves relevant content from your knowledge base for every question and is instructed to answer only from that content (configurable), falling back to an honest "I don't have enough information" response when nothing relevant is found. No AI system can guarantee zero hallucination in every edge case, but grounding + a clear fallback + human handoff is the real mitigation, and it's built in, not bolted on.

**Can I control when a conversation goes to a human?**
Yes — confidence threshold, escalation keywords, and business-hours rules are all configurable per agent, not hardcoded.

**What file types can I upload to the knowledge base?**
PDF, DOCX, TXT, and CSV, plus a website URL and manually written FAQs.

**Does it crawl my whole website automatically?**
Website ingestion currently pulls content from a single URL you provide per source, not a recursive multi-page crawl. If you need your whole site indexed, that's a scoped add-on, not a default assumption.

**Can it integrate with Slack, Zendesk, HubSpot, etc.?**
Not out of the box today — those would be scoped and built as custom integrations for your specific workflow, not something already wired into the base system.

**Is my data safe / isolated from other clients?**
The architecture is multi-tenant with strict server-side authorization — one workspace's data is never accessible from another's, even by ID guessing. If you need specific compliance certifications (HIPAA, SOC 2, etc.), that requires its own dedicated review and infrastructure work beyond a standard build — tell me upfront if that's a requirement.

**How long will my project take?**
It depends on the package and how ready your content is. See `pricing-packages.md` for honest, non-guaranteed ranges — a small FAQ bot is a different timeline than a full platform with ticketing, roles, and analytics.

**Do I own the code?**
Yes — this is custom development work product, not a rented SaaS subscription.

**Can I start small and expand later?**
Yes — the packages are designed to build on the same architecture, so starting with a Basic chatbot and expanding to the full platform later doesn't mean starting over.

**What do you need from me to get started?**
Your existing support content (docs, FAQs, help center exports, or a representative sample of past support tickets), your brand assets, and a clear sense of what should always be escalated to a human on your team.
