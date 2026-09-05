import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { apiError } from "@/lib/api/response";
import { rateLimit, getClientKey } from "@/lib/api/rate-limit";
import { prepareGeneration, streamAgentReply, FALLBACK_ANSWER } from "@/lib/rag/generate-response";
import type { ChatMessage } from "@/lib/ai/types";
import type { MessageRole } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Public, unauthenticated streaming chat endpoint used by both the hosted
 * /chat/[agentId] page and the embeddable widget. Emits newline-delimited
 * JSON events so the client can render tokens as they arrive:
 *   {"type":"meta","conversationId":"..."}
 *   {"type":"delta","text":"..."}
 *   {"type":"done","sources":[...],"confidence":0.8,"escalate":false}
 */
export async function POST(req: NextRequest) {
  const limited = rateLimit(`chat:${getClientKey(req)}`, 40, 60_000);
  if (!limited.ok) return apiError("You're sending messages too quickly. Please slow down.", 429);

  let body: ReturnType<typeof chatMessageSchema.parse>;
  try {
    body = chatMessageSchema.parse(await req.json());
  } catch {
    return apiError("Invalid message payload.", 422);
  }

  const agent = await prisma.agent.findUnique({ where: { id: body.agentId } });
  if (!agent || !agent.isPublished) {
    return apiError("This support agent is not available.", 404);
  }

  // Resolve/create customer + conversation.
  let conversation = body.conversationId
    ? await prisma.conversation.findFirst({ where: { id: body.conversationId, agentId: agent.id } })
    : null;

  if (!conversation) {
    const customer = await prisma.customer.create({
      data: {
        workspaceId: agent.workspaceId,
        name: body.customerName?.trim() || "Website Visitor",
        email: body.customerEmail || null,
      },
    });
    conversation = await prisma.conversation.create({
      data: {
        workspaceId: agent.workspaceId,
        agentId: agent.id,
        customerId: customer.id,
        status: "AI_HANDLING",
      },
    });
    await prisma.analyticsEvent.create({
      data: { workspaceId: agent.workspaceId, type: "conversation_started", metadata: JSON.stringify({ conversationId: conversation.id }) },
    });
  }

  // Once a human has taken over (they replied — status WAITING — or the
  // conversation was flagged HUMAN_REQUIRED), the AI must not jump back in
  // and auto-answer new customer messages: that would silently override the
  // handoff and the human agent could miss the reply entirely. Staff can
  // explicitly hand control back to the AI (PATCH status -> AI_HANDLING).
  const humanIsHandling = conversation.status === "WAITING" || conversation.status === "HUMAN_REQUIRED";

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "CUSTOMER" as MessageRole, content: body.message },
  });

  if (humanIsHandling) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: "HUMAN_REQUIRED" },
    });

    const ackText = "Thanks for the extra info — I've passed it along to the team, they'll reply here shortly.";
    const ackMessage = await prisma.message.create({
      data: { conversationId: conversation.id, role: "SYSTEM" as MessageRole, content: ackText },
    });

    const encoder = new TextEncoder();
    const conversationId = conversation.id;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        send({ type: "meta", conversationId });
        for (const word of ackText.split(/(\s+)/)) {
          send({ type: "delta", text: word });
          await new Promise((r) => setTimeout(r, 10));
        }
        send({ type: "done", messageId: ackMessage.id, sources: [], confidence: null, escalate: true, humanHandling: true });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } });

  const priorMessages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const history: ChatMessage[] = priorMessages
    .slice(0, -1) // exclude the message we just saved, it's added explicitly by prepareGeneration
    .filter((m) => m.role === "CUSTOMER" || m.role === "AI" || m.role === "HUMAN")
    .map((m) => ({ role: m.role === "CUSTOMER" ? "user" : "assistant", content: m.content }));

  const { messages, result } = await prepareGeneration(agent, body.message, history);

  const encoder = new TextEncoder();
  const conversationId = conversation.id;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "meta", conversationId });

      let fullText = "";
      try {
        // If we already know there's no context and the agent is strict,
        // skip the LLM call entirely and use the canonical fallback line.
        if (agent.answerOnlyFromKnowledgeBase && result.sources.length === 0) {
          fullText = FALLBACK_ANSWER;
          for (const word of fullText.split(/(\s+)/)) {
            send({ type: "delta", text: word });
            await new Promise((r) => setTimeout(r, 10));
          }
        } else {
          for await (const chunk of await streamAgentReply(agent, messages)) {
            if (chunk.delta) {
              fullText += chunk.delta;
              send({ type: "delta", text: chunk.delta });
            }
          }
        }
      } catch {
        fullText = "Something went wrong generating a response. Let me connect you with a specialist.";
        send({ type: "delta", text: fullText });
      }

      const aiMessage = await prisma.message.create({
        data: {
          conversationId,
          role: "AI",
          content: fullText,
          sources: result.sources.length ? JSON.stringify(result.sources) : null,
          confidence: result.confidence,
        },
      });

      const newStatus = result.shouldEscalate ? "HUMAN_REQUIRED" : "AI_HANDLING";
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: newStatus, lastMessageAt: new Date() },
      });

      if (result.shouldEscalate) {
        const existingTicket = await prisma.ticket.findUnique({ where: { conversationId } });
        if (!existingTicket) {
          const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
          if (conv) {
            const count = await prisma.ticket.count({ where: { workspaceId: agent.workspaceId } });
            await prisma.ticket.create({
              data: {
                workspaceId: agent.workspaceId,
                number: count + 1001,
                subject: body.message.slice(0, 80),
                priority: "MEDIUM",
                status: "OPEN",
                customerId: conv.customerId,
                conversationId,
              },
            });
            await prisma.notification.create({
              data: {
                workspaceId: agent.workspaceId,
                type: "escalation",
                title: "AI handed off a conversation",
                body: `${result.escalationReason || "Escalation triggered"} — a customer needs human help.`,
                href: `/dashboard/conversations/${conversationId}`,
              },
            });
          }
        }
        await prisma.analyticsEvent.create({
          data: { workspaceId: agent.workspaceId, type: "escalated", metadata: JSON.stringify({ conversationId, reason: result.escalationReason }) },
        });
      } else {
        await prisma.analyticsEvent.create({
          data: { workspaceId: agent.workspaceId, type: "ai_resolved", metadata: JSON.stringify({ conversationId }) },
        });
      }

      send({
        type: "done",
        messageId: aiMessage.id,
        sources: result.sources,
        confidence: result.confidence,
        escalate: result.shouldEscalate,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
