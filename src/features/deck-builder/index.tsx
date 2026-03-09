"use client";

import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useMemo, useState } from "react";

type CardVariant = "rare" | "mythic" | "common" | "legendary";

type CardItem = {
  id: number;
  name: string;
  faction: string;
  variant: CardVariant;
  accent: string;
  gradient: string;
  art: string;
  frame: string;
};

type SavedDeck = {
  id: number;
  name: string;
  cards: Array<CardItem | null>;
};

const TOTAL_SLOTS = 8;

const AVAILABLE_CARDS: CardItem[] = [
  {
    id: 1,
    name: "Rare Striker",
    faction: "Rare",
    variant: "rare",
    accent: "#f87171",
    gradient: "from-rose-300/80 via-red-500/70 to-zinc-900/90",
    art: "/assets/deck-builder/v2/cards/art-rare.png",
    frame: "/assets/deck-builder/v2/cards/frame-rare.svg",
  },
  {
    id: 2,
    name: "Mythic Guard",
    faction: "Mythic",
    variant: "mythic",
    accent: "#facc15",
    gradient: "from-yellow-300/90 via-orange-400/70 to-red-950/90",
    art: "/assets/deck-builder/v2/cards/art-mythic.png",
    frame: "/assets/deck-builder/v2/cards/frame-mythic.svg",
  },
  {
    id: 3,
    name: "Common Shade",
    faction: "Common",
    variant: "common",
    accent: "#34d399",
    gradient: "from-emerald-300/90 via-teal-500/70 to-slate-900/90",
    art: "/assets/deck-builder/v2/cards/art-common.png",
    frame: "/assets/deck-builder/v2/cards/frame-common.svg",
  },
  {
    id: 4,
    name: "Legendary Ace",
    faction: "Legendary",
    variant: "legendary",
    accent: "#22d3ee",
    gradient: "from-sky-300/90 via-blue-500/70 to-indigo-950/90",
    art: "/assets/deck-builder/v2/cards/art-legendary.png",
    frame: "/assets/deck-builder/v2/cards/frame-legendary.svg",
  },
];

const PREVIEW_DECK_CARDS = [AVAILABLE_CARDS[0], AVAILABLE_CARDS[1], AVAILABLE_CARDS[2], AVAILABLE_CARDS[3]];

const CARD_META: Record<
  CardVariant,
  {
    artClass: string;
    ellipse: string;
    element: string;
    elementIcon: string;
    badgeClass: string;
    badgeStyle?: CSSProperties;
  }
> = {
  rare: {
    artClass: "h-[144%] w-[100.15%] left-[-0.07%] top-[-22%]",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-rare.svg",
    element: "/assets/deck-builder/v2/cards/element-rare.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-rare.png",
    badgeClass: "text-[#1fc16b]",
  },
  mythic: {
    artClass: "h-[139%] w-[96.79%] left-[1.61%] top-[-39%]",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-mythic.svg",
    element: "/assets/deck-builder/v2/cards/element-mythic.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-mythic.png",
    badgeClass: "text-transparent bg-clip-text",
    badgeStyle: {
      backgroundImage:
        "linear-gradient(180deg, rgb(234, 67, 53) 0%, rgb(249, 171, 0) 45.192%, rgb(150, 169, 42) 75%, rgb(66, 133, 244) 100%)",
    },
  },
  common: {
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-common.svg",
    element: "/assets/deck-builder/v2/cards/element-common.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-common.png",
    badgeClass: "text-[#a2a2a2]",
  },
  legendary: {
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    ellipse: "/assets/deck-builder/v2/cards/ellipse-legendary.svg",
    element: "/assets/deck-builder/v2/cards/element-legendary.svg",
    elementIcon: "/assets/deck-builder/v2/cards/element-icon-legendary.png",
    badgeClass: "text-[#dfb400]",
  },
};

const DESKTOP_SAVED_CARD_META: Record<
  CardVariant,
  {
    art: string;
    artClass: string;
    frame: string;
    pattern: string;
    union: string;
    unionMode: "full" | "strip";
    ellipse: string;
    element: string;
    elementIcon: string;
    tierBg?: string;
    tierSecondaryBg: string;
    badgeClass: string;
    badgeStyle?: CSSProperties;
  }
> = {
  mythic: {
    art: "/assets/deck-builder/web/cards-514/mythic-art.png",
    artClass: "h-[139%] w-[96.79%] left-[1.61%] top-[-39%]",
    frame: "/assets/deck-builder/web/cards-514/mythic-frame.svg",
    pattern: "/assets/deck-builder/web/cards-514/mythic-pattern.svg",
    union: "/assets/deck-builder/web/cards-514/mythic-union.svg",
    unionMode: "full",
    ellipse: "/assets/deck-builder/web/cards-514/mythic-ellipse.svg",
    element: "/assets/deck-builder/web/cards-514/mythic-element.svg",
    elementIcon: "/assets/deck-builder/web/cards-514/mythic-icon.png",
    tierSecondaryBg: "#3a65a9",
    badgeClass: "text-transparent bg-clip-text",
    badgeStyle: {
      backgroundImage:
        "linear-gradient(180deg, rgb(234, 67, 53) 0%, rgb(249, 171, 0) 45.192%, rgb(150, 169, 42) 75%, rgb(66, 133, 244) 100%)",
    },
  },
  rare: {
    art: "/assets/deck-builder/web/cards-514/rare-art.png",
    artClass: "h-[144%] w-[100.15%] left-[-0.07%] top-[-22%]",
    frame: "/assets/deck-builder/web/cards-514/rare-frame.svg",
    pattern: "/assets/deck-builder/web/cards-514/rare-pattern.svg",
    union: "/assets/deck-builder/web/cards-514/rare-union.svg",
    unionMode: "strip",
    ellipse: "/assets/deck-builder/web/cards-514/rare-ellipse.svg",
    element: "/assets/deck-builder/web/cards-514/rare-element.svg",
    elementIcon: "/assets/deck-builder/web/cards-514/rare-icon.png",
    tierBg: "#1fc16b",
    tierSecondaryBg: "#009f3d",
    badgeClass: "text-[#1fc16b]",
  },
  common: {
    art: "/assets/deck-builder/web/cards-514/common-art.png",
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    frame: "/assets/deck-builder/web/cards-514/common-frame.svg",
    pattern: "/assets/deck-builder/web/cards-514/common-pattern.svg",
    union: "/assets/deck-builder/web/cards-514/common-union.svg",
    unionMode: "strip",
    ellipse: "/assets/deck-builder/web/cards-514/common-ellipse.svg",
    element: "/assets/deck-builder/web/cards-514/common-element.svg",
    elementIcon: "/assets/deck-builder/web/cards-514/common-icon.png",
    tierBg: "#a2a2a2",
    tierSecondaryBg: "#616161",
    badgeClass: "text-[#a2a2a2]",
  },
  legendary: {
    art: "/assets/deck-builder/web/cards-514/legendary-art.png",
    artClass: "h-full w-[220.34%] left-[-79.67%] top-0",
    frame: "/assets/deck-builder/web/cards-514/legendary-frame.svg",
    pattern: "/assets/deck-builder/web/cards-514/legendary-pattern.svg",
    union: "/assets/deck-builder/web/cards-514/legendary-union.svg",
    unionMode: "strip",
    ellipse: "/assets/deck-builder/web/cards-514/legendary-ellipse.svg",
    element: "/assets/deck-builder/web/cards-514/legendary-element.svg",
    elementIcon: "/assets/deck-builder/web/cards-514/legendary-icon.png",
    tierBg: "#dfb400",
    tierSecondaryBg: "#c59f00",
    badgeClass: "text-[#dfb400]",
  },
};

