"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentsPanel } from "./documents-panel";
import { WebsitesPanel } from "./websites-panel";
import { FAQsPanel } from "./faqs-panel";

const ROUTES: Record<string, string> = {
  documents: "/dashboard/knowledge/documents",
  websites: "/dashboard/knowledge/websites",
  faqs: "/dashboard/knowledge/faqs",
};

export function KnowledgeTabs({ initialTab }: { initialTab: "documents" | "websites" | "faqs" }) {
  const router = useRouter();

  return (
    <Tabs value={initialTab} onValueChange={(v) => router.push(ROUTES[v])}>
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
