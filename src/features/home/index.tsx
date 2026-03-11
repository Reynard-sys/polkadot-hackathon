"use client";
import Image from "next/image";
import HeroSection from "./components/hero-section";
import GameFeatures from "./components/game-features";
import HowToGetStarted from "./components/how-to-get-started";
import Footer from "./components/footer";
import PageBackground from "@/components/page-background";

export default function Home() {
  return (
    <PageBackground>
      <div className="flex flex-col gap-13 mt-10 lg:gap-25 lg:mt-0">
        <HeroSection />
        <Image
          src="/assets/desktop-divider.svg"
          alt="Divider"
          width={1440}
          height={80}
          className="hidden lg:block h-auto w-[90%] mx-auto pointer-events-none"
          draggable={false}
        />
        <GameFeatures />
        <HowToGetStarted />
        <Footer />
      </div>
    </PageBackground>
  );
}