function emptySlots() {
  return Array.from({ length: TOTAL_SLOTS }, () => null) as Array<CardItem | null>;
}

function BottomNavIcon({ kind }: { kind: "home" | "market" | "gacha" | "deck" | "tournament" }) {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 10.5L12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
      </svg>
    );
  }

  if (kind === "market") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 4h2l2.4 11.5h10.7L21 7H7" />
        <circle cx="10" cy="19" r="1.4" />
        <circle cx="17" cy="19" r="1.4" />
      </svg>
    );
  }

  if (kind === "gacha") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="8" width="16" height="10" rx="2.5" />
        <circle cx="9" cy="13" r="1.5" />
        <circle cx="15" cy="13" r="1.5" />
        <path d="M12 8V6" />
      </svg>
    );
  }

  if (kind === "deck") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="4" width="14" height="16" rx="1.5" />
        <path d="M8 8h8M8 12h8M8 16h8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 4h12v4c0 3.5-2.7 5.6-6 6-3.3-.4-6-2.5-6-6V4z" />
      <path d="M12 14v6" />
      <path d="M8.5 20h7" />
    </svg>
  );
}

function DeckDesktopBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[2527px] w-[1444px] -translate-x-1/2">
        <Image
          src="/assets/deck-builder/web/bg-ellipse-1.svg"
          alt=""
          width={243.966}
          height={243.491}
          className="absolute left-[-225.39px] top-[1346.35px] h-[243.491px] w-[243.966px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-2.svg"
          alt=""
          width={186.731}
          height={413.715}
          className="absolute left-[1305px] top-[242.95px] h-[413.715px] w-[186.731px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-2.svg"
          alt=""
          width={186.731}
          height={413.715}
          className="absolute left-[-93.37px] top-[1656.12px] h-[413.715px] w-[186.731px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-3.svg"
          alt=""
          width={186.731}
          height={226.953}
          className="absolute left-[-152.55px] top-[551.46px] h-[226.953px] w-[186.731px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-4.svg"
          alt=""
          width={1193.183}
          height={617.413}
          className="absolute left-[382.75px] top-[-424.66px] h-[617.413px] w-[1193.183px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-5.svg"
          alt=""
          width={351.282}
          height={380.909}
          className="absolute left-[-225.39px] top-[-113.05px] h-[380.909px] w-[351.282px]"
        />
        <Image
          src="/assets/deck-builder/web/bg-ellipse-6.svg"
          alt=""
          width={437.531}
          height={927.309}
          className="absolute left-[1437.49px] top-[883.25px] h-[927.309px] w-[437.531px]"
        />
      </div>
    </div>
  );
}

function DeckDesktopEmptyState({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <section className="relative z-10 mx-auto flex w-full max-w-[1257px] flex-col items-center gap-[60px] pt-[149px] pb-20">
      <div className="flex w-full flex-col items-center gap-[52px]">
        <div className="w-full text-center">
          <h1 className="text-[68px] leading-[102px] font-bold text-white">Deck Builder</h1>
          <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
            Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus varius sagittis mi diam eget
            penatibus. Ut praesent ut auctor turpis cursus id.
          </p>
        </div>
        <Image
          src="/assets/deck-builder/web/hero-wing-separator-401.svg"
          alt=""
          width={1257}
          height={74.86}
          className="h-[74.86px] w-[1257px] object-fill mix-blend-plus-lighter"
        />
      </div>

      <article className="flex h-[491px] w-[1113px] flex-col items-center gap-[52px] rounded-[16px] border border-[#8085bd] bg-[linear-gradient(3.395deg,#120c35_11.336%,#143c87_57.519%,#13245e_112.14%)] px-[61px] py-[32px]">
        <div className="flex h-[150.86px] w-[150.86px] items-center justify-center rounded-full bg-[linear-gradient(178.123deg,rgba(20,60,135,0)_32.053%,#020c7b_95.528%)]">
          <Image src="/assets/deck-builder/web/empty-center-icon.svg" alt="" width={83.291} height={83.291} />
        </div>

        <div className="text-center">
          <h3 className="text-[32px] leading-[48px] font-bold text-white">No decks yet</h3>
          <p className="mt-[4px] text-[18px] leading-[27px] font-normal text-[#e8e8e8]">
            Create your first deck to get started!
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateDeck}
          className="relative h-[70px] w-[352px] cursor-pointer rounded-[16px] bg-[#000431]"
        >
          <div className="absolute inset-0 shadow-[0px_5.185px_12.962px_rgba(0,0,0,0.25)]">
            <Image src="/assets/deck-builder/web/empty-create-layer1.svg" alt="" fill className="object-fill" />
            <Image src="/assets/deck-builder/web/empty-create-layer2.svg" alt="" fill className="object-fill" />
            <div className="absolute inset-[7.8%_1.46%]">
              <Image src="/assets/deck-builder/web/empty-create-layer3.svg" alt="" fill className="object-fill" />
            </div>
          </div>
          <span className="absolute inset-0 flex items-center justify-center gap-[8px]">
            <Image src="/assets/deck-builder/web/empty-create-icon.svg" alt="" width={24.701} height={24.701} />
            <span className="text-[22px] leading-[33px] font-bold text-white">Create Deck</span>
          </span>
        </button>
      </article>
    </section>
  );
}

