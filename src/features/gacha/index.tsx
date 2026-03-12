"use client";
import Image from "next/image";
import Pack from "./components/pack";
import PageBackground from "@/components/page-background";

export default function Gacha() {
  return (
    <PageBackground>
      <div className="flex flex-col max-w-sm mx-auto pt-24 px-4 gap-3">
        <Image
          src="/assets/mobile-game-features/mobile-tournaments.svg"
          alt="Mobile Tournaments"
          width={375}
          height={113}
          className="w-full h-auto pointer-events-none"
          draggable={false}
        />
        <Pack
          imageSrc="/assets/packs/naruto-pack.svg"
          imageAlt="Naruto Pack"
          packName="Naruto Pack"
          packInfo="[pack info]"
        />
      </div>
    </PageBackground>
  );
}
