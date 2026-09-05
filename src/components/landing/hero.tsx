"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, TrendingUp, Clock, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const demoMessages = [
  { role: "customer", text: "Hi! I need help with my order." },
  { role: "ai", text: "I can help with that. Could you share your order number?" },
  { role: "customer", text: "It's #48213" },
  { role: "ai", text: "Found it — your order shipped yesterday and arrives Thursday. Anything else?" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, hsl(var(--primary)/0.14), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(60% 60% at 50% 20%, black, transparent)",
        }}
      />
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Badge variant="outline" className="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary shadow-soft-xs">
              <Sparkles className="h-3 w-3" />
              Now supporting OpenAI and Anthropic Claude
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl"
          >
            Your AI Support Agent That Never Sleeps.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground"
          >
            Train AI on your business knowledge and automatically resolve customer questions 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Building Your AI Agent
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                <PlayCircle className="h-4 w-4" />
                View Demo
              </Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>

        {/* Product dashboard preview */}
        <motion.div
          id="demo"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="relative mx-auto mt-16 max-w-5xl scroll-mt-24"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg ring-1 ring-black/[0.03]">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-3 text-xs text-muted-foreground">app.supportai.com/dashboard</span>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3 md:p-6">
              <div className="space-y-4 md:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  <StatMini label="Total Conversations" value="1,284" delta="+18.4%" icon={<TrendingUp className="h-3.5 w-3.5" />} />
                  <StatMini label="AI Resolution Rate" value="87.6%" delta="+6.2%" icon={<Sparkles className="h-3.5 w-3.5" />} />
                  <StatMini label="Avg Response Time" value="1.8 sec" delta="-24%" icon={<Clock className="h-3.5 w-3.5" />} />
                  <StatMini label="Satisfaction" value="94.2%" delta="+3.8%" icon={<TrendingUp className="h-3.5 w-3.5" />} />
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium text-muted-foreground">Conversations over time</p>
                  <div className="mt-3 flex h-24 items-end gap-1.5">
                    {[40, 55, 45, 70, 60, 80, 65, 90, 75, 95, 85, 100].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.03 }}
                        className="flex-1 rounded-sm bg-primary/70"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI chat demo */}
              <div className="rounded-xl border border-border bg-background">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold leading-none">SupportAI</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Online
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5 p-3">
                  {demoMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.25 }}
                      className={`flex ${m.role === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-snug ${
                          m.role === "customer" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function StatMini({ label, value, delta, icon }: { label: string; value: string; delta: string; icon: React.ReactNode }) {
  const positive = delta.startsWith("+") || delta.startsWith("-2");
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <span className="text-muted-foreground/60">{icon}</span>
      </div>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
      <p className={`mt-0.5 text-[10px] font-medium ${positive ? "text-success" : "text-destructive"}`}>{delta} vs last month</p>
    </div>
  );
}