function FigmaTopCard() {
  return (
    <section className="relative mx-auto h-[113px] w-full max-w-[375px] overflow-hidden rounded-[9.668px] border-t-2 border-r-2 border-l-2 border-[#ABC3FF] bg-[linear-gradient(0deg,#010B7B_29.2%,#0060DE_123.01%)]">
      <div className="absolute left-[14px] top-[14px] flex h-[34px] w-[34px] items-center justify-center rounded-[8.459px] bg-[rgba(206,206,206,0.13)]">
        <Image src="/assets/deck-builder/top-deck-icon.svg" alt="" width={17} height={17} />
      </div>

      <Image
        src="/assets/deck-builder/top-decor-group23.svg"
        alt=""
        width={105}
        height={93}
        className="pointer-events-none absolute left-[267px] top-[-20px] opacity-95"
      />
      <div className="pointer-events-none absolute left-[236px] top-[-13px] h-[90px] w-[40px] rotate-[76.74deg]">
        <Image src="/assets/deck-builder/top-union-1.svg" alt="" fill className="object-contain" />
      </div>
      <div className="pointer-events-none absolute left-[294px] top-[-5px] h-[68px] w-[84px] rotate-[144.13deg]">
        <Image src="/assets/deck-builder/top-union-2.svg" alt="" fill className="object-contain" />
      </div>
      <div className="pointer-events-none absolute left-[218px] top-[-18px] h-[41px] w-[31px] rotate-[56.79deg]">
        <Image src="/assets/deck-builder/top-union-3.svg" alt="" fill className="object-contain" />
      </div>

      <h2 className="absolute left-[14px] top-[52px] text-[18px] leading-[27px] font-bold text-white">
        Deck Builder
      </h2>
      <p className="absolute left-[14px] top-[82px] max-w-[346px] text-[12px] leading-[12.1px] font-light text-[#e8e8e8]">
        Open exclusive packs to unlock legendary cards and skins
      </p>
    </section>
  );
}

function FigmaBottomCard({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <section className="mx-auto mt-6 flex w-full max-w-[375px] flex-col items-center gap-[19px] rounded-[16px] border border-[#8085bd] bg-[linear-gradient(6.08deg,#120c35_11.336%,#143c87_57.519%,#13245e_112.14%)] px-[61px] py-[32px]">
      <div className="flex h-[95.996px] w-[95.996px] items-center justify-center rounded-full bg-[linear-gradient(178.12deg,rgba(20,60,135,0)_32.053%,#020c7b_95.528%)]">
        <Image src="/assets/deck-builder/bottom-center-icon.svg" alt="" width={53} height={53} />
      </div>

      <div className="text-center">
        <h3 className="text-[18px] leading-[28px] font-bold text-white">No decks yet</h3>
        <p className="mt-2 text-[14px] leading-[20px] font-normal text-[#e8e8e8]">
          Create your first deck to get started!
        </p>
      </div>

      <button
        type="button"
        onClick={onCreateDeck}
        className="relative h-[46.981px] w-[230.201px] cursor-pointer shadow-[0_5.185px_12.962px_rgba(0,0,0,0.25)]"
      >
        <Image src="/assets/deck-builder/create-btn-layer1.svg" alt="" fill className="object-fill" />
        <Image src="/assets/deck-builder/create-btn-layer2.svg" alt="" fill className="object-fill" />
        <div className="absolute inset-[7.8%_1.46%]">
          <Image src="/assets/deck-builder/create-btn-layer3.svg" alt="" fill className="object-fill" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-[5px]">
          <Image src="/assets/deck-builder/create-icon.svg" alt="" width={16.905} height={16.905} />
          <span className="text-[14.102px] leading-[21.937px] font-bold text-white">Create Deck</span>
        </div>
      </button>
    </section>
  );
}

function FigmaWideCreateButton({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <button type="button" onClick={onCreateDeck} className="relative h-[47.246px] w-full cursor-pointer">
      <Image
        src="/assets/deck-builder/v2/create-deck-union.svg"
        alt=""
        width={371.63}
        height={46.981}
        className="pointer-events-none absolute left-[3.37px] top-[0.26px] h-[46.98px] w-[371.63px] max-w-none"
      />
      <Image
        src="/assets/deck-builder/v2/create-deck-frame.svg"
        alt=""
        width={375}
        height={47.111}
        className="pointer-events-none absolute left-0 top-0 h-[47.111px] w-[375px] max-w-none"
      />
      <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
        <Image src="/assets/deck-builder/v2/create-deck-icon.svg" alt="" width={16.905} height={16.905} />
        <span className="text-[14.102px] leading-[21.937px] font-bold text-white">Create Deck</span>
      </span>
    </button>
  );
}

function DeckDesktopWideCreateButton({ onCreateDeck }: { onCreateDeck: () => void }) {
  return (
    <button type="button" onClick={onCreateDeck} className="relative h-[54.027px] w-[1257px] cursor-pointer">
      <Image
        src="/assets/deck-builder/web/create-deck-531-union.svg"
        alt=""
        width={1256.998}
        height={53.731}
        className="pointer-events-none absolute left-0 top-[0.3px] h-[53.731px] w-[1256.998px] max-w-none"
      />
      <Image
        src="/assets/deck-builder/web/create-deck-531-frame.svg"
        alt=""
        width={1257}
        height={54.027}
        className="pointer-events-none absolute left-0 top-0 h-[54.027px] w-[1257px] max-w-none"
      />
      <span className="absolute left-1/2 top-1/2 flex h-[26px] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[5px] pt-[7px]">
        <Image src="/assets/deck-builder/web/create-deck-531-icon.svg" alt="" width={16.905} height={16.905} />
        <span className="whitespace-nowrap text-[18px] leading-[27px] font-bold text-white">Create Deck</span>
      </span>
    </button>
  );
}

function FigmaDeckSeparator() {
  return (
    <div className="relative h-[26px] w-[377px] self-center">
      <div className="absolute inset-[0_47.68%_0_45.95%]">
        <Image src="/assets/deck-builder/v2/separator-4432-star.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[16.62%_48.71%_16.62%_47.04%]">
        <Image src="/assets/deck-builder/v2/separator-4432-glow.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[44.28%_57.18%_55.72%_0]">
        <div className="absolute inset-[-1.5px_0]">
          <Image src="/assets/deck-builder/v2/separator-4432-line-left.svg" alt="" fill className="object-fill" />
        </div>
      </div>
      <div className="absolute inset-[44.28%_0_55.72%_54.73%]">
        <div className="absolute inset-[-1.5px_0]">
          <Image src="/assets/deck-builder/v2/separator-4432-line-right.svg" alt="" fill className="object-fill" />
        </div>
      </div>
    </div>
  );
}

