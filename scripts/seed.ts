/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import { Pinecone } from "@pinecone-database/pinecone";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Local copies of chunking / embedding / Pinecone so this script has zero
// dependency on "server-only"-guarded app code and can run standalone via
// tsx (mirrors scripts/reembed.ts). Vectors live in Pinecone exclusively —
// Mongo's DocumentChunk/FAQ rows hold text only, so seeded demo content is
// only searchable via chat once it's also pushed to Pinecone below. ───────

const EMBEDDING_DIMENSIONS = 384;
const PINECONE_INDEX = process.env.PINECONE_INDEX || "supportai";

function hashEmbedding(text: string, dims = EMBEDDING_DIMENSIONS): number[] {
  const vec = new Array(dims).fill(0);
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  for (const token of tokens) {
    const h = hashString(token);
    vec[h % dims] += 1;
    vec[(h * 31) % dims] += 0.35;
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

async function voyageEmbedBatch(texts: string[], apiKey: string, model: string): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ input: texts, model, input_type: "document" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage AI embedding request failed (${res.status}): ${body.slice(0, 300) || res.statusText}`);
  }
  const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (apiKey) return voyageEmbedBatch(texts, apiKey, process.env.VOYAGE_EMBEDDING_MODEL || "voyage-3.5");
  return texts.map((t) => hashEmbedding(t));
}

const pinecone = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;
let indexReady: Promise<void> | null = null;
async function ensureIndex(dimension: number): Promise<void> {
  if (!pinecone) return;
  if (!indexReady) {
    indexReady = (async () => {
      const existing = await pinecone.listIndexes();
      const found = existing.indexes?.some((i) => i.name === PINECONE_INDEX);
      if (!found) {
        console.log(`Pinecone index "${PINECONE_INDEX}" doesn't exist yet — creating it (dimension ${dimension})...`);
        await pinecone.createIndex({
          name: PINECONE_INDEX,
          dimension,
          metric: "cosine",
          spec: { serverless: { cloud: (process.env.PINECONE_CLOUD || "aws") as "aws" | "gcp" | "azure", region: process.env.PINECONE_REGION || "us-east-1" } },
          waitUntilReady: true,
        });
      }
    })();
  }
  try {
    await indexReady;
  } catch (err) {
    indexReady = null;
    throw err;
  }
}
async function upsertToPinecone(workspaceId: string, records: { id: string; values: number[]; content: string; documentName: string }[]) {
  if (!pinecone || records.length === 0) return;
  await ensureIndex(records[0].values.length);
  const ns = pinecone.index(PINECONE_INDEX).namespace(workspaceId);
  await ns.upsert({ records: records.map((r) => ({ id: r.id, values: r.values, metadata: { content: r.content, documentName: r.documentName } })) });
}

