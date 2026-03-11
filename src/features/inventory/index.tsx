"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Footer from "@/components/footer";

type Rarity = "common" | "rare" | "legendary" | "mythic";
type ElementType = "fire" | "water" | "earth" | "air" | "multitype";

type InventoryCard = {
  id: number;
  title: string;
  subtitle: string;
  rarity: Rarity;
  element: ElementType;
  art: string;
  setName: string;
  infoLabel: string;
  description: string;
};

const INVENTORY_CARDS: InventoryCard[] = [
  { id: 1, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "legendary", element: "fire", art: "/assets/deck-builder/cards/art-legendary.png", setName: "One Piece Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 2, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "rare", element: "water", art: "/assets/deck-builder/cards/art-common.png", setName: "Soul Reaper Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 3, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "common", element: "earth", art: "/assets/deck-builder/cards/art-rare.png", setName: "Ninja Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 4, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "legendary", element: "air", art: "/assets/deck-builder/cards/art-legendary.png", setName: "One Piece Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 5, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "mythic", element: "multitype", art: "/assets/deck-builder/cards/art-mythic.png", setName: "Mythic Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 6, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "rare", element: "water", art: "/assets/deck-builder/cards/art-common.png", setName: "Soul Reaper Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 7, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "common", element: "earth", art: "/assets/deck-builder/cards/art-rare.png", setName: "Ninja Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 8, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "mythic", element: "fire", art: "/assets/deck-builder/cards/art-mythic.png", setName: "Mythic Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
  { id: 9, title: "Lorem Ipsum", subtitle: "Lorem ipsum dolor amet lorem ipsum dolor", rarity: "legendary", element: "air", art: "/assets/deck-builder/cards/art-legendary.png", setName: "One Piece Pack", infoLabel: "[Card Info]", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam." },
];

const RARITY_META: Record<Rarity, { frame: string; chip: string; border: string; detailLabel: string; valueColor: string; tagBg: string }> = {
  common: { frame: "/assets/deck-builder/cards/frame-common.svg", chip: "bg-[#616161]", border: "border-[#a2a2a2]", detailLabel: "Common", valueColor: "text-[#a2a2a2]", tagBg: "bg-[#616161]" },
  rare: { frame: "/assets/deck-builder/cards/frame-rare.svg", chip: "bg-[#009f3d]", border: "border-[#1fc16b]", detailLabel: "Rare", valueColor: "text-[#1fc16b]", tagBg: "bg-[#1fc16b]" },
  legendary: { frame: "/assets/deck-builder/cards/frame-legendary.svg", chip: "bg-[#c59f00]", border: "border-[#dfb400]", detailLabel: "Legendary", valueColor: "text-[#dfb400]", tagBg: "bg-[#dfb400]" },
  mythic: { frame: "/assets/deck-builder/cards/frame-mythic.svg", chip: "bg-[#3a65a9]", border: "border-[#ea4335]", detailLabel: "Mythic", valueColor: "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)] bg-clip-text text-transparent", tagBg: "bg-[linear-gradient(180deg,#EA4335_0%,#F9AB00_45.192%,#96A92A_75%,#4285F4_100%)]" },
};

const MOBILE_RARITY_FILTERS: Array<{ id: "all" | Rarity; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "common", label: "COMMON" },
  { id: "rare", label: "RARE" },
  { id: "legendary", label: "LEGENDARY" },
  { id: "mythic", label: "MYTHIC" },
];

const DESKTOP_RARITY_FILTERS: Array<{ id: "all" | Rarity; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "common", label: "Common" },
  { id: "rare", label: "Rare" },
  { id: "legendary", label: "Legendary" },
  { id: "mythic", label: "Mythic" },
];

const ELEMENT_FILTERS: Array<{ id: "all" | ElementType; label: string }> = [
  { id: "all", label: "ALL" },
  { id: "fire", label: "Fire" },
  { id: "water", label: "Water" },
  { id: "earth", label: "Earth" },
  { id: "air", label: "Air" },
  { id: "multitype", label: "Multitype" },
];

function IconLine({ className = "h-6 w-6 text-white" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 5l-7 7 7 7" />
      <path d="M9 12h10" />
    </svg>
  );
}

function SetInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h12v4c0 3.5-2.7 5.6-6 6-3.3-.4-6-2.5-6-6V4z" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </svg>
  );
}

function CardInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="8" cy="9" r="2.4" />
      <path d="M3.8 16.3c1-2.1 2.9-3.2 4.2-3.2s3.1 1.1 4.2 3.2" />
      <circle cx="16.2" cy="9.7" r="1.9" />
      <path d="M13.8 15.8c.7-1.3 1.8-2 2.9-2 .8 0 1.8.4 2.6 1.4" />
    </svg>
  );
}

function InventoryTopCard() {
  return (
    <section className="w-full">
      <Image src="/assets/mobile-game-features/mobile-inventory.svg" alt="My Inventory" width={375} height={113} className="h-auto w-full" priority />
    </section>
  );
}

function InventoryMainMobileHeader() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-[rgba(151,151,151,0.2)] bg-[#272727] md:hidden">
      <div className="mx-auto flex h-full w-full max-w-[412px] items-center justify-between px-[16px]">
        <div className="h-[28px] w-[98px]" />
        <button type="button" className="flex h-[40px] w-[40px] items-center justify-center" aria-label="Open menu">
          <IconLine />
        </button>
      </div>
    </div>
  );
}

function InventoryDetailMobileHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-[rgba(151,151,151,0.2)] bg-[#272727] md:hidden">
      <div className="mx-auto grid h-full w-full max-w-[412px] grid-cols-[40px_1fr_40px] items-center px-[16px]">
        <button type="button" onClick={onBack} className="flex h-[40px] w-[40px] items-center justify-center" aria-label="Back">
          <BackIcon />
        </button>
        <p className="text-center text-[20px] leading-[16px] font-normal text-white">View</p>
        <button type="button" className="flex h-[40px] w-[40px] items-center justify-center" aria-label="Open menu">
          <IconLine />
        </button>
      </div>
    </div>
  );
}

