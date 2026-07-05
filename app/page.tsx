import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import OfflineIndicatorDemo from "@/components/landing/OfflineIndicatorDemo";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import ScrollRevealProvider from "@/components/landing/ScrollRevealProvider";

export default function LandingPage() {
  return (
    <ScrollRevealProvider>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <OfflineIndicatorDemo />
        <CTASection />
      </main>
      <Footer />
    </ScrollRevealProvider>
  );
}
