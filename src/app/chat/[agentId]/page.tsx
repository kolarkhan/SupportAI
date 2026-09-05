import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Bot } from "lucide-react";

export default async function PublicChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { agentId } = await params;
  const { embed } = await searchParams;

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || !agent.isPublished) notFound();

  const agentInfo = {
    id: agent.id,
    name: agent.name,
    avatarEmoji: agent.avatarEmoji,
    brandColor: agent.brandColor,
    widgetWelcomeMessage: agent.widgetWelcomeMessage,
    widgetSuggested: agent.widgetSuggested,
  };

  if (embed === "1") {
    return (
      <div className="h-screen w-screen">
        <ChatWidget agent={agentInfo} compact />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Bot className="h-4 w-4" /> Powered by SupportAI
      </div>
      <div className="h-[680px] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        <ChatWidget agent={agentInfo} />
      </div>
    </div>
  );
}
