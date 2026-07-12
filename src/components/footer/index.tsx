import Image from "next/image";
import Link from "next/link";

const features = [
  { label: "Deck Builder", href: "/deck-builder" },
  { label: "Gacha", href: "/gacha" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Inventory", href: "/inventory" },
];

export default function Footer() {
  return (
    <footer className="hidden lg:block w-full p-10 bg-linear-to-b from-[#2D3548] to-[#030A30]">
      <div className="flex gap-45 justify-between">
        <div>
          <Image
            src="/logo.svg"
            alt="AniVerse Nexus Logo"
            width={200}
            height={65}
            className="pointer-events-none w-max-content mx-8"
            draggable={false}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base">About</h3>
          <p className="text-sm leading-6 text-white">
            AniVerse Nexus is a Stellar-powered trading card experience built
            around pack opening, backend-owned inventory, real marketplace
            listings, and crossover-ready practice battles.
            <br />
            Pull cards, list duplicates, and keep collectible value plus
            gameplay value in one loop.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base">Features</h3>
          <ul className="flex flex-col gap-2">
            {features.map((feature) => (
              <li key={feature.href}>
                <Link
                  href={feature.href}
                  className="text-sm text-white hover:underline transition-all"
                >
                  {feature.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base">Contact Us</h3>
          <a
            href="mailto:aniversenexus@gmail.com"
            className="text-sm text-white hover:text-white transition-colors"
          >
            aniversenexus@gmail.com
          </a>
        </div>
      </div>

      <hr className="my-10 border-white" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          AniVerse Nexus &copy; 2026. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/aniverse_nexus/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <Image
              src="/assets/logo-instagram.svg"
              alt="Instagram"
              width={24}
              height={24}
            />
          </a>
          <a
            href="https://github.com/Reynard-sys/polkadot-hackathon/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <Image
              src="/assets/logo-github.svg"
              alt="GitHub"
              width={24}
              height={24}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