function DeckCopyIcon({ className = "h-[15.995px] w-[15.995px]" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-[33.33%_8.33%_8.33%_33.33%]">
        <Image src="/assets/deck-builder/v2/deck-copy-1.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[8.33%_33.33%_33.33%_8.33%]">
        <Image src="/assets/deck-builder/v2/deck-copy-2.svg" alt="" fill className="object-fill" />
      </div>
    </div>
  );
}

function DeckDeleteIcon({ className = "h-[15.995px] w-[15.995px]" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-[25%_12.5%_75%_12.5%]">
        <Image src="/assets/deck-builder/v2/deck-delete-1.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[25%_20.83%_8.33%_20.83%]">
        <Image src="/assets/deck-builder/v2/deck-delete-2.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[8.33%_33.33%_75%_33.33%]">
        <Image src="/assets/deck-builder/v2/deck-delete-3.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[45.83%_58.33%_29.17%_41.67%]">
        <Image src="/assets/deck-builder/v2/deck-delete-4.svg" alt="" fill className="object-fill" />
      </div>
      <div className="absolute inset-[45.83%_41.67%_29.17%_58.33%]">
        <Image src="/assets/deck-builder/v2/deck-delete-4.svg" alt="" fill className="object-fill" />
      </div>
    </div>
  );
}

