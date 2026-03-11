import Image from "next/image";

const mobileFeatures = [
  {
    src: "/assets/mobile-game-features/mobile-deck-builder.svg",
    alt: "Deck Builder",
  },
  {
    src: "/assets/mobile-game-features/mobile-gacha-system.svg",
    alt: "Gacha System",
  },
  {
    src: "/assets/mobile-game-features/mobile-inventory.svg",
    alt: "Inventory",
  },
  {
    src: "/assets/mobile-game-features/mobile-marketplace.svg",
    alt: "Marketplace",
  },
  {
    src: "/assets/mobile-game-features/mobile-ownership.svg",
    alt: "Ownership",
  },
  {
    src: "/assets/mobile-game-features/mobile-tournaments.svg",
    alt: "Tournaments",
  },
];

const desktopFeaturesCol1 = [
  {
    src: "/assets/desktop-game-features/desktop-gacha-system.svg",
    alt: "Gacha System",
  },
  {
    src: "/assets/desktop-game-features/desktop-tournaments.svg",
    alt: "Tournaments",
  },
  {
    src: "/assets/desktop-game-features/desktop-inventory.svg",
    alt: "Inventory",
  },
];

const desktopFeaturesCol2 = [
  {
    src: "/assets/desktop-game-features/desktop-deck-builder.svg",
    alt: "Deck Builder",
  },
  {
    src: "/assets/desktop-game-features/desktop-marketplace.svg",
    alt: "Marketplace",
  },
  {
    src: "/assets/desktop-game-features/desktop-true-ownership.svg",
    alt: "True Ownership",
  },
];

export default function GameFeatures() {
  return (
    <section className="w-full flex flex-col items-center gap-6 px-5 lg:py-10">
      <p className="text-3xl font-bold">Game Features</p>

      {/* Mobile layout */}
      <div className="flex flex-col w-full gap-3 lg:hidden pt-14">
        {mobileFeatures.map((feature) => (
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

      {/* Desktop layout — 2-column grid */}
      <div className="hidden lg:grid grid-cols-2 w-full gap-4 pt-14 px-10">
        {/* Column 1 */}
        <div className="flex flex-col gap-4">
          {desktopFeaturesCol1.map((feature) => (
            <Image
              key={feature.src}
              src={feature.src}
              alt={feature.alt}
              width={522}
              height={187}
              className="w-full h-auto pointer-events-none"
              draggable={false}
            />
          ))}
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-4">
          {desktopFeaturesCol2.map((feature) => (
            <Image
              key={feature.src}
              src={feature.src}
              alt={feature.alt}
              width={522}
              height={187}
              className="w-full h-auto pointer-events-none"
              draggable={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
