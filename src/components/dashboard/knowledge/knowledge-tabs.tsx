"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentsPanel } from "./documents-panel";
import { WebsitesPanel } from "./websites-panel";
import { FAQsPanel } from "./faqs-panel";

// Local tab state rather than route-per-tab — this now lives nested inside
// the AI Agent page (see agent-builder.tsx) rather than as its own
// standalone /dashboard/knowledge destination, so switching sub-tabs must
// stay on the current page instead of navigating away from it.
export function KnowledgeTabs({ initialTab }: { initialTab: "documents" | "websites" | "faqs" }) {
  return (
    <Tabs defaultValue={initialTab}>
      <TabsList>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="websites">Websites</TabsTrigger>
        <TabsTrigger value="faqs">FAQs</TabsTrigger>
      </TabsList>
      <TabsContent value="documents"><DocumentsPanel /></TabsContent>
      <TabsContent value="websites"><WebsitesPanel /></TabsContent>
      <TabsContent value="faqs"><FAQsPanel /></TabsContent>
    </Tabs>
  );
}
