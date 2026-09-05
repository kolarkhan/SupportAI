"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConversationList } from "@/components/dashboard/conversations/conversation-list";
import { ConversationDetail } from "@/components/dashboard/conversations/conversation-detail";

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] overflow-hidden rounded-none border-border bg-background sm:-m-6 lg:-m-8 lg:rounded-xl lg:border">
      {/*
        The list only fits alongside the thread + customer panel once the
        nav sidebar (256px, shows at lg) + this list (384px) + the panel
        (320px, see conversation-detail.tsx) all coexist — that's 960px of
        fixed columns, which only leaves a usable width for the thread
        itself from ~1280px (xl) up. Below xl the list steps aside; the
        "All conversations" link below keeps it reachable.
      */}
      <div className="hidden w-80 shrink-0 border-r border-border xl:block xl:w-96">
        <ConversationList activeId={id} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href="/dashboard/conversations"
          className="flex shrink-0 items-center gap-1.5 border-b border-border px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground xl:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All conversations
        </Link>
        <div className="min-h-0 flex-1">
          <ConversationDetail conversationId={id} />
        </div>
      </div>
    </div>
  );
}
