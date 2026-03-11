"use client";
import Image from "next/image";
import HeroSection from "./components/hero-section";
import GameFeatures from "./components/game-features";
import PageBackground from "@/components/page-background";

export default function Home() {
  return (
    <PageBackground>
      {/* Home page content goes here */}
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
    </PageBackground>
  );
}