function CardSprite({ card, onClick }: { card: InventoryCard; onClick: (card: InventoryCard) => void }) {
  const meta = RARITY_META[card.rarity];

  return (
    <button type="button" onClick={() => onClick(card)} className={`group relative h-[255px] w-full overflow-hidden rounded-[6px] border ${meta.border} text-left shadow-[0_8px_20px_rgba(0,0,0,0.35)]`} aria-label={`View ${card.title}`}>
      <Image src={card.art} alt={card.title} fill className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_32%,rgba(0,0,0,0.24)_70%,rgba(0,0,0,0.5)_100%)]" />
      <Image src={meta.frame} alt="" fill className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className={`absolute left-[6px] top-[6px] flex h-7 w-7 items-center justify-center rounded-full bg-[#e8e8e8] text-[14px] font-bold ${meta.valueColor}`}>1</div>
      <div className="absolute right-[6px] top-[6px] flex items-center gap-1 text-[13px] font-bold text-white">
        <span>0</span>
        <span className="h-[12px] w-[12px] rounded-full border border-white/30 bg-white/20" />
      </div>
      <div className="absolute left-1/2 top-[117px] w-[89%] -translate-x-1/2 rounded-[4px] bg-[rgba(183,183,183,0.52)] px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-[10px] min-w-[14px] items-center justify-center rounded-[2px] bg-[#30d158] px-1 text-[7px] font-medium text-white">0</span>
          <p className="text-[7px] font-semibold text-[#333333]">Lorem ipsum dolor sit</p>
        </div>
        <p className="mt-1 text-[5px] leading-[7px] text-[#333333]">Lorem ipsum dolor sit amet consectetur. Suspendisse faucibus mi arcu condimentum.</p>
      </div>
      <div className="absolute inset-x-[7px] bottom-[7px] overflow-hidden rounded-b-[6px]">
        <div className="px-2 pt-3 pb-2">
          <p className="text-center text-[5.8px] tracking-[2px] text-[#e8e8e8]">Lorem Ipsum</p>
          <p className="mt-0.5 text-center text-[27px] leading-[1] font-bold text-white">{card.title}</p>
          <div className={`mt-1 h-[8px] rounded-[2px] ${meta.chip}`} />
          <p className="mt-0.5 text-center text-[4.9px] text-[#d2d2d2]">{card.subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function DetailCard({ card }: { card: InventoryCard }) {
  const meta = RARITY_META[card.rarity];

  return (
    <div className="relative h-[507px] w-full max-w-[360px] overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
      <Image src={card.art} alt={card.title} fill className="object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_30%,rgba(0,0,0,0.2)_68%,rgba(0,0,0,0.58)_100%)]" />
      <Image src={meta.frame} alt="" fill className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />
      <div className={`absolute left-[12px] top-[10px] flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8e8] text-[38px] leading-none font-bold ${meta.valueColor}`}>1</div>
      <div className="absolute right-[14px] top-[10px] flex items-center gap-2 text-[26px] leading-none font-bold text-white">
        <span>0</span>
        <span className="h-6 w-6 rounded-full border border-white/30 bg-white/20" />
      </div>
      <div className="absolute left-1/2 top-[232px] w-[322px] -translate-x-1/2 rounded-[4px] bg-[rgba(183,183,183,0.52)] p-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-[19px] min-w-[29px] items-center justify-center rounded-[2px] bg-[#30d158] px-1 text-[14px] font-medium text-white">0</span>
          <p className="text-sm font-semibold text-[#333333]">Lorem ipsum dolor sit</p>
        </div>
        <p className="mt-1.5 text-[10px] leading-[15px] text-[#333333]">Lorem ipsum dolor sit amet consectetur. Suspendisse faucibus mi arcu condimentum. Lectus tristique sit diam faucibus consectetur.</p>
      </div>
      <div className="absolute bottom-[5px] left-1/2 w-[352px] -translate-x-1/2 overflow-hidden rounded-b-[12px]">
        <div className="px-4 pt-4 pb-3">
          <p className="text-center text-[11px] tracking-[2px] text-[#e8e8e8]">Lorem Ipsum</p>
          <p className="mt-1 text-center text-[38px] leading-[1] font-bold text-white">{card.title}</p>
          <div className={`mt-2 h-4 rounded-[2px] ${meta.chip}`} />
          <p className="mt-1 text-center text-[10px] text-[#d2d2d2]">{card.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SellButtonMobile() {
  return (
    <button type="button" className="relative mx-auto h-[47.957px] w-full max-w-[348.459px]" aria-label="Sell card">
      <span className="pointer-events-none absolute inset-[-16.22%_-3.72%_-37.84%_-3.72%]">
        <Image src="/assets/inventory/sell-button-union.svg" alt="" fill className="object-fill" aria-hidden />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-center text-[14.102px] leading-[21.937px] font-bold text-white">Sell</span>
    </button>
  );
}

function SellButtonDesktop() {
  return (
    <button type="button" className="relative h-[47.957px] w-full max-w-[434.323px]" aria-label="Sell card">
      <span className="pointer-events-none absolute inset-[-16.22%_-2.98%_-37.84%_-2.98%]">
        <Image src="/assets/inventory/web/sell-button-union-desktop.svg" alt="" fill className="object-fill" aria-hidden />
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">Sell</span>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#99a1af]" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

function DownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#707b90]" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
      <path d="M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5zM3 9.5h4v11H3v-11zm7 0h3.8v1.8h.1c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.15h-4v-4.56c0-1.09-.02-2.5-1.53-2.5-1.53 0-1.77 1.2-1.77 2.43v4.63h-4v-11z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.82-.27.82-.58v-2.1c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.74-1.33-1.74-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.06 1.82 2.8 1.3 3.49.99.1-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.13-.3-.54-1.52.12-3.16 0 0 1.02-.33 3.34 1.24a11.5 11.5 0 0 1 6.08 0c2.32-1.57 3.34-1.24 3.34-1.24.66 1.64.25 2.86.12 3.16.77.85 1.24 1.93 1.24 3.25 0 4.63-2.8 5.66-5.48 5.96.43.37.82 1.1.82 2.23v3.3c0 .31.22.69.83.58A12 12 0 0 0 12 .5z" />
    </svg>
  );
}

function DesktopInventoryFooter() {
  return (
    <footer className="hidden bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] px-10 py-10 md:block">
      <div className="mx-auto max-w-[1366px] space-y-10">
        <div className="grid grid-cols-[180px_290px_140px_173px] items-start gap-[180px]">
          <Image src="/logo.svg" alt="AniVerse Nexus" width={177} height={65} className="h-auto w-[177px]" />

          <div className="space-y-3 text-white">
            <p className="text-[16px] leading-[24px] font-bold">About</p>
            <p className="text-[16px] leading-[24px]">
              Lorem ipsum dolor sit amet consectetur. Nisl id eget arcu quam libero ipsum amet. Vel aliquet vel eget feugiat scelerisque est.
            </p>
          </div>

          <div className="space-y-3 text-white">
            <p className="text-[16px] leading-[24px] font-bold">Features</p>
            <div className="space-y-1 text-[16px] leading-[24px]">
              <p>Deck Builder</p>
              <p>Gacha</p>
              <p>Marketplace</p>
              <p>Tournaments</p>
              <p>Inventory</p>
            </div>
          </div>

          <div className="space-y-3 text-white">
            <p className="text-[16px] leading-[24px] font-bold">Contact Us</p>
            <p className="text-[16px] leading-[24px]">[email]@gmail.com</p>
          </div>
        </div>

        <div className="h-px w-full bg-[#c1c7cd]" />

        <div className="flex items-center justify-between text-white">
          <p className="text-[16px] leading-[24px] font-bold">[Team Name] AniVerse Nexus @ 2026. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <LinkedInIcon />
            <GitHubIcon />
          </div>
        </div>
      </div>
    </footer>
  );
}

function DesktopCardModal({ card, onClose }: { card: InventoryCard; onClose: () => void }) {
  const meta = RARITY_META[card.rarity];
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-6">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close overlay" />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-label="Close modal">
          <CloseIcon />
        </button>
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <DetailCard card={card} />
          <div className="flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[26px] leading-[39px] font-bold text-white">Card title</h2>
                <p className="mt-1 text-[14px] leading-[20px] text-[#99a1af]">[Card Info]</p>
              </div>
              <span className={`mt-2 inline-flex h-[26px] min-w-[92px] items-center justify-center rounded-full px-4 text-[12.936px] font-bold text-white ${meta.tagBg}`}>{meta.detailLabel}</span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-[14px] text-[#99a1af]">Set</p>
                <p className="text-[16px] leading-[24px] font-medium text-white">{card.setName}</p>
              </div>
              <div>
                <p className="text-[14px] text-[#99a1af]">Card Info</p>
                <p className="text-[16px] leading-[24px] font-medium text-white">{card.infoLabel}</p>
              </div>
            </div>
            <div className="mt-5 rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
              <p className="text-[16px] leading-[24px] font-bold text-white">Description</p>
              <p className="mt-3 text-[14px] leading-[22.75px] text-[#99a1af]">{card.description}</p>
            </div>
            <div className="mx-auto mt-4 w-full max-w-[270px]">
              <Image src="/assets/inventory/web/filter-separator.svg" alt="" width={661} height={31} className="h-auto w-full" aria-hidden />
            </div>
            <div className="mt-4">
              <SellButtonDesktop />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopFilterModal({
  rarity,
  setRarity,
  element,
  setElement,
  onClose,
  onReset,
  onApply,
}: {
  rarity: "all" | Rarity;
  setRarity: (value: "all" | Rarity) => void;
  element: "all" | ElementType;
  setElement: (value: "all" | ElementType) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const activeCount = (rarity === "all" ? 0 : 1) + (element === "all" ? 0 : 1);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 p-6">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close overlay" />
      <div className="relative z-10 w-full max-w-[912px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
        <div className="flex items-start justify-between">
          <h2 className="text-[22px] font-bold text-white">Filter Search</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Rarity</p>
            <div className="flex flex-wrap gap-3">
              {DESKTOP_RARITY_FILTERS.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setRarity(tab.id)} className={`h-[40px] rounded-[6px] px-[16px] text-[16.075px] font-bold text-white ${rarity === tab.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)]" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)]"}`}>{tab.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Card Element</p>
            <div className="flex flex-wrap gap-3">
              {ELEMENT_FILTERS.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setElement(tab.id)} className={`h-[40px] rounded-[6px] px-[16px] text-[16.075px] font-bold text-white ${element === tab.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)]" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)]"}`}>{tab.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-[18.79px] text-[#d2d2d2]/70">Amount</p>
            <button type="button" className="flex h-[70px] w-full items-center justify-between rounded-[6px] border border-[#f4f4f4] bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] px-4 text-[16px] text-[#e8e8e8]">
              Low to High (Lowest First)
              <DownIcon />
            </button>
          </div>
        </div>
        <div className="mx-auto mt-6 w-full max-w-[660px]">
          <Image src="/assets/inventory/web/filter-separator.svg" alt="" width={661} height={31} className="h-auto w-full" aria-hidden />
        </div>
        <div className="mt-5 flex gap-[18px]">
          <button type="button" onClick={onReset} className="relative h-[48px] flex-1">
            <span className="pointer-events-none absolute inset-[-16.22%_-3.11%_-37.84%_-3.11%]"><Image src="/assets/inventory/web/filter-reset-union.svg" alt="" fill className="object-fill" aria-hidden /></span>
            <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">Reset All</span>
          </button>
          <button type="button" onClick={onApply} className="relative h-[48px] flex-1">
            <span className="pointer-events-none absolute inset-[-16.22%_-3.11%_-37.84%_-3.11%]"><Image src="/assets/inventory/web/filter-apply-union.svg" alt="" fill className="object-fill" aria-hidden /></span>
            <span className="absolute inset-0 flex items-center justify-center text-[14.102px] font-bold text-white">{`Apply Filters (${activeCount})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [activeFilter, setActiveFilter] = useState<"all" | Rarity>("all");
  const [selectedCard, setSelectedCard] = useState<InventoryCard | null>(null);
  const [desktopSearch, setDesktopSearch] = useState("");
  const [desktopRarity, setDesktopRarity] = useState<"all" | Rarity>("all");
  const [desktopElement, setDesktopElement] = useState<"all" | ElementType>("all");
  const [draftRarity, setDraftRarity] = useState<"all" | Rarity>("all");
  const [draftElement, setDraftElement] = useState<"all" | ElementType>("all");
  const [desktopFilterOpen, setDesktopFilterOpen] = useState(false);
  const [desktopSelectedCard, setDesktopSelectedCard] = useState<InventoryCard | null>(null);

  const mobileVisibleCards = useMemo(() => (activeFilter === "all" ? INVENTORY_CARDS : INVENTORY_CARDS.filter((c) => c.rarity === activeFilter)), [activeFilter]);
  const desktopVisibleCards = useMemo(() => {
    const q = desktopSearch.trim().toLowerCase();
    return INVENTORY_CARDS.filter((c) => (desktopRarity === "all" || c.rarity === desktopRarity) && (desktopElement === "all" || c.element === desktopElement) && (q.length === 0 || c.title.toLowerCase().includes(q) || c.setName.toLowerCase().includes(q)));
  }, [desktopSearch, desktopRarity, desktopElement]);

  const openFilters = () => {
    setDraftRarity(desktopRarity);
    setDraftElement(desktopElement);
    setDesktopFilterOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#171717] pb-32 pt-0 text-white md:pb-0 md:pt-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[74px] md:hidden">
        <div className="absolute -left-[178px] -top-[43px] h-[243px] w-[243px] rounded-full bg-[#6f74ac]/42 blur-[132px]" />
        <div className="absolute -right-[110px] top-[172px] h-[226px] w-[186px] rounded-full bg-[#001fe8]/32 blur-[130px]" />
        <div className="absolute -left-[152px] top-[549px] h-[226px] w-[186px] rounded-full bg-[#00135f]/28 blur-[128px]" />
      </div>
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute -left-[225px] -top-[113px] h-[379px] w-[350px] rounded-full bg-[#6f74ac]/38 blur-[152px]" />
        <div className="absolute left-[26%] -top-[423px] h-[615px] w-[1189px] rounded-full bg-[#001fe8]/24 blur-[170px]" />
        <div className="absolute right-[-258px] top-[880px] h-[924px] w-[436px] rounded-full bg-[#001fe8]/24 blur-[170px]" />
      </div>

      {!selectedCard ? <InventoryMainMobileHeader /> : <InventoryDetailMobileHeader onBack={() => setSelectedCard(null)} />}

      <div className="relative z-10 mx-auto w-full max-w-[412px] px-[18px] pt-[101px] md:hidden">
        {!selectedCard ? (
          <section className="space-y-4">
            <InventoryTopCard />
            <div className="flex items-center justify-between gap-2">
              {MOBILE_RARITY_FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => setActiveFilter(f.id)} className={`h-[26px] rounded-[4px] px-[10px] text-[10.769px] font-bold ${activeFilter === f.id ? "bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)] text-white" : "bg-[linear-gradient(180deg,#2D3548_0%,#030A30_100%)] text-white"}`}>{f.label}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">{mobileVisibleCards.map((card) => <CardSprite key={card.id} card={card} onClick={setSelectedCard} />)}</div>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="flex justify-center"><DetailCard card={selectedCard} /></div>
            <div className="mx-auto flex w-full max-w-[365px] flex-col items-center gap-5 px-[15.995px]">
              <div className="mt-1 flex h-[42px] w-full max-w-[348px] items-start justify-between">
                <div className="w-[202px]"><p className="text-[18px] leading-[28px] font-bold text-white">Card title</p><p className="text-[14px] leading-[20px] font-normal text-[#e8e8e8]">[Card info]</p></div>
                <span className="mt-0.5 inline-flex h-[26px] w-[92px] items-center justify-center rounded-[62758468px] bg-[#1fc16b] text-[12.936px] leading-[17.248px] font-bold text-white">{RARITY_META[selectedCard.rarity].detailLabel}</span>
              </div>
              <div className="relative h-[36px] w-full max-w-[348px]">
                <div className="absolute left-0 top-0 flex h-[35.975px] items-center gap-[7.997px]"><SetInfoIcon /><div className="h-[35.975px]"><p className="text-[12px] leading-[16px] font-normal text-[#e8e8e8]">Set</p><p className="text-[14px] leading-[20px] font-bold text-white">{selectedCard.setName}</p></div></div>
                <div className="absolute left-[156.18px] top-0 flex h-[35.975px] items-center gap-[7.997px]"><CardInfoIcon /><div className="h-[35.975px]"><p className="text-[12px] leading-[16px] font-normal text-[#e8e8e8]">[Card Info]</p><p className="text-[14px] leading-[20px] font-bold text-white">{selectedCard.infoLabel}</p></div></div>
              </div>
              <div className="h-[220px] w-[361px] max-w-full rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-px"><p className="text-[12px] leading-[24px] font-bold text-white">Description</p><p className="mt-2 text-[14px] leading-[32px] font-normal text-[#99a1af]">{selectedCard.description}</p></div>
              <div className="w-full pb-2"><SellButtonMobile /></div>
            </div>
          </section>
        )}
      </div>

      <div className="relative z-10 mx-auto hidden w-full max-w-[1257px] px-6 pb-24 pt-6 md:block">
        <section className="space-y-8 text-center">
          <h1 className="text-[68px] leading-[1.05] font-bold text-white">Inventory</h1>
          <p className="mx-auto max-w-[720px] text-[18px] leading-[27px] text-white/80">Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus varius sagittis mi diam eget penatibus. Ut praesent ut auctor turpis cursus id.</p>
          <Image src="/assets/inventory/web/hero-separator.svg" alt="" width={1257} height={75} className="h-auto w-full" aria-hidden />
          <div className="mx-auto mt-2 max-w-[1113px] space-y-8 text-left">
            <div className="flex items-center gap-4">
              <label className="relative flex h-[57px] flex-1 items-center rounded-[10px] border border-[#1f2540] bg-[#151932] pl-12 pr-4"><span className="pointer-events-none absolute left-4"><SearchIcon /></span><input value={desktopSearch} onChange={(e) => setDesktopSearch(e.target.value)} placeholder="Search cards..." className="w-full bg-transparent text-[18px] text-white placeholder:text-[#99a1af] outline-none" /></label>
              <button type="button" onClick={openFilters} className="flex h-[57px] w-[121px] items-center justify-center gap-2 rounded-[10px] border border-[#1f2540] bg-[#151932] text-[18px] text-white"><FilterIcon />Filters</button>
            </div>
            <div className="grid grid-cols-3 gap-4">{desktopVisibleCards.map((card) => <button key={card.id} type="button" onClick={() => setDesktopSelectedCard(card)} className="overflow-hidden rounded-[12px] text-left transition hover:-translate-y-0.5"><DetailCard card={card} /></button>)}</div>
          </div>
        </section>
      </div>

      <Footer />

      {desktopSelectedCard && <DesktopCardModal card={desktopSelectedCard} onClose={() => setDesktopSelectedCard(null)} />}
      {desktopFilterOpen && (
        <DesktopFilterModal
          rarity={draftRarity}
          setRarity={setDraftRarity}
          element={draftElement}
          setElement={setDraftElement}
          onClose={() => setDesktopFilterOpen(false)}
          onReset={() => {
            setDraftRarity("all");
            setDraftElement("all");
          }}
          onApply={() => {
            setDesktopRarity(draftRarity);
            setDesktopElement(draftElement);
            setDesktopFilterOpen(false);
          }}
        />
      )}
    </main>
  );
}
