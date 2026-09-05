"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, MessageSquare, Shield, Zap, BarChart3, Users,
  Upload, Settings2, Rocket, Check, Star, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion } from "@/components/shared/accordion";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

// ── Features ────────────────────────────────────────────────────────────

const features = [
  { icon: BookOpen, title: "Knowledge base RAG", desc: "Upload PDFs, DOCX, CSVs, or connect your website. Every answer is grounded in your real content." },
  { icon: MessageSquare, title: "Beautiful chat widget", desc: "A polished, on-brand chat experience customers actually enjoy using, embeddable in one script tag." },
  { icon: Users, title: "Seamless human handoff", desc: "Low-confidence questions escalate automatically, with full context handed to your team." },
  { icon: BarChart3, title: "Real-time analytics", desc: "Track resolution rate, response time, satisfaction, and the questions customers ask most." },
  { icon: Shield, title: "Prompt-injection safe", desc: "Uploaded documents are treated as untrusted data — your system instructions always win." },
  { icon: Zap, title: "Streaming responses", desc: "Sub-2-second time-to-first-token so conversations feel instant, not robotic." },
];

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className="container">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to automate support</h2>
          <p className="mt-3 text-muted-foreground">From knowledge ingestion to human handoff, SupportAI covers the full lifecycle of a support conversation.</p>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.05 }}>
              <Card className="group h-full p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft-md">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ────────────────────────────────────────────────────────

const steps = [
  { icon: Upload, title: "Train your agent", desc: "Upload documents, add website URLs, or write FAQs. SupportAI chunks, embeds, and indexes everything automatically." },
  { icon: Settings2, title: "Configure behavior", desc: "Set the personality, escalation rules, and confidence thresholds that match how your team wants to work." },
  { icon: Rocket, title: "Go live in minutes", desc: "Drop one script tag on your site or share a hosted chat link — your agent starts resolving questions immediately." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/30 py-24">
      <div className="container">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps from zero to a fully trained support agent.</p>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.title} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow-primary">
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary/70">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Integrations ────────────────────────────────────────────────────────

const integrations = ["Slack", "Zendesk", "Shopify", "HubSpot", "Notion", "Salesforce", "Intercom", "Google Sheets"];

export function Integrations() {
  return (
    <section id="integrations" className="py-24">
      <div className="container">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Works with your existing stack</h2>
          <p className="mt-3 text-muted-foreground">Connect SupportAI to the tools your team already uses.</p>
        </motion.div>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {integrations.map((name, i) => (
            <motion.div key={name} {...fadeUp} transition={{ duration: 0.4, delay: i * 0.04 }}>
              <Card className="flex h-20 items-center justify-center px-4 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground hover:shadow-soft-sm">
                {name}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Analytics preview ──────────────────────────────────────────────────

export function AnalyticsPreview() {
  const bars = [55, 68, 50, 82, 74, 90, 78, 95, 88, 60, 72, 84];
  return (
    <section className="border-y border-border/60 bg-muted/30 py-24">
      <div className="container grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <motion.div {...fadeUp}>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">See exactly how your agent is performing</h2>
          <p className="mt-3 text-muted-foreground">
            Resolution rate, response time, satisfaction, and top customer questions — all in one dashboard your whole team can trust.
          </p>
          <ul className="mt-6 space-y-3">
            {["Daily & weekly conversation trends", "AI vs. human resolution breakdown", "Escalation reasons at a glance", "CSAT trends over time"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {t}
              </li>
            ))}
          </ul>
          <Button className="mt-7" asChild>
            <Link href="/signup">
              Explore analytics <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="p-6">
            <p className="text-sm font-medium">Conversations — last 12 days</p>
            <div className="mt-5 flex h-40 items-end gap-2">
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                  className="flex-1 rounded-md bg-gradient-to-t from-primary to-primary/50"
                />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5 text-center">
              <div>
                <p className="text-lg font-semibold">87.6%</p>
                <p className="text-[11px] text-muted-foreground">AI resolution</p>
              </div>
              <div>
                <p className="text-lg font-semibold">1.8s</p>
                <p className="text-[11px] text-muted-foreground">Avg response</p>
              </div>
              <div>
                <p className="text-lg font-semibold">94.2%</p>
                <p className="text-[11px] text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────

const testimonials = [
  { quote: "We cut our average response time from 4 hours to under 2 seconds. Our support team now focuses on the conversations that actually need a human.", name: "Priya Anand", role: "Head of Support, Northwind Retail" },
  { quote: "The escalation logic is what sold us — it knows exactly when to hand off instead of guessing, so customers never feel stuck talking to a bot.", name: "Marcus Chen", role: "Co-founder, Fieldstack" },
  { quote: "Setup took an afternoon. We uploaded our docs, connected our site, and it was already resolving 80% of tickets by the end of the week.", name: "Lena Ortiz", role: "Ops Lead, Brightloop" },
];

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Loved by support teams</h2>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} {...fadeUp} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <Card className="flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-md">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────

const faqs = [
  { q: "Do I need my own OpenAI or Anthropic API key?", a: "No — SupportAI works out of the box with a built-in AI provider for demos and evaluation. Add your own OpenAI or Anthropic key anytime to switch to a production model; nothing else in your setup changes." },
  { q: "How does SupportAI prevent the AI from making things up?", a: "Every answer is grounded in retrieved chunks from your knowledge base. If no relevant content is found, the agent tells the customer it doesn't have enough information instead of guessing, and can offer to connect them with your team." },
  { q: "Can I control when a conversation goes to a human?", a: "Yes — set a confidence threshold, escalation keywords, and business hours in the Agent Builder. Escalated conversations automatically create a ticket and notify your team." },
  { q: "What file types can I upload to the knowledge base?", a: "PDF, DOCX, TXT, and CSV are supported today, alongside website crawling and manually written FAQs." },
  { q: "Is my data safe?", a: "Your knowledge base and conversations are isolated per workspace with strict authorization checks on every request, and uploaded content is always treated as untrusted reference data — never as instructions the AI must follow." },
];

export function FAQSection() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-24">
      <div className="container max-w-3xl">
        <motion.div {...fadeUp} className="text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Frequently asked questions</h2>
        </motion.div>
        <div className="mt-10">
          <Accordion items={faqs.map((f) => ({ title: f.q, content: f.a }))} />
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ───────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground shadow-glow-primary md:py-20"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(60% 90% at 15% 0%, hsl(var(--primary-foreground)/0.16), transparent), radial-gradient(50% 80% at 100% 100%, hsl(var(--primary-foreground)/0.12), transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary-foreground)) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <h2 className="relative mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to give your customers an agent that never sleeps?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-balance text-primary-foreground/80">
            Start free, connect your knowledge base, and go live today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">
                Start Building Your AI Agent <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
