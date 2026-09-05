"use client";

import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/dashboard/conversations/conversation-list";

export default function ConversationsPage() {
  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] overflow-hidden rounded-none border-border bg-background sm:-m-6 lg:-m-8 lg:rounded-xl lg:border">
      <div className="w-full border-r border-border md:w-80 lg:w-96">
        <ConversationList />
      </div>
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="mx-auto h-8 w-8 opacity-40" />
          <p className="mt-3 text-sm">Select a conversation to view the full thread</p>
        </div>
      </div>
    </div>
  );
}
