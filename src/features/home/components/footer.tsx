import Image from "next/image";
import Link from "next/link";

// for future purposes
const features = [
  { label: "Deck Builder", href: "/features/deck-builder" },
  { label: "Gacha", href: "/features/gacha" },
  { label: "Marketplace", href: "/features/marketplace" },
  { label: "Tournaments", href: "/features/tournaments" },
  { label: "Inventory", href: "/features/inventory" },
];

export default function Footer() {
  return (
    <footer className="hidden lg:block w-full p-10 bg-linear-to-b from-[#2D3548] to-[#030A30]">
      {/* 4-column grid */}
      <div className="flex gap-45 justify-between">
        {/* Col 1 — Logo */}
        <div>
          <Image
            src="/logo.svg"
            alt="AniVerse Nexus Logo"
            width={177}
            height={65}
            className="pointer-events-none w-full"
            draggable={false}
          />
        </div>

        {/* Col 2 — About */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base">About</h3>
          <p className="text-sm leading-6 text-white">
            Lorem ipsum dolor sit amet consectetur. Nisl id eget arcu quam
            libero ipsum amet. Vel aliquet vel eget feugiat scelerisque est.
          </p>
        </div>

        {/* Col 3 — Features */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-base">Features</h3>
          <ul className="flex flex-col gap-2">
            {features.map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="text-sm text-white hover:underline transition-all"
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4 — Contact */}
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

      {/* Horizontal rule */}
      <hr className="my-10 border-white" />

      {/* Bottom bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">
          AniVerse Nexus &copy; 2026. All rights reserved.
        </p>

        <div className="flex items-center gap-4">
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <Image
              src="/assets/linkedin.svg"
              alt="LinkedIn"
              width={24}
              height={24}
            />
          </a>
          <a
            href="https://github.com"
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
