"use client";
import HeroSection from "./components/hero-section";
import GameFeatures from "./components/game-features";
import PageBackground from "@/components/page-background";

export default function Home() {
    return (
        <PageBackground>
            {/* Home page content goes here */}
            <HeroSection />
            <GameFeatures />
        </PageBackground>
    );
}