function FigmaSavedDeckCard({
  deck,
  onEdit,
  onDelete,
}: {
  deck: SavedDeck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slots = [...deck.cards];
  while (slots.length < TOTAL_SLOTS) {
    slots.push(null);
  }
  const visibleSlots = slots.slice(0, TOTAL_SLOTS);
  const filledSlots = visibleSlots.filter((card): card is CardItem => card !== null).length;
  const savedDeckCompletion = Math.round((filledSlots / TOTAL_SLOTS) * 100);

  return (
    <article className="rounded-[16px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] p-[1.735px]">
      <div className="flex flex-col items-center gap-[11.983px] px-[15.995px] pt-[15.995px] pb-[11.983px]">
        <div className="flex h-[47.957px] w-full items-start justify-between">
          <div className="h-[47.957px] w-[150.08px]">
            <h3 className="text-[18px] leading-[28px] font-bold text-white">{deck.name}</h3>
            <p className="mt-[6px] whitespace-nowrap text-[14px] leading-[20px] font-normal text-[#d2d2d2]">
              {filledSlots}/{TOTAL_SLOTS} cards &bull; Completion rate {savedDeckCompletion}%
            </p>
          </div>

          <div className="flex h-[31.99px] w-[71.977px] items-start gap-[7.997px]">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-[31.99px] w-[31.99px] items-center justify-center rounded-[10px] bg-[#010b7b]"
              aria-label={`Copy ${deck.name}`}
            >
              <DeckCopyIcon />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-[31.99px] w-[31.99px] items-center justify-center rounded-[10px] bg-[#d00416]"
              aria-label={`Delete ${deck.name}`}
            >
              <DeckDeleteIcon />
            </button>
          </div>
        </div>

        <div className="h-[63px] w-[352px] max-w-full rounded-[10px]">
          <div className="grid h-full grid-cols-8 gap-x-[8px] px-[6.81px] pt-[7.97px]">
            {visibleSlots.map((card, index) => (
              <div
                key={`${deck.id}-${card?.id ?? "empty"}-${index}`}
                className="relative h-[47.063px] w-[35.297px] overflow-hidden rounded-[4px] border-[0.5px] border-[#b2b2b2] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)]"
              >
                {card && <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="relative h-[47.957px] w-[348.459px] max-w-full"
        >
          <Image
            src="/assets/deck-builder/v2/edit-deck-union.svg"
            alt=""
            width={374.383}
            height={73.881}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[73.881px] w-[374.383px] max-w-none -translate-x-1/2 -translate-y-1/2"
          />
          <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
            <Image src="/assets/deck-builder/v2/wallet-icon.svg" alt="" width={16.905} height={16.905} />
            <span className="text-[14.102px] leading-[21.937px] font-bold text-white">Edit Deck</span>
          </span>
        </button>
      </div>
    </article>
  );
}

function FigmaCardTile({
  card,
  onClick,
}: {
  card: CardItem;
  onClick?: () => void;
}) {
  const meta = CARD_META[card.variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative h-[118px] w-full overflow-hidden rounded-[12px] shadow-[0px_0.931px_0.931px_0px_rgba(0,0,0,0.25)] ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="absolute left-[0.25px] top-[1.4px] h-[102.406px] w-[82.856px] overflow-hidden">
        <Image
          src={card.art}
          alt={card.name}
          width={183}
          height={183}
          className={`pointer-events-none absolute max-w-none ${meta.artClass}`}
        />
      </div>
      <Image src={card.frame} alt="" fill className="pointer-events-none object-fill" />

      <div className="absolute left-[1.63px] top-[1.4px] h-[11.986px] w-[11.986px]">
        <Image src={meta.ellipse} alt="" fill className="pointer-events-none object-fill" />
      </div>
      <p
        className={`absolute left-[7.62px] top-[7.39px] -translate-x-1/2 -translate-y-1/2 text-center text-[8.84px] leading-[13.266px] font-bold ${meta.badgeClass}`}
        style={meta.badgeStyle}
      >
        1
      </p>

      <div className="absolute left-[76.34px] top-[1.4px] h-[5.469px] w-[5.469px]">
        <Image src={meta.element} alt="" fill className="pointer-events-none object-fill" />
        <Image src={meta.elementIcon} alt="" fill className="pointer-events-none object-fill" />
      </div>
    </button>
  );
}

function EmptySlotTile() {
  return (
    <div className="bg-gradient-to-b border border-[#afafaf] border-solid p-[1.715px] rounded-[5.932px] from-[#2d3548] to-[#1a1d2e]">
      <div className="flex h-[115.67px] flex-col items-center justify-center gap-[7.907px]">
        <Image src="/assets/deck-builder/v2/empty-plus.svg" alt="" width={31.626} height={31.626} />
        <span className="text-[11.864px] leading-[15.818px] font-bold text-[#d2d2d2]">Empty Slot</span>
      </div>
    </div>
  );
}

function DeckDesktopEmptySlotCard({ withLabel = true }: { withLabel?: boolean }) {
  return (
    <div className="h-[237.678px] w-[167.18px] rounded-[5.932px] border-[2.014px] border-[#afafaf] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)] p-[3.455px]">
      {withLabel ? (
        <div className="flex h-full flex-col items-center justify-center gap-[15.925px]">
          <Image src="/assets/deck-builder/v2/empty-plus.svg" alt="" width={63.702} height={63.702} />
          <span className="text-[23.9px] leading-[31.861px] font-bold text-[#d2d2d2]">Empty Slot</span>
        </div>
      ) : (
        <div className="h-full" />
      )}
    </div>
  );
}

function DeckDesktopDeckSlotCard({
  card,
  onRemove,
}: {
  card: CardItem | null;
  onRemove?: () => void;
}) {
  if (!card) {
    return <DeckDesktopEmptySlotCard withLabel />;
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      className={`relative h-[237.678px] w-[167.18px] overflow-hidden rounded-[5.932px] border-[2.014px] border-[#afafaf] bg-gradient-to-br ${card.gradient}`}
    >
      <Image src={card.art} alt={card.name} width={167} height={238} className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-x-[8px] bottom-[8px] rounded-[8px] bg-black/45 px-2 py-1 text-center">
        <p className="text-[11px] font-bold text-white">{card.name}</p>
      </div>
    </button>
  );
}

function DeckDesktopAvailableCard({
  card,
  onAdd,
}: {
  card: CardItem | null;
  onAdd?: () => void;
}) {
  if (!card) {
    return (
      <div className="h-[201.999px] w-[142.084px] rounded-[12px] border border-[#afafaf] bg-[linear-gradient(180deg,#2d3548_0%,#1a1d2e_100%)] p-[1.715px]">
        <div className="h-[115.67px]" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={`group relative h-[201.999px] w-[142.084px] overflow-hidden rounded-[12px] bg-gradient-to-br ${card.gradient} shadow-[0px_0.931px_0.931px_rgba(0,0,0,0.25)]`}
    >
      <Image src={card.art} alt={card.name} width={142} height={202} className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-x-[6px] bottom-[6px] rounded-[8px] bg-black/50 px-2 py-1 text-center">
        <p className="text-[9px] font-bold text-white">{card.name}</p>
      </div>
    </button>
  );
}

function DeckDesktopSavedCardTile({ card }: { card: CardItem }) {
  const meta = DESKTOP_SAVED_CARD_META[card.variant];

  return (
    <div className="relative h-[204.193px] w-[144.989px] overflow-hidden rounded-[12px]">
      <div className="absolute left-0 top-0 h-[118px] w-[83.787px] origin-top-left [transform:scale(1.73045)]">
        <div className="relative size-full">
          <div className="absolute inset-0 rounded-[12px] shadow-[0px_0.931px_0.931px_0px_rgba(0,0,0,0.25)]" />
          <div className="absolute left-[0.25px] top-[1.4px] h-[102.406px] w-[82.856px] overflow-hidden">
            <Image
              src={meta.art}
              alt={card.name}
              width={183}
              height={183}
              className={`pointer-events-none absolute max-w-none ${meta.artClass}`}
            />
          </div>

          <div className="absolute left-[4.42px] top-[61.21px] flex h-[31.653px] w-[74.943px] flex-wrap content-start items-start gap-x-[1.396px] gap-y-[0.465px] rounded-[4px] bg-[rgba(183,183,183,0.5)] p-[3.724px]">
            <div className="relative h-[4.422px] w-[11.172px] rounded-[2px] bg-[#30d158]">
              <div className="absolute left-1/2 top-1/2 flex h-[3.78px] w-[5.819px] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[3.26px] leading-[4.888px] font-medium text-white">
                Tag
              </div>
            </div>
            <p className="text-[3.26px] leading-[4.888px] font-semibold text-[#333]">Lorem ipsum dolor sit</p>
            <p className="w-[68.271px] text-[2.79px] leading-[3.724px] font-semibold italic text-[#333]">
              Lorem ipsum dolor sit amet consectetur. Suspendisse faucibus mi arcu condimentum. Lectus tristique sit
              diam faucibus consectetur.
            </p>
          </div>

          <Image src={meta.frame} alt="" fill className="pointer-events-none object-fill" />
          <p className="absolute left-[65.46px] top-[4.13px] -translate-x-1/2 -translate-y-1/2 text-[4.27px] leading-[6.4px] font-bold text-[#e8e8e8]">
            700000
          </p>

          <div className="absolute left-1/2 top-[94.16px] h-[22.672px] w-[81.809px] -translate-x-1/2 overflow-hidden rounded-[12px]">
            {meta.unionMode === "full" ? (
              <Image src={meta.union} alt="" fill className="pointer-events-none object-fill" />
            ) : (
              <>
                <div
                  className="absolute left-0 top-[4.63px] h-[18.037px] w-full rounded-b-[2.793px]"
                  style={{ backgroundColor: meta.tierBg }}
                />
                <div className="absolute left-[21.42px] top-[0.9px] h-[3.957px] w-[42.945px]">
                  <Image src={meta.union} alt="" fill className="pointer-events-none object-fill" />
                </div>
              </>
            )}
            <div className="absolute left-[-0.06px] top-[4.63px] h-[27.259px] w-[81.809px]">
              <Image src={meta.pattern} alt="" fill className="pointer-events-none object-fill" />
            </div>
            <p className="absolute left-1/2 top-[9.39px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[6.05px] leading-[9.077px] font-bold text-white">
              Lorem Ipsum
            </p>
            <div
              className="absolute left-1/2 top-[14.86px] h-[3.724px] w-[51.266px] -translate-x-1/2 rounded-[999px]"
              style={{ backgroundColor: meta.tierSecondaryBg }}
            />
            <p className="absolute left-1/2 top-[2.96px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[2.72px] leading-[2.172px] tracking-[2.0865px] text-[#e8e8e8]">
              Lorem Ipsum
            </p>
            <p className="absolute left-1/2 top-[16.61px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[2.33px] leading-[3.491px] text-[#d2d2d2]">
              Lorem Ipsum dolor amet lorem ipsum dolor
            </p>
          </div>

          <div className="absolute left-[1.63px] top-[1.4px] h-[11.986px] w-[11.986px]">
            <Image src={meta.ellipse} alt="" fill className="pointer-events-none object-fill" />
          </div>
          <p
            className={`absolute left-[7.62px] top-[7.39px] -translate-x-1/2 -translate-y-1/2 text-[8.84px] leading-[13.266px] font-bold ${meta.badgeClass}`}
            style={meta.badgeStyle}
          >
            1
          </p>

          <div className="absolute left-[76.34px] top-[1.4px] h-[5.469px] w-[5.469px]">
            <Image src={meta.element} alt="" fill className="pointer-events-none object-fill" />
            <Image src={meta.elementIcon} alt="" fill className="pointer-events-none object-fill" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckDesktopSavedDeckCard({
  deck,
  onEdit,
  onDelete,
}: {
  deck: SavedDeck;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const slots = [...deck.cards];
  while (slots.length < TOTAL_SLOTS) {
    slots.push(null);
  }
  const visibleSlots = slots.slice(0, TOTAL_SLOTS);
  const filledSlots = visibleSlots.filter((card): card is CardItem => card !== null).length;
  const savedDeckCompletion = Math.round((filledSlots / TOTAL_SLOTS) * 100);
  const visualCards = visibleSlots.map((card, index) => card ?? PREVIEW_DECK_CARDS[index % PREVIEW_DECK_CARDS.length]);

  return (
    <article className="w-full rounded-[16px] border border-[#3a3e4f] bg-[linear-gradient(180deg,#2a2e3f_0%,#1e2230_100%)] p-[24px]">
      <div className="flex h-[69px] items-start justify-between">
        <div className="h-[44px] w-[166px]">
          <h3 className="text-[32px] leading-[48px] font-bold text-white">{deck.name}</h3>
          <p className="whitespace-nowrap text-[22px] leading-[33px] font-bold text-[#9ca3af]">
            {filledSlots}/{TOTAL_SLOTS} cards &bull; Completion rate {savedDeckCompletion}%
          </p>
        </div>

        <div className="flex h-[53px] w-[119.25px] items-start gap-[13.25px]">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-[53px] w-[53px] items-center justify-center rounded-[16.563px] bg-[#1e3a8a]"
            aria-label={`Copy ${deck.name}`}
          >
            <DeckCopyIcon className="h-[26.5px] w-[26.5px]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-[53px] w-[53px] items-center justify-center rounded-[16.563px] bg-[#7f1d1d]"
            aria-label={`Delete ${deck.name}`}
          >
            <DeckDeleteIcon className="h-[26.5px] w-[26.5px]" />
          </button>
        </div>
      </div>

      <div className="mt-[32px] grid grid-cols-8 gap-x-[8.086px]">
        {visualCards.map((card, index) => (
          <DeckDesktopSavedCardTile key={`desktop-saved-card-${deck.id}-${index}-${card.id}`} card={card} />
        ))}
      </div>

      <button type="button" onClick={onEdit} className="relative mt-[32px] h-[48px] w-full">
        <Image
          src="/assets/deck-builder/web/edit-deck-union-514.svg"
          alt=""
          fill
          className="pointer-events-none object-fill"
        />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] leading-[27px] font-bold text-white">
          Edit Deck
        </span>
      </button>
    </article>
  );
}

export default function DeckBuilder() {
  const [isEditing, setIsEditing] = useState(false);
  const [deckName, setDeckName] = useState("My Deck");
  const [deckSlots, setDeckSlots] = useState<Array<CardItem | null>>(emptySlots);
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [nextDeckId, setNextDeckId] = useState(1);
  const [editingDeckId, setEditingDeckId] = useState<number | null>(null);

  const selectedCards = useMemo(
    () => deckSlots.filter((slot): slot is CardItem => slot !== null),
    [deckSlots]
  );

  const completionRate = Math.round((selectedCards.length / TOTAL_SLOTS) * 100);
  const showFigmaEmptyState = !isEditing && savedDecks.length === 0;
  const showDesktopSavedState = !isEditing && savedDecks.length > 0;
  const deckVisualSlots = deckSlots.map((slot, index) => slot ?? (index < 4 ? PREVIEW_DECK_CARDS[index] : null));
  const availableCardGrid: Array<CardItem | null> = [
    AVAILABLE_CARDS[3],
    AVAILABLE_CARDS[3],
    AVAILABLE_CARDS[1],
    AVAILABLE_CARDS[2],
    AVAILABLE_CARDS[2],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[1],
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  const desktopAvailableCardGrid: Array<CardItem | null> = [
    AVAILABLE_CARDS[3],
    AVAILABLE_CARDS[3],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[0],
    AVAILABLE_CARDS[2],
    AVAILABLE_CARDS[2],
    AVAILABLE_CARDS[2],
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];
  const hideMobileLayoutOnDesktop = showFigmaEmptyState || isEditing || showDesktopSavedState;

  const startNewDeck = () => {
    setDeckName(`Deck ${savedDecks.length + 1}`);
    setDeckSlots(emptySlots());
    setEditingDeckId(null);
    setIsEditing(true);
  };

  const addCardToDeck = (card: CardItem) => {
    setDeckSlots((prev) => {
      const nextEmptyIndex = prev.findIndex((slot) => slot === null);
      if (nextEmptyIndex < 0) {
        return prev;
      }

      const next = [...prev];
      next[nextEmptyIndex] = card;
      return next;
    });
  };

  const removeCardFromDeck = (slotIndex: number) => {
    setDeckSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const clearCurrentDeck = () => {
    setDeckSlots(emptySlots());
  };

  const saveDeck = () => {
    const trimmedName = deckName.trim();
    const resolvedName = trimmedName.length > 0 ? trimmedName : `Deck ${nextDeckId}`;

    if (editingDeckId !== null) {
      setSavedDecks((prev) =>
        prev.map((deck) =>
          deck.id === editingDeckId ? { ...deck, name: resolvedName, cards: [...deckSlots] } : deck
        )
      );
    } else {
      setSavedDecks((prev) => [...prev, { id: nextDeckId, name: resolvedName, cards: [...deckSlots] }]);
      setNextDeckId((prev) => prev + 1);
    }

    setIsEditing(false);
    setEditingDeckId(null);
    setDeckSlots(emptySlots());
  };

  const editDeck = (deck: SavedDeck) => {
    setDeckName(deck.name);
    setDeckSlots([...deck.cards]);
    setEditingDeckId(deck.id);
    setIsEditing(true);
  };

  const deleteDeck = (deckId: number) => {
    setSavedDecks((prev) => prev.filter((deck) => deck.id !== deckId));
  };

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[#171717] pb-28 pt-24 text-white md:pb-0 ${
        hideMobileLayoutOnDesktop ? "md:pt-0" : "md:pt-24"
      }`}
    >
      {showFigmaEmptyState && (
        <section className="relative hidden min-h-screen md:block">
          <DeckDesktopBackground />
          <DeckDesktopEmptyState onCreateDeck={startNewDeck} />
        </section>
      )}

      {isEditing && (
        <section className="relative hidden min-h-screen md:block">
          <DeckDesktopBackground />

          <div className="relative z-10 mx-auto w-full max-w-[1257px] pb-20 pt-[132.667px]">
            <div className="flex w-full flex-col items-center">
              <div className="w-full text-center">
                <h1 className="text-[68px] leading-[102px] font-bold text-white">Deck Builder</h1>
                <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
                  Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus varius sagittis mi diam eget
                  penatibus. Ut praesent ut auctor turpis cursus id.
                </p>
              </div>
              <Image
                src="/assets/deck-builder/web/hero-wing-separator-401.svg"
                alt=""
                width={1257}
                height={74.86}
                className="mt-[52px] h-[74.86px] w-[1257px] mix-blend-plus-lighter"
              />
            </div>

            <section className="mt-[52.86px]">
              <div className="h-[84px] rounded-[12px] bg-[#1a1d2e] px-[15.995px] pt-[15.995px]">
                <div className="flex h-[55px] items-center justify-between rounded-[10px] border-2 border-[#8c8c8c] bg-[#1a1d2e] px-[24px] py-[8px]">
                  <input
                    id="desktopDeckName"
                    value={deckName}
                    onChange={(event) => setDeckName(event.target.value)}
                    className="w-full bg-transparent text-[22px] leading-[33px] font-bold text-[#e8e8e8] outline-none"
                    placeholder="My Deck"
                  />
                  <button type="button" className="relative h-[20px] w-[20px]" aria-label="Edit deck name">
                    <Image src="/assets/deck-builder/web/input-edit-icon-web.svg" alt="" fill className="object-fill" />
                  </button>
                </div>
              </div>

              <div className="mt-[24px] flex gap-[39px]">
                <article className="w-[375px] rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[12px] py-[16px]">
                  <div className="mb-[24px] flex h-[35.975px] items-center justify-between">
                    <h2 className="text-[22px] leading-[33px] font-bold text-white">Your Deck</h2>
                    <button
                      type="button"
                      onClick={clearCurrentDeck}
                      className="relative h-[35.975px] w-[77.317px] rounded-[10px] bg-[#d00416]"
                    >
                      <Image
                        src="/assets/deck-builder/v2/clear-icon.svg"
                        alt=""
                        width={15.995}
                        height={15.995}
                        className="absolute left-[11.98px] top-[9.98px]"
                      />
                      <span className="absolute left-[49.46px] top-[7px] -translate-x-1/2 text-[14px] leading-[20px] font-bold text-white">
                        Clear
                      </span>
                    </button>
                  </div>

                  <div className="mb-[24px] rounded-[10px] bg-[#1a1d2e] px-[11.983px] pt-[11.983px] pb-[11.983px]">
                    <div className="grid grid-cols-3 gap-x-[12px] text-center">
                      <div>
                        <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">Total Cards</p>
                        <p className="text-[18px] leading-[28px] font-bold text-white">{selectedCards.length}</p>
                      </div>
                      <div>
                        <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">[Deck Stats]</p>
                        <p className="text-[18px] leading-[28px] font-bold text-white">{selectedCards.length}</p>
                      </div>
                      <div>
                        <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">Completion</p>
                        <p className="text-[18px] leading-[28px] font-bold text-white">{completionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-[12.085px] gap-y-[24.171px]">
                    {deckSlots.map((slot, index) => (
                      <DeckDesktopDeckSlotCard
                        key={`desktop-slot-${index}-${slot?.id ?? "empty"}`}
                        card={slot}
                        onRemove={slot ? () => removeCardFromDeck(index) : undefined}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={saveDeck}
                    className="relative mt-[24px] h-[47.957px] w-[348.459px]"
                  >
                    <Image src="/assets/deck-builder/web/save-deck-union-web.svg" alt="" fill className="object-fill" />
                    <span className="absolute inset-0 flex items-center justify-center text-[14.102px] leading-[21.937px] font-bold text-white">
                      Save Deck
                    </span>
                  </button>
                </article>

                <article className="w-[843px] rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[24px] pt-[24px] pb-[16px]">
                  <h2 className="text-[22px] leading-[33px] font-bold text-white">Available Cards</h2>
                  <div className="mt-[24px] grid grid-cols-5 gap-x-[20.542px] gap-y-[20.542px]">
                    {desktopAvailableCardGrid.map((card, index) => (
                      <DeckDesktopAvailableCard
                        key={`desktop-available-${index}-${card?.id ?? "empty"}`}
                        card={card}
                        onAdd={card ? () => addCardToDeck(card) : undefined}
                      />
                    ))}
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      )}

      {showDesktopSavedState && (
        <section className="relative hidden min-h-screen md:block">
          <DeckDesktopBackground />

          <div className="relative z-10 mx-auto w-full max-w-[1257px] pb-20 pt-[132.667px]">
            <div className="flex w-full flex-col items-center">
              <div className="w-full text-center">
                <h1 className="text-[68px] leading-[102px] font-bold text-white">Deck Builder</h1>
                <p className="mx-auto mt-[8px] w-[719px] text-[18px] leading-[27px] font-bold text-white/80">
                  Lorem ipsum dolor sit amet consectetur. Vitae vitae mauris penatibus varius sagittis mi diam eget
                  penatibus. Ut praesent ut auctor turpis cursus id.
                </p>
              </div>
              <Image
                src="/assets/deck-builder/web/hero-wing-separator-401.svg"
                alt=""
                width={1257}
                height={74.86}
                className="mt-[52px] h-[74.86px] w-[1257px] mix-blend-plus-lighter"
              />
            </div>

            <section className="mt-[60px] space-y-[20px]">
              <DeckDesktopWideCreateButton onCreateDeck={startNewDeck} />
              {savedDecks.map((deck) => (
                <DeckDesktopSavedDeckCard
                  key={`desktop-saved-deck-${deck.id}`}
                  deck={deck}
                  onEdit={() => editDeck(deck)}
                  onDelete={() => deleteDeck(deck.id)}
                />
              ))}
            </section>
          </div>
        </section>
      )}

      <div className={`pointer-events-none absolute inset-0 ${hideMobileLayoutOnDesktop ? "md:hidden" : ""}`}>
        <div className="absolute -left-28 top-0 h-72 w-72 rounded-full bg-[#244ba9]/30 blur-[90px]" />
        <div className="absolute -right-28 top-44 h-80 w-80 rounded-full bg-[#1f4fe0]/35 blur-[110px]" />
        <div className="absolute right-0 bottom-20 h-80 w-72 rounded-full bg-[#2e4dc5]/25 blur-[95px]" />
      </div>

      <div className={`relative z-10 mx-auto w-full max-w-[980px] px-4 sm:px-6 ${hideMobileLayoutOnDesktop ? "md:hidden" : ""}`}>
        <FigmaTopCard />

        {showFigmaEmptyState && <FigmaBottomCard onCreateDeck={startNewDeck} />}

        {isEditing && (
          <section className="mx-auto mt-6 w-full max-w-[375px] space-y-4">
            <div className="rounded-[12px] bg-[#1a1d2e] px-[15.995px] pt-[15.995px] pb-[15.995px]">
              <label htmlFor="deckName" className="sr-only">
                Deck Name
              </label>
              <div className="relative flex h-[43px] items-center justify-center overflow-clip rounded-[10px] border-[0.5px] border-[#d2d2d2] bg-[#1a1d2e] px-[24px] py-[8px]">
                <input
                  id="deckName"
                  value={deckName}
                  onChange={(event) => setDeckName(event.target.value)}
                  className="h-[27px] w-full bg-transparent px-[24px] text-center text-[18px] leading-[27px] font-normal text-[#e8e8e8] outline-none"
                  placeholder="My Deck"
                />
                <button
                  type="button"
                  className="absolute right-[24px] h-[20px] w-[20px]"
                  aria-label="Edit deck name"
                >
                  <Image src="/assets/deck-builder/v2/edit-icon.svg" alt="" fill className="object-fill" />
                </button>
              </div>
            </div>

            <article className="rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] px-[12px] py-[16px]">
              <div className="mb-[16px] flex h-[35.975px] items-center justify-between">
                <h2 className="text-[18px] leading-[28px] font-bold text-white">Your Deck</h2>
                <button
                  type="button"
                  onClick={clearCurrentDeck}
                  className="relative h-[35.975px] w-[77.317px] rounded-[10px] bg-[#d00416]"
                >
                  <Image
                    src="/assets/deck-builder/v2/clear-icon.svg"
                    alt=""
                    width={15.995}
                    height={15.995}
                    className="absolute left-[11.98px] top-[9.98px]"
                  />
                  <span className="absolute left-[49.46px] top-[7px] -translate-x-1/2 text-[14px] leading-[20px] font-bold text-white">
                    Clear
                  </span>
                </button>
              </div>

              <div className="mb-[16px] rounded-[10px] bg-[#1a1d2e] px-[11.983px] pt-[11.983px] pb-[11.983px]">
                <div className="grid grid-cols-3 gap-x-[12px]">
                  <div className="text-center">
                    <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">Total Cards</p>
                    <p className="text-[18px] leading-[28px] font-bold text-white">{selectedCards.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">[Deck Stats]</p>
                    <p className="text-[18px] leading-[28px] font-bold text-white">{selectedCards.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] leading-[16px] font-bold text-[#d2d2d2]">Completion</p>
                    <p className="text-[18px] leading-[28px] font-bold text-white">{completionRate}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-[6px]">
                {deckVisualSlots.map((visualCard, index) => {
                  const actualCard = deckSlots[index];
                  if (!visualCard) {
                    return <EmptySlotTile key={`slot-${index}`} />;
                  }

                  return (
                    <FigmaCardTile
                      key={`slot-${index}-${visualCard.id}`}
                      card={visualCard}
                      onClick={
                        actualCard
                          ? () => {
                              removeCardFromDeck(index);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={saveDeck}
                className="relative mt-[16px] h-[47.957px] w-[348.459px] self-center shadow-[0px_5.184782px_12.961955px_0px_rgba(0,0,0,0.25)]"
              >
                <div className="absolute inset-0">
                  <Image src="/assets/deck-builder/v2/save-union-tight.svg" alt="" fill className="object-fill" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center gap-[5px]">
                  <Image src="/assets/deck-builder/v2/save-icon.svg" alt="" width={16.905} height={16.905} />
                  <span className="text-[14.102px] leading-[21.937px] font-bold text-white">Save Deck</span>
                </span>
              </button>
            </article>

            <article className="rounded-[12px] border border-[#8085bd] bg-[linear-gradient(180deg,#2d3548_0%,#030a30_100%)] p-[12px]">
              <h2 className="mb-[12px] h-[35.975px] text-[18px] leading-[28px] font-bold text-white">Available Cards</h2>
              <div className="grid grid-cols-4 gap-[6px]">
                {availableCardGrid.map((card, index) => {
                  if (!card) {
                    return <EmptySlotTile key={`available-empty-${index}`} />;
                  }

                  return (
                    <FigmaCardTile
                      key={`available-${card.id}-${index}`}
                      card={card}
                      onClick={() => addCardToDeck(card)}
                    />
                  );
                })}
              </div>
            </article>
          </section>
        )}

        {!isEditing && savedDecks.length > 0 && (
          <section className="mx-auto mt-6 w-full max-w-[375px] space-y-[16px]">
            <FigmaWideCreateButton onCreateDeck={startNewDeck} />
            <FigmaDeckSeparator />
            <div className="space-y-[16px]">
              {savedDecks.map((deck) => (
                <FigmaSavedDeckCard
                  key={deck.id}
                  deck={deck}
                  onEdit={() => editDeck(deck)}
                  onDelete={() => deleteDeck(deck.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-white/30 bg-[#272727] md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5 px-2 py-2 text-[12px] text-white/70">
          <li>
            <Link href="/" className="flex flex-col items-center justify-center gap-1 py-1">
              <BottomNavIcon kind="home" />
              Home
            </Link>
          </li>
          <li>
            <Link href="/marketplace" className="flex flex-col items-center justify-center gap-1 py-1">
              <BottomNavIcon kind="market" />
              Marketplace
            </Link>
          </li>
          <li>
            <Link href="/gacha" className="flex flex-col items-center justify-center gap-1 py-1">
              <BottomNavIcon kind="gacha" />
              Gacha
            </Link>
          </li>
          <li>
            <Link href="/deck" className="flex flex-col items-center justify-center gap-1 py-1 text-white">
              <BottomNavIcon kind="deck" />
              Deck
            </Link>
          </li>
          <li>
            <Link href="/tournament" className="flex flex-col items-center justify-center gap-1 py-1">
              <BottomNavIcon kind="tournament" />
              Tournament
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

