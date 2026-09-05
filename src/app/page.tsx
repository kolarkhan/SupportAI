import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Features, HowItWorks, Integrations, AnalyticsPreview, Testimonials, FAQSection, FinalCTA } from "@/components/landing/sections";
import { PricingSection } from "@/components/landing/pricing-section";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Integrations />
        <AnalyticsPreview />
        <Testimonials />
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
