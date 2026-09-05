"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Paperclip, RotateCcw, ThumbsUp, ThumbsDown, UserRound, Sparkles, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AgentInfo {
  id: string;
  name: string;
  avatarEmoji: string;
  brandColor: string;
  widgetWelcomeMessage: string;
  widgetSuggested: string;
}

interface UIMessage {
  id: string;
  role: "customer" | "ai" | "human" | "system";
  content: string;
  createdAt: string;
  streaming?: boolean;
  feedback?: 1 | -1 | null;
  escalate?: boolean;
  humanHandling?: boolean;
}

export function ChatWidget({ agent, compact = false }: { agent: AgentInfo; compact?: boolean }) {
  const [messages, setMessages] = useState<UIMessage[]>([
    { id: "welcome", role: "ai", content: agent.widgetWelcomeMessage, createdAt: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggested = agent.widgetSuggested.split(",").map((s) => s.trim()).filter(Boolean);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);

    const userMsg: UIMessage = { id: crypto.randomUUID(), role: "customer", content, createdAt: new Date().toISOString() };
    const aiMsgId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: aiMsgId, role: "ai", content: "", createdAt: new Date().toISOString(), streaming: true }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, conversationId, message: content }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "meta") {
            setConversationId(event.conversationId);
          } else if (event.type === "delta") {
            setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + event.text } : m)));
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? { ...m, id: event.messageId ?? m.id, streaming: false, feedback: null, escalate: event.escalate, humanHandling: !!event.humanHandling }
                  : m
              )
            );
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, streaming: false, content: "Sorry, something went wrong. Please try again." } : m))
      );
    } finally {
      setSending(false);
    }
  }

  async function giveFeedback(id: string, feedback: 1 | -1) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, feedback } : m)));
    try {
      await fetch(`/api/messages/${id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
    } catch {}
  }

  function restart() {
    setMessages([{ id: "welcome", role: "ai", content: agent.widgetWelcomeMessage, createdAt: new Date().toISOString() }]);
    setConversationId(undefined);
  }

  function talkToHuman() {
    send("I'd like to speak with a human agent, please.");
  }

  return (
    <div className={cn("flex h-full flex-col bg-background", !compact && "mx-auto max-w-2xl")}>
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5"
        style={{ background: `linear-gradient(180deg, ${agent.brandColor}14, ${agent.brandColor}05)` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-soft-sm ring-1 ring-inset ring-black/5"
            style={{ backgroundColor: `${agent.brandColor}22` }}
          >
            {agent.avatarEmoji}
          </span>
          <div>
            <p className="text-sm font-semibold leading-none tracking-[-0.01em]">{agent.name}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={talkToHuman} title="Talk to a human" aria-label="Talk to a human">
            <UserRound className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={restart} title="Restart conversation" aria-label="Restart conversation">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="thin-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {messages.map((m) =>
            m.humanHandling ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex justify-center"
              >
                <div className="flex max-w-[85%] items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
                  <CheckCheck className="h-3 w-3 shrink-0 text-success" />
                  {m.content}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("flex gap-2", m.role === "customer" ? "justify-end" : "justify-start")}
              >
                {m.role !== "customer" && (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm shadow-soft-xs"
                    style={{ backgroundColor: `${agent.brandColor}18` }}
                  >
                    {m.role === "ai" ? agent.avatarEmoji : <Bot className="h-3.5 w-3.5" style={{ color: agent.brandColor }} />}
                  </span>
                )}
                <div className="max-w-[80%]">
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-soft-xs",
                      // Customer bubbles stay on the app's own primary/foreground
                      // pair (guaranteed contrast) rather than the per-agent
                      // brandColor, which an admin could set arbitrarily light.
                      m.role === "customer" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted"
                    )}
                  >
                    {m.streaming && !m.content ? (
                      <TypingIndicator />
                    ) : m.role === "customer" ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-1.5 dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div className={cn("mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground", m.role === "customer" && "justify-end")}>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {m.role === "ai" && !m.streaming && m.id !== "welcome" && !m.humanHandling && (
                      <span className="flex items-center gap-0.5">
                        <button
                          onClick={() => giveFeedback(m.id, 1)}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-success/10 hover:text-success",
                            m.feedback === 1 && "bg-success/10 text-success"
                          )}
                          aria-label="Good response"
                          aria-pressed={m.feedback === 1}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => giveFeedback(m.id, -1)}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive",
                            m.feedback === -1 && "bg-destructive/10 text-destructive"
                          )}
                          aria-label="Bad response"
                          aria-pressed={m.feedback === -1}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                  {m.escalate && !m.humanHandling && (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] text-warning">
                      <Sparkles className="h-3 w-3 shrink-0" /> A team member has been notified and will follow up shortly.
                    </div>
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {messages.length <= 1 && suggested.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 pt-2">
            {suggested.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground shadow-soft-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground hover:shadow-soft-sm"
              >
                {q}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" title="Attach a file (coming soon)" onClick={() => {}}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type your message..."
            rows={1}
            aria-label="Message"
            className="max-h-28 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm shadow-soft-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-2 focus:ring-ring/40"
          />
          <Button
            size="icon"
            className="shrink-0 text-white shadow-soft-sm transition-transform hover:scale-105 active:scale-95"
            onClick={() => send()}
            disabled={sending || !input.trim()}
            style={{ backgroundColor: agent.brandColor }}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Powered by SupportAI</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-0.5" role="status" aria-label="Typing">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
    </div>
  );
}
