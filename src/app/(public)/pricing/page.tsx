import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQSection } from "@/components/landing/sections";

export const metadata: Metadata = { title: "Pricing — SupportAI" };

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container pb-4 pt-16 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">Plans that scale with your support volume</h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Every plan includes the full RAG pipeline, human handoff, and analytics. Upgrade as your conversation volume grows.
          </p>
        </div>
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
