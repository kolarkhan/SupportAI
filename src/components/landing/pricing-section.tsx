"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const PLANS = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "For small teams testing AI support for the first time.",
    features: ["1 AI agent", "1,000 resolved conversations/mo", "PDF, DOCX, TXT, CSV uploads", "1 website source", "Community support"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    desc: "For growing support teams that need automation and insight.",
    features: [
      "3 AI agents",
      "10,000 resolved conversations/mo",
      "Unlimited documents & websites",
      "Full analytics dashboard",
      "Human handoff & ticketing",
      "Priority email support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "Custom",
    period: "",
    desc: "For companies with high support volume and custom needs.",
    features: [
      "Unlimited AI agents",
      "Unlimited conversations",
      "Custom AI provider & model routing",
      "SSO/SAML",
      "Dedicated onboarding & support",
      "99.9% uptime SLA",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export function PricingSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="pricing" className={compact ? "" : "py-24"}>
      <div className="container">
        {!compact && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when your agent is resolving real customer questions.</p>
          </motion.div>
        )}
        <div className={cn("mt-14 grid grid-cols-1 gap-6 md:grid-cols-3", compact && "mt-0")}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col p-7 transition-all duration-200 hover:-translate-y-1",
                  plan.highlighted ? "border-primary/60 shadow-glow-primary" : "hover:shadow-soft-md"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-7 shadow-soft-sm">Most popular</Badge>
                )}
                <h3 className="font-semibold tracking-[-0.01em]">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-7" variant={plan.highlighted ? "default" : "outline"} asChild>
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
