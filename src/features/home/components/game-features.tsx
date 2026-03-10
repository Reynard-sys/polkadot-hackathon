import Image from "next/image";

const features = [
  { src: "/assets/mobile-game-features/mobile-deck-builder.svg", alt: "Deck Builder" },
  { src: "/assets/mobile-game-features/mobile-gacha-system.svg", alt: "Gacha System" },
  { src: "/assets/mobile-game-features/mobile-inventory.svg", alt: "Inventory" },
  { src: "/assets/mobile-game-features/mobile-marketplace.svg", alt: "Marketplace" },
  { src: "/assets/mobile-game-features/mobile-ownership.svg", alt: "Ownership" },
  { src: "/assets/mobile-game-features/mobile-tournaments.svg", alt: "Tournaments" },
];

export default function GameFeatures() {
  return (
    <section className="w-full flex flex-col items-center gap-6 px-5 py-12 lg:py-20">
    <p className="text-lg font-bold">Game Features</p>
      <div className="flex flex-col w-full gap-3 lg:hidden pt-14">
        {features.map((feature) => (
          <Image
            key={feature.src}
            src={feature.src}
            alt={feature.alt}
            width={375}
            height={113}
            className="w-full h-auto pointer-events-none"
            draggable={false}
          />
        ))}
      </div>
    </section>
  );
}