function chunkText(text: string, chunkSize = 900) {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: { content: string; index: number; tokenCount: number }[] = [];
  let buffer = "";
  const push = () => {
    const trimmed = buffer.trim();
    if (trimmed.length > 0) chunks.push({ content: trimmed, index: chunks.length, tokenCount: Math.ceil(trimmed.length / 4) });
    buffer = "";
  };
  for (const para of paragraphs) {
    if ((buffer + "\n\n" + para).length > chunkSize) {
      push();
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  push();
  return chunks;
}

// ── Demo content ────────────────────────────────────────────────────────

const DOCS: { name: string; content: string }[] = [
  {
    name: "Company Policies.pdf",
    content: `Acme Cloud Refund Policy

Customers can request a refund within 30 days of purchase for any Acme Cloud plan. Refunds are processed to the original payment method within 5-7 business days. Annual plans cancelled after 30 days are refunded on a pro-rated basis for unused months.

Acme Cloud Cancellation Policy

You can cancel your subscription at any time from Settings > Billing. Cancelling stops future renewals but does not refund the current billing period unless it falls within the 30-day refund window. Your data remains accessible until the end of the current billing period.

Acme Cloud Data Retention Policy

We retain customer data for 90 days after account cancellation in case you want to reactivate. After 90 days, data is permanently deleted from our systems, including backups, within an additional 30 days.

Acme Cloud Security Policy

All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Acme Cloud is SOC 2 Type II certified. We perform quarterly penetration testing and maintain a responsible disclosure program for security researchers.`,
  },
  {
    name: "Product Documentation.pdf",
    content: `Getting Started with Acme Cloud

Acme Cloud is a workflow automation platform. After signing up, create your first Workspace, invite your team, and connect at least one integration from the Integrations tab.

Creating Automations

Automations consist of a Trigger and one or more Actions. Go to Automations > New Automation, choose a trigger such as "New record created", then add actions like "Send Slack message" or "Update spreadsheet row". Automations run within 5-10 seconds of the trigger event on the Pro and Scale plans, and within 60 seconds on the Starter plan.

API Access

Every plan except Starter includes API access. Generate an API key from Settings > Developer. Rate limits are 100 requests/minute on Pro and 1,000 requests/minute on Scale. All endpoints require the Authorization: Bearer <key> header.

Troubleshooting Failed Automations

If an automation fails, check the Run History tab for the specific error. Common causes are expired integration tokens (reconnect from Integrations) and rate limits on the destination service. Failed runs are retried automatically up to 3 times with exponential backoff.`,
  },
  {
    name: "Billing & Plans Guide.docx",
    content: `Acme Cloud Plans

Starter is $29/month and includes 1,000 automation runs, 3 team members, and community support. Pro is $99/month and includes 25,000 automation runs, unlimited team members, priority email support, and API access. Scale is custom-priced and includes unlimited runs, SSO/SAML, a dedicated Slack channel, and a 99.9% uptime SLA.

Upgrading or Downgrading

You can change plans anytime from Settings > Billing > Change Plan. Upgrades take effect immediately with a prorated charge. Downgrades take effect at the start of the next billing cycle so you keep your current limits until then.

Payment Methods

We accept all major credit cards and, on the Scale plan, ACH bank transfer and invoicing with NET-30 terms. Failed payments are retried 3 times over 7 days before the account is downgraded to a restricted read-only mode.

Taxes and Invoices

Sales tax/VAT is calculated automatically based on your billing address. Invoices are available as PDF downloads from Settings > Billing > Invoice History and are also emailed automatically after each successful charge.`,
  },
  {
    name: "Onboarding Checklist.txt",
    content: `Acme Cloud Onboarding Checklist

Step 1: Create your workspace and set your company logo and timezone in Settings > General.
Step 2: Invite your team from Settings > Team. Assign roles: Owner, Admin, Member, or Viewer.
Step 3: Connect your first integration (Slack, Google Sheets, Salesforce, or HubSpot are the most common starting points).
Step 4: Build your first automation using a template from the Template Gallery, or start from scratch.
Step 5: Test the automation using the "Run test" button before turning it on.
Step 6: Turn on notifications so your team is alerted if an automation fails.

Most teams are fully onboarded within one business day. Our onboarding specialists are available on the Pro and Scale plans for a live walkthrough call — request one from Settings > Support.`,
  },
  {
    name: "Integration Setup Guide.pdf",
    content: `Connecting Slack

Go to Integrations > Slack > Connect, and authorize Acme Cloud in the Slack OAuth prompt. You'll be asked to choose a default channel for notifications, which you can change later per-automation.

Connecting Google Sheets

Go to Integrations > Google Sheets > Connect and sign in with the Google account that owns the spreadsheets you want to use. Acme Cloud requests read/write access only to sheets you explicitly select, not your entire Drive.

Connecting Salesforce

Salesforce integration requires a Salesforce Enterprise or Unlimited edition org. Go to Integrations > Salesforce > Connect and log in with an admin account. API access must be enabled in your Salesforce org's permission set.

Disconnecting an Integration

Disconnecting an integration from Integrations > [service] > Disconnect immediately pauses any automations that depend on it. The automation is not deleted — reconnecting the integration resumes it automatically.`,
  },
];

const FAQS: { question: string; answer: string }[] = [
  { question: "What is your refund policy?", answer: "Customers can request a refund within 30 days of purchase. Refunds are processed to the original payment method within 5-7 business days." },
  { question: "How do I cancel my subscription?", answer: "Go to Settings > Billing and click Cancel Subscription. Your data stays accessible until the end of the current billing period." },
  { question: "Do you offer a free trial?", answer: "Yes — every plan includes a 14-day free trial with no credit card required to start." },
  { question: "How do I invite my team?", answer: "Go to Settings > Team > Invite Member, enter their email, and choose a role: Owner, Admin, Member, or Viewer." },
  { question: "What integrations do you support?", answer: "We support Slack, Google Sheets, Salesforce, HubSpot, Notion, and 40+ other tools. See the Integrations tab for the full list." },
  { question: "Is there an API?", answer: "Yes, all plans except Starter include full REST API access with a generated API key from Settings > Developer." },
  { question: "How do I upgrade my plan?", answer: "Go to Settings > Billing > Change Plan. Upgrades apply immediately with a prorated charge." },
  { question: "What happens if an automation fails?", answer: "Failed automations are retried automatically up to 3 times with exponential backoff, and you can view the exact error in Run History." },
  { question: "Do you support SSO?", answer: "SSO/SAML is available on the Scale plan. Contact your account manager to enable it for your workspace." },
  { question: "How secure is my data?", answer: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Acme Cloud is SOC 2 Type II certified." },
];

const CUSTOMER_NAMES = [
  "John Smith", "Sarah Khan", "Mike Torres", "Priya Patel", "Daniel Kim",
  "Emma Wilson", "Carlos Ramirez", "Aisha Bello", "Liam O'Brien", "Yuki Tanaka",
  "Noah Fischer", "Olivia Chen",
];

const SAMPLE_QUESTIONS = [
  "Where is my order? It's been 5 days.",
  "How can I cancel my subscription?",
  "I'd like to request a refund for my last payment.",
  "How do I connect Slack to my workspace?",
  "My automation keeps failing, can you help?",
  "What's the difference between the Pro and Scale plans?",
  "Can I get an invoice for my last payment?",
  "How do I invite more team members?",
  "Is there an API I can use?",
  "Do you support single sign-on?",
  "I forgot my password and can't log in.",
  "Can I change my billing email address?",
  "How long does the free trial last?",
  "My integration disconnected, how do I fix it?",
  "I want to speak to a manager about my account.",
  "What happens to my data if I cancel?",
  "Can I get a discount for annual billing?",
  "How do I export my data?",
  "Is my payment information secure?",
  "Can you walk me through setting up my first automation?",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDateWithinDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  console.log("Seeding SupportAI demo data for Acme Cloud...");

  await prisma.analyticsEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.internalNote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.websiteSource.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await prisma.user.create({
    data: { name: "Alex Rivera", email: "owner@acmecloud.com", passwordHash, avatarColor: "#6366f1" },
  });
  const admin = await prisma.user.create({
    data: { name: "Jordan Lee", email: "admin@acmecloud.com", passwordHash, avatarColor: "#0ea5e9" },
  });
  const agentUser = await prisma.user.create({
    data: { name: "Sam Patel", email: "agent@acmecloud.com", passwordHash, avatarColor: "#10b981" },
  });

  const workspace = await prisma.workspace.create({
    data: { name: "Acme Cloud", slug: "acme-cloud", plan: "pro" },
  });

  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: workspace.id, userId: owner.id, role: "OWNER", joinedAt: new Date() },
      { workspaceId: workspace.id, userId: admin.id, role: "ADMIN", joinedAt: new Date() },
      { workspaceId: workspace.id, userId: agentUser.id, role: "AGENT", joinedAt: new Date() },
    ],
  });

  const agent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: "Acme Support Assistant",
      avatarEmoji: "🤖",
      brandColor: "#6366f1",
      personality: "FRIENDLY",
      systemInstructions:
        "You are the customer support assistant for Acme Cloud. Always be polite and never invent information. If you are unsure, say so and offer to connect the customer with a specialist.",
      provider: "MOCK",
      answerOnlyFromKnowledgeBase: true,
      escalateUncertainQuestions: true,
      confidenceThreshold: 0.55,
      escalationKeywords: "refund,cancel,legal,angry,speak to a human,manager,lawsuit",
      widgetWelcomeMessage: "Hi! I'm the Acme Cloud assistant. How can I help you today?",
    },
  });

  console.log("Created workspace, users, agent. Ingesting documents...");
  if (!pinecone) {
    console.warn("⚠️  PINECONE_API_KEY not set — seeded documents/FAQs will have text in MongoDB but no vectors, so chat retrieval won't find them until you configure Pinecone and run `npm run db:reembed`.");
  }

  for (const doc of DOCS) {
    const document = await prisma.document.create({
      data: { workspaceId: workspace.id, name: doc.name, type: doc.name.endsWith(".docx") ? "DOCX" : doc.name.endsWith(".txt") ? "TXT" : "PDF", status: "PROCESSED", fileSize: doc.content.length * 3, storagePath: null },
    });
    const chunks = chunkText(doc.content);
    const vectors = await embedBatch(chunks.map((c) => c.content));
    const createdChunks = await Promise.all(
      chunks.map((c) =>
        prisma.documentChunk.create({
          data: {
            documentId: document.id,
            workspaceId: workspace.id,
            content: c.content,
            chunkIndex: c.index,
            tokenCount: c.tokenCount,
          },
        })
      )
    );
    await upsertToPinecone(
      workspace.id,
      createdChunks.map((c, i) => ({ id: c.id, values: vectors[i], content: c.content, documentName: doc.name }))
    );
    await prisma.document.update({ where: { id: document.id }, data: { chunkCount: chunks.length } });
  }
  // One document still "processing" so the UI demonstrates that state.
  await prisma.document.create({
    data: { workspaceId: workspace.id, name: "Enterprise Security Whitepaper.pdf", type: "PDF", status: "PROCESSING", fileSize: 420_000, storagePath: null },
  });

  await prisma.websiteSource.createMany({
    data: [
      { workspaceId: workspace.id, url: "https://acmecloud.com/help", status: "PROCESSED", pageCount: 1, chunkCount: 6, lastCrawledAt: new Date() },
      { workspaceId: workspace.id, url: "https://acmecloud.com/blog", status: "PENDING" },
    ],
  });

  console.log("Adding FAQs...");
  for (const faq of FAQS) {
    const content = `Q: ${faq.question}\nA: ${faq.answer}`;
    const created = await prisma.fAQ.create({
      data: { workspaceId: workspace.id, question: faq.question, answer: faq.answer },
    });
    const [vector] = await embedBatch([content]);
    await upsertToPinecone(workspace.id, [{ id: created.id, values: vector, content, documentName: "FAQ" }]);
  }

  console.log("Creating customers, conversations, messages, tickets...");
  const customers = await Promise.all(
    CUSTOMER_NAMES.map((name, i) =>
      prisma.customer.create({
        data: {
          workspaceId: workspace.id,
          name,
          email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}${i}@example.com`,
          avatarColor: pick(["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]),
        },
      })
    )
  );

  const statuses = ["RESOLVED", "RESOLVED", "RESOLVED", "AI_HANDLING", "WAITING", "HUMAN_REQUIRED", "OPEN"] as const;
  let ticketNumber = 1000;
  const conversationsData: { id: string; status: string }[] = [];

  for (let i = 0; i < 24; i++) {
    const customer = pick(customers);
    const status = pick(statuses);
    const createdAt = randomDateWithinDays(30);
    const question = pick(SAMPLE_QUESTIONS);

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId: workspace.id,
        agentId: agent.id,
        customerId: customer.id,
        status,
        assigneeId: status === "HUMAN_REQUIRED" || status === "WAITING" ? pick([admin.id, agentUser.id]) : null,
        satisfaction: status === "RESOLVED" ? pick([4, 5, 5, 5, 3]) : null,
        createdAt,
        lastMessageAt: createdAt,
        updatedAt: createdAt,
      },
    });

    const confidence = Math.random() * 0.6 + 0.3;
    const aiAnswer = pick([
      "Happy to help with that. You can find this in Settings under the relevant tab, and it should take effect within a few minutes.",
      "Sure — based on our documentation, that's supported on the Pro and Scale plans. Let me know if you'd like help enabling it.",
      "Good question. According to our refund policy, you can request this within 30 days of purchase and it's processed within 5-7 business days.",
    ]);

    await prisma.message.create({ data: { conversationId: conversation.id, role: "CUSTOMER", content: question, createdAt } });
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "AI",
        content: aiAnswer,
        confidence,
        sources: JSON.stringify([{ documentName: pick(DOCS).name, snippet: "Relevant excerpt from the knowledge base...", score: Math.round(confidence * 100) / 100 }]),
        createdAt: new Date(createdAt.getTime() + 4000),
        feedback: Math.random() > 0.7 ? pick([1, 1, -1]) : null,
      },
    });

    if (status === "HUMAN_REQUIRED" || status === "WAITING") {
      await prisma.message.create({
        data: { conversationId: conversation.id, role: "HUMAN", content: "Thanks for waiting — I've got your account pulled up, let me take a look.", createdAt: new Date(createdAt.getTime() + 60000) },
      });
    }

    await prisma.analyticsEvent.create({
      data: { workspaceId: workspace.id, type: "conversation_started", createdAt, metadata: JSON.stringify({ conversationId: conversation.id }) },
    });
    await prisma.analyticsEvent.create({
      data: {
        workspaceId: workspace.id,
        type: status === "RESOLVED" && Math.random() > 0.4 ? "ai_resolved" : status === "RESOLVED" ? "human_resolved" : Math.random() > 0.6 ? "escalated" : "ai_resolved",
        createdAt: new Date(createdAt.getTime() + 5000),
        metadata: JSON.stringify({ conversationId: conversation.id, reason: pick(["Confidence below threshold", "Escalation keyword detected", "No matching knowledge base content"]) }),
      },
    });

    conversationsData.push({ id: conversation.id, status });

    if (status === "HUMAN_REQUIRED" || status === "OPEN" || (status === "RESOLVED" && Math.random() > 0.6)) {
      ticketNumber += 1;
      await prisma.ticket.create({
        data: {
          workspaceId: workspace.id,
          number: ticketNumber,
          subject: question.slice(0, 70),
          priority: pick(["LOW", "MEDIUM", "MEDIUM", "HIGH", "URGENT"]),
          status: status === "RESOLVED" ? pick(["RESOLVED", "CLOSED"]) : pick(["OPEN", "IN_PROGRESS", "WAITING"]),
          customerId: customer.id,
          assigneeId: pick([admin.id, agentUser.id, null]),
          conversationId: conversation.id,
          createdAt,
          updatedAt: new Date(createdAt.getTime() + 3600_000),
        },
      });
    }
  }

  await prisma.notification.createMany({
    data: [
      { workspaceId: workspace.id, type: "system", title: "Welcome to SupportAI", body: "Your Acme Cloud workspace is fully set up with demo data.", read: true },
      { workspaceId: workspace.id, type: "escalation", title: "Conversation needs human attention", body: "Mike Torres needs help — AI handed off this conversation.", href: "/dashboard/conversations" },
      { workspaceId: workspace.id, type: "ticket", title: "New ticket created", body: "Ticket #1008 was opened: \"How can I cancel my subscription?\"", href: "/dashboard/tickets" },
    ],
  });

  console.log("✅ Seed complete.");
  console.log("");
  console.log("Log in with:");
  console.log("  owner@acmecloud.com / password123  (Owner)");
  console.log("  admin@acmecloud.com / password123  (Admin)");
  console.log("  agent@acmecloud.com / password123  (Support Agent)");
  console.log(`Public chat: /chat/${agent.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
