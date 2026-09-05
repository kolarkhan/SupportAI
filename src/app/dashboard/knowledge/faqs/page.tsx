import { KnowledgeTabs } from "@/components/dashboard/knowledge/knowledge-tabs";

export default function KnowledgeFaqsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload documents, connect websites, and write FAQs to train your agent.</p>
      </div>
      <KnowledgeTabs initialTab="faqs" />
    </div>
  );
}
