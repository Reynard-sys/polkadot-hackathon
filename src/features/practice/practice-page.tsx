"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PageBackground from "@/components/page-background";
import { useWallet } from "@/context/wallet-context";
import {
  applyBotTurnAction,
  activateUnitAbility,
  BOT_DESKTOP_ORDER,
  BOT_MOBILE_ORDER,
  MAX_ATTACKS_PER_TURN,
  PLAYER_DESKTOP_ORDER,
  PLAYER_MOBILE_ORDER,
  TOTAL_SLOTS,
  TUTORIAL_STORAGE_KEY,
  activateLeaderAbility,
  activateStartTurnAura,
  advanceToBattlePhase,
  canActivateStartTurnAura,
  canActivateUnitAbility,
  canUseLeaderAbility,
  endTurn,
  executeAttack,
  generateBotDeck,
  getAttackableSlots,
  getBattleUnitElement,
  getBattleUnitMaxHp,
  getNextBotTurnAction,
  getPracticeCardById,
  getStartTurnAuraTargetState,
  getSlotLabel,
  getSlotZone,
  getUnitAbilityTargetState,
  getUnitCurrentPower,
  getValidAttackTargets,
  initializeBattleState,
  loadSavedDecks,
  padDeck,
  type BattleState,
  type BattleTarget,
  type BattleUnit,
  type BotTurnAction,
  type Owner,
  type PracticeCard,
  type SavedDeck,
} from "@/features/practice/battle-engine";

type PendingPracticeSetup = {
  deck: SavedDeck;
  playerCards: Array<PracticeCard | null>;
  botCards: Array<PracticeCard | null>;
};

type PendingUnitAbility = {
  kind: "manual" | "startTurnAura";
  slotIndex: number;
  targets: BattleTarget[];
};

type PracticeTutorialPage = {
  title: string;
  body: string[];
  visual:
    | "welcome"
    | "card"
    | "board"
    | "leader"
    | "turns"
    | "abilities"
    | "attack"
    | "elements"
    | "status"
    | "end"
    | "tips";
  imageSrc?: string;
  imageAlt?: string;
};

export const PRACTICE_TUTORIAL_PAGES: readonly PracticeTutorialPage[] = [
  {
    title: "Welcome to the Battle",
    body: [
      "Aniverse Nexus is a 1v1 fight where both boards start fully built from the deck builder.",
      "Your goal is to drop the enemy HP from 40 to 0 before they do the same to you.",
      "Every match starts with 3 Frontline, 4 Backline, 1 Leader, and up to 4 Reserve already placed.",
    ],
    visual: "welcome",
    imageSrc: "/assets/tutorial/welcome_tutorial.svg",
    imageAlt: "Welcome to the Battle",
  },
  {
    title: "Reading a Card",
    body: [
      "Each card has a similar layout showing information you need in a real battle.",
      "Mana: amount of mana required to activate an ability.",
      "Power: basic attack damage",
      "Health: how much a card can take",
      "Element: can add +1 damage in the right matchup.",
      "Zone: tells you whether the card belongs in Frontline, Backline, or Reserve.",
    ],
    visual: "card",
    imageSrc: "/assets/tutorial/card_tutorial.svg",
    imageAlt: "Reading a Card",
  },
  {
    title: "The Board",
    body: [
      "Your board is the reflection of the deck you built. Plan it strategically.",
      "Frontline protects the rest of your side. Backline stays safer until the Frontline is opened.",
      "Reserve cards can attack from safety, but enemy attacks still cannot target them.",
      "Your Leader holds your side's 40 HP and can only attack after the enemy Frontline is cleared.",
    ],
    visual: "board",
  },
  {
    title: "Your Leader Card",
    body: [
      "Leader card is the player representation. Protect it at all cost.",
      "Leaders stay visible for the full match and use their own once-per-game leader ability.",
      "Leader abilities happen during Main Phase and do not cost mana.",
      "Leader cards cannot attack until the enemy Frontline is gone.",
      "Save the leader effect for a turn that actually changes the board.",
    ],
    visual: "leader",
    imageSrc: "/assets/tutorial/leader_tutorial.svg",
    imageAlt: "Your Leader Card",
  },
  {
    title: "How a Turn Works",
    body: [
      "Each turn runs Start, Main, Battle, and End in order.",
      "Each side starts at 2 mana. At the start of your next turns, your current mana goes up by 1 until it reaches 7.",
      "Attacks are available from turn 1 once you move into Battle Phase.",
    ],
    visual: "turns",
    imageSrc: "/assets/tutorial/turns_tutorial.svg",
    imageAlt: "How a Turn Works",
  },
  {
    title: "Activating Abilities",
    body: [
      "Each card have unique abilities that can turn the tide of battle.",
      "Aura, Passive, and Combat Trigger abilities resolve automatically while their conditions are live.",
      "OnSummon abilities are manual in Main Phase: spend that card's mana once, choose targets, then resolve the effect.",
      "Reserve Aura cards still matter even if they never swing.",
    ],
    visual: "abilities",
    imageSrc: "/assets/tutorial/abilities_tutorial.svg",
    imageAlt: "Activating Abilities",
  },
  {
    title: "Debuffs and Status Effects",
    body: [
      "Debuffs are effects of a card skill",
      "Disabled, Sealed, and Silenced interfere with attacks or abilities, so always check the icons on a card.",
      "Shield can absorb hits, and Guard can force attacks into a specific target first.",
    ],
    visual: "status",
    imageSrc: "/assets/tutorial/effect_tutorial.svg",
    imageAlt: "Debuffs and Status Effects",
  },
  {
    title: "Attacking",
    body: [
      "You can drag a ready unit onto a valid target or tap the attack icon and then pick the target.",
      "Reserve cards can attack too, but Reserve cards still stay untargetable by attacks. Leaders join only after the enemy Frontline is cleared.",
      "Frontline is always targetable. Backline opens only after Frontline is gone or if your attacker has Backline Strike.",
      "When you pick an attacker or a heal card, only legal targets light up.",
    ],
    visual: "attack",
    imageSrc: "/assets/tutorial/attack_tutorial.svg",
    imageAlt: "Attacking",
  },
  {
    title: "The Element System",
    body: [
      "Card elements can turn the tide of the battle.",
      "Fire beats Air, Air beats Earth, Earth beats Water, and Water beats Fire for +1 damage.",
      "There is no penalty for hitting into a stronger element.",
      "Element advantage is a clean way to finish units that should barely survive.",
    ],
    visual: "elements",
    imageSrc: "/assets/tutorial/elements_tutorial.svg",
    imageAlt: "The Element System",
  },
  {
    title: "Winning and Losing",
    body: [
      "You win by reducing the opposing player to 0 HP.",
      "Direct attacks only open after the enemy Frontline has been cleared.",
      "If your own Frontline collapses, your HP becomes exposed fast.",
    ],
    visual: "end",
    imageSrc: "/assets/tutorial/end_tutorial.svg",
    imageAlt: "Winning and Losing",
  },
  {
    title: "Quick Tips Before You Play",
    body: [
      "Explore and have fun with Aniverse Nexus",
      "Protect at least one Frontline unit whenever possible.",
      "Burn and Poison deal chip damage over time, while Stun and Sleep stop a unit from acting.",
      "Do not waste leader value early if the board is still even.",
      "Read your battle cards before the match so you know which effects need mana and which are always on.",
    ],
    visual: "tips",
    imageSrc: "/assets/tutorial/tips_tutorial.svg",
    imageAlt: "Quick Tips Before You Play",
  },
];

const EMPTY_BATTLE_SLOTS = Array.from(
  { length: TOTAL_SLOTS },
  () => null,
) as Array<BattleUnit | null>;

const DIRECT_ATTACK_DROP_ID = "practice-target-player-bot";
const BOT_ACTION_DELAY_MS = 520;
const BOT_ATTACK_TRAVEL_MS = 360;

type AttackDragData = {
  type: "battle-card";
  mode: "attack" | "ability";
  slotIndex: number;
  card: BattleUnit;
};

type BotAttackAnimationState = {
  card: BattleUnit;
  from: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  translateX: number;
  translateY: number;
};

type AbilitySelectionMode = "attack" | "ability" | null;
type AbilityCardState = "ready" | "locked" | "used" | null;

type CardAbilityPopupContent = {
  title: string;
  description: string;
  cost: number;
  canActivate: boolean;
  disabledReason: string | null;
  alreadyUsed: boolean;
  hasActivation: boolean;
};

type StatusOverlayEntry = {
  key: string;
  src: string;
  alt: string;
  count?: number | null;
};

function getAttackCardDragId(owner: Owner, slotIndex: number) {
  return `practice-attack-card-${owner}-${slotIndex}`;
}

function getBattleSlotNodeId(owner: Owner, slotIndex: number) {
  return `practice-board-slot-${owner}-${slotIndex}`;
}

function getBattleLeaderNodeId(owner: Owner) {
  return `practice-board-leader-${owner}`;
}

function getBattleTargetDropId(target: BattleTarget) {
  return target.type === "player"
    ? DIRECT_ATTACK_DROP_ID
    : `practice-target-slot-${target.owner}-${target.slotIndex}`;
}

function getBattleTargetNodeId(target: BattleTarget) {
  return target.type === "player"
    ? getBattleLeaderNodeId(target.owner)
    : getBattleSlotNodeId(target.owner, target.slotIndex);
}

function parseBattleTargetDropId(id: string): BattleTarget | null {
  if (id === DIRECT_ATTACK_DROP_ID) {
    return {
      type: "player",
      owner: "bot",
    };
  }

  const match = /^practice-target-slot-(player|bot)-(\d+)$/.exec(id);
  if (!match) {
    return null;
  }

  return {
    type: "slot",
    owner: match[1] as Owner,
    slotIndex: Number.parseInt(match[2], 10),
  };
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 5l-7 7 7 7" />
      <path d="M9 12h10" />
    </svg>
  );
}

function PracticeAttackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 18 18 6" />
      <path d="m12 6 6 0 0 6" />
      <path d="M6 6l6 6" />
      <path d="M6 12V6h6" />
    </svg>
  );
}

function supportsHealDrag(card: BattleUnit | null) {
  return Boolean(
    card &&
    ((card.ability?.trigger === "OnSummon" && card.ability.type === "Heal") ||
      hasManualStartTurnAura(card)),
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function PracticeTutorialButton({
  onClick,
  compact = false,
}: {
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/5 font-bold text-white transition-colors hover:bg-white/10 ${
        compact ? "h-[36px] px-3 text-[12px]" : "h-[42px] px-4 text-[14px]"
      }`}
    >
      <Image
        src="/assets/tutorial.svg"
        alt=""
        width={18}
        height={18}
        className={compact ? "h-[16px] w-[16px]" : "h-[18px] w-[18px]"}
      />
      <span>{compact ? "Guide" : "Tutorial"}</span>
    </button>
  );
}

function MobileDetailBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="fixed left-4 top-[84px] z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#151932]/85 shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
      aria-label="Back"
    >
      <BackIcon />
    </button>
  );
}

function TutorialVisual({ page }: { page: PracticeTutorialPage }) {
  const pikachuCard = getPracticeCardById(36);

  if (page.imageSrc) {
    return (
      <div className="relative mx-auto aspect-[16/10] w-full overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        <Image
          src={page.imageSrc}
          alt={page.imageAlt ?? page.title}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  if (page.visual === "card" && pikachuCard) {
    return (
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="relative mx-auto aspect-[148/204] w-full max-w-[180px] overflow-hidden rounded-[16px] border border-white/10 bg-white/5">
          <Image
            src={pikachuCard.art}
            alt={pikachuCard.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4 text-left text-sm leading-6 text-white/72">
          <p>
            <span className="font-semibold text-white">Mana:</span> ability cost
          </p>
          <p>
            <span className="font-semibold text-white">Power:</span> attack
            damage
          </p>
          <p>
            <span className="font-semibold text-white">HP:</span> survival value
          </p>
          <p>
            <span className="font-semibold text-white">Element:</span> matchup
            bonus
          </p>
          <p>
            <span className="font-semibold text-white">Zone:</span> where the
            card belongs
          </p>
        </div>
      </div>
    );
  }

  if (page.visual === "board") {
    return (
      <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold tracking-[0.12em] text-white/55 uppercase">
          {[
            "Leader",
            "Frontline",
            "Frontline",
            "Frontline",
            "Backline",
            "Backline",
            "Backline",
            "Backline",
            "Reserve",
            "Reserve",
            "Reserve",
            "Reserve",
          ].map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="flex aspect-[148/204] items-center justify-center rounded-[12px] border border-dashed border-white/15 bg-[#0b1434]"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page.visual === "elements") {
    return (
      <div className="rounded-[18px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-3 text-sm text-white/78 md:grid-cols-2">
          <div className="rounded-[14px] bg-[#1d1f49] p-3">
            {"Fire -> Air +1"}
          </div>
          <div className="rounded-[14px] bg-[#1d1f49] p-3">
            {"Air -> Earth +1"}
          </div>
          <div className="rounded-[14px] bg-[#1d1f49] p-3">
            {"Earth -> Water +1"}
          </div>
          <div className="rounded-[14px] bg-[#1d1f49] p-3">
            {"Water -> Fire +1"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,#13244f_0%,#0d1530_100%)] p-5 text-left">
      <p className="text-sm leading-6 text-white/72">
        Battle notes and reminders for this page stay short on purpose so the
        flow is easier to learn during a live match.
      </p>
    </div>
  );
}

export function PracticeTutorialModal({
  open,
  pageIndex,
  onClose,
  onBack,
  onNext,
  onSelectPage,
}: {
  open: boolean;
  pageIndex: number;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSelectPage: (page: number) => void;
}) {
  if (!open) {
    return null;
  }

  const page = PRACTICE_TUTORIAL_PAGES[pageIndex];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === PRACTICE_TUTORIAL_PAGES.length - 1;
  const tutorialDescription = page.body[0] ?? "";
  const tutorialBullets = page.body.slice(1);

  return (
    <div className="fixed inset-x-0 top-[72px] bottom-[76px] z-[98] overflow-y-auto bg-black/70 px-4 py-3 md:inset-0 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close tutorial"
      />
      <div className="relative z-10 mx-auto flex min-h-full items-start justify-center md:items-center">
        <div className="relative flex w-full max-w-[920px] max-h-full flex-col overflow-hidden rounded-[20px] border border-[#1f2540] bg-[#151932] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)] md:max-h-[calc(100dvh-2rem)]">
          <div className="shrink-0 border-b border-white/8 p-5 md:p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>

            <div className="pr-10">
              <p className="text-[14px] font-bold tracking-[0.14em] text-[#6ea8ff] uppercase">
                Practice Tutorial
              </p>
              <h2 className="mt-3 text-[24px] leading-[32px] font-bold text-white md:text-[28px] md:leading-[38px]">
                {page.title}
              </h2>
              <p className="mt-3 max-w-[620px] text-[15px] leading-[24px] text-[#99a1af]">
                {tutorialDescription}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-6">
            <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-8">
              <div className="rounded-[18px] border border-dashed border-white/15 bg-[linear-gradient(180deg,#21283a_0%,#0f1320_100%)] p-4">
                <TutorialVisual page={page} />
              </div>

              <div className="rounded-[18px] border border-white/8 bg-[#0f1329] p-5">
                <p className="text-[14px] font-semibold text-white">
                  Quick notes
                </p>
                <ul className="mt-4 space-y-3 text-[14px] leading-[22px] text-[#d2d2d2]">
                  {tutorialBullets.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6ea8ff]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/8 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                {PRACTICE_TUTORIAL_PAGES.map((entry, index) => (
                  <button
                    key={entry.title}
                    type="button"
                    onClick={() => onSelectPage(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      pageIndex === index
                        ? "w-8 bg-[#6ea8ff]"
                        : "w-2.5 bg-white/20"
                    }`}
                    aria-label={`Go to tutorial page ${index + 1}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isFirstPage}
                  className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-white/10 bg-white/5 px-4 text-[14px] font-bold text-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={isLastPage ? onClose : onNext}
                  className="inline-flex h-[44px] items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#0144BD_0%,#192871_100%)] px-5 text-[14px] font-bold text-white"
                >
                  {isLastPage ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBattleCardTraits(card: BattleUnit) {
  if (card.traits.length > 0) {
    return card.traits;
  }

  return card.zones;
}

const STATUS_ICON_META: Record<
  | "Burn"
  | "Poison"
  | "Stun"
  | "Sleep"
  | "Disabled"
  | "Sealed"
  | "Silenced"
  | "Stoned"
  | "Shield",
  { src: string; alt: string }
> = {
  Burn: { src: "/assets/icons/burn.svg", alt: "Burn status" },
  Poison: { src: "/assets/icons/poison.svg", alt: "Poison status" },
  Stun: { src: "/assets/icons/stun.svg", alt: "Stun status" },
  Sleep: { src: "/assets/icons/sleep.svg", alt: "Sleep status" },
  Disabled: { src: "/assets/icons/disabled.svg", alt: "Disabled status" },
  Sealed: { src: "/assets/icons/sealed.svg", alt: "Sealed status" },
  Silenced: { src: "/assets/icons/silenced.svg", alt: "Silenced status" },
  Stoned: { src: "/assets/icons/stoned.svg", alt: "Stoned status" },
  Shield: { src: "/assets/icons/shield.svg", alt: "Shield status" },
};

function getStatusOverlayEntries(card: BattleUnit): StatusOverlayEntry[] {
  const statusSet = new Set(card.statusEffects);
  const visibleStatuses = card.statusEffects.filter((status) => {
    if (status === "Stun" && statusSet.has("Stoned")) {
      return false;
    }

    if (status === "Disabled" && statusSet.has("Stoned")) {
      return false;
    }

    return status in STATUS_ICON_META;
  }) as Array<keyof typeof STATUS_ICON_META>;

  const entries = visibleStatuses.map((status) => ({
    key: status,
    src: STATUS_ICON_META[status].src,
    alt: STATUS_ICON_META[status].alt,
    count: status === "Burn" ? (card.statusDurations.Burn ?? null) : null,
  }));

  if (card.shieldsRemaining > 0) {
    entries.push({
      key: "Shield",
      src: STATUS_ICON_META.Shield.src,
      alt: STATUS_ICON_META.Shield.alt,
      count: card.shieldsRemaining,
    });
  }

  return entries;
}

function shouldFlipCardFaceDown(card: BattleUnit) {
  return card.statusEffects.some((status) =>
    ["Stun", "Sleep", "Stoned"].includes(status),
  );
}

function getAbilityCardState(
  battleState: BattleState | null,
  card: BattleUnit | null,
  side: Owner,
  phase: BattleState["phase"] | "Lobby",
  activePlayer: Owner | "none",
  selectionMode: AbilitySelectionMode,
): AbilityCardState {
  if (
    !battleState ||
    !card ||
    side !== "player" ||
    card.slotIndex === 0 ||
    phase !== "Main" ||
    activePlayer !== "player" ||
    selectionMode !== null
  ) {
    return null;
  }

  const hasStartTurnAura = hasManualStartTurnAura(card);
  const ability = card.ability?.trigger === "OnSummon" ? card.ability : null;
  if (!ability && !hasStartTurnAura) {
    return null;
  }

  if (card.abilityUsedThisTurn) {
    return "used";
  }

  if (
    card.isSilenced ||
    card.statusEffects.includes("Sealed") ||
    card.statusEffects.includes("Disabled")
  ) {
    return null;
  }

  if (hasStartTurnAura) {
    return canActivateStartTurnAura(battleState, "player", card.slotIndex)
      ? "ready"
      : "locked";
  }

  if (isDrawManaCard(card)) {
    return canActivateUnitAbility(battleState, "player", card.slotIndex)
      ? "ready"
      : "locked";
  }

  return battleState.players.player.mana >= card.mana ? "ready" : "locked";
}

function BattleCardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ManaOrbRow({
  currentMana,
  manaMax,
}: {
  currentMana: number;
  manaMax: number;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      {Array.from({ length: 7 }, (_, index) => {
        const orbIndex = index + 1;
        const isFilled = orbIndex <= currentMana;
        const isAvailable = orbIndex <= manaMax;

        return (
          <div
            key={orbIndex}
            className={`relative h-3.5 w-3.5 rotate-45 rounded-[3px] border ${
              isFilled
                ? "border-[#8cc8ff] bg-[#2d86ff] shadow-[0_0_10px_rgba(45,134,255,0.45)]"
                : isAvailable
                  ? "border-white/35 bg-transparent"
                  : "border-white/10 bg-white/8"
            }`}
          >
            {!isFilled && !isAvailable ? (
              <span className="absolute inset-0 -rotate-45 text-center text-[8px] leading-[13px] font-black text-white/28">
                x
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ManaBattleStat({
  label,
  currentMana,
  manaMax,
}: {
  label: string;
  currentMana: number;
  manaMax: number;
}) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] tracking-[0.12em] text-white/45 uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold text-white">{`${currentMana}/7`}</p>
      </div>
      <ManaOrbRow currentMana={currentMana} manaMax={manaMax} />
    </div>
  );
}

function StatusIconStrip({ entries }: { entries: StatusOverlayEntry[] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-2 right-2 z-20 flex flex-row-reverse items-center gap-1">
      <AnimatePresence initial={false}>
        {entries.map((entry) => (
          <motion.div
            key={entry.key}
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative h-5 w-5"
          >
            <Image
              src={entry.src}
              alt={entry.alt}
              width={20}
              height={20}
              className="h-5 w-5 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
              unoptimized
            />
            {entry.count ? (
              <span className="absolute -bottom-1 -right-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-black/80 px-1 text-[9px] font-bold text-white">
                {`x${entry.count}`}
              </span>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function MiniHealthBar({
  currentHp,
  maxHp,
  compactForAction,
}: {
  currentHp: number;
  maxHp: number;
  compactForAction: boolean;
}) {
  const safeMax = Math.max(1, maxHp);
  const percent = Math.max(0, Math.min(100, (currentHp / safeMax) * 100));

  return (
    <div
      className={`pointer-events-none absolute top-2 z-10 ${compactForAction ? "left-2 right-11" : "left-2 right-2"}`}
    >
      <div className="h-2 overflow-hidden rounded-full border border-black/30 bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.2)]">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            percent > 60
              ? "bg-[#52d273]"
              : percent > 30
                ? "bg-[#f3c34f]"
                : "bg-[#ff6b6b]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AbilityCardPopup({
  content,
  onActivate,
  onClose,
}: {
  content: CardAbilityPopupContent;
  onActivate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-30 w-[220px] -translate-x-1/2 rounded-[14px] border border-[#d3b25a]/55 bg-[#15111f]/96 p-3 text-left shadow-[0_18px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-[#ffd56f]">{`Skill: ${content.title}`}</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/70"
          aria-label="Close ability popup"
        >
          X
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {content.cost > 0 ? (
          <p className="text-[11px] font-semibold text-white/70">{`Cost: ${content.cost} mana`}</p>
        ) : (
          <span />
        )}
        {content.hasActivation && !content.alreadyUsed ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onActivate();
            }}
            disabled={!content.canActivate}
            className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.08em] uppercase ${
              content.canActivate
                ? "bg-[#f5c553] text-[#261509]"
                : "cursor-not-allowed bg-white/10 text-white/40"
            }`}
          >
            Activate
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-white/72">
        {content.description}
      </p>
      {content.disabledReason ? (
        <p className="mt-2 text-[10px] font-semibold text-white/55">
          {content.disabledReason}
        </p>
      ) : null}
    </div>
  );
}

function PracticeMobileCardDetail({
  card,
  onClose,
  canUseLeader,
  canUseAbility,
  onUseAbility,
  onUseLeaderAbility,
}: {
  card: BattleUnit;
  onClose: () => void;
  canUseLeader: boolean;
  canUseAbility: boolean;
  onUseAbility: () => void;
  onUseLeaderAbility: () => void;
}) {
  const detailTraits = getBattleCardTraits(card);
  const currentPower = getUnitCurrentPower(card);
  const maxHp = getBattleUnitMaxHp(card);
  const currentElement = getBattleUnitElement(card);
  const currentZone = getSlotZone(card.slotIndex);

  return (
    <div className="fixed inset-x-0 bottom-[76px] top-[72px] z-[88] overflow-y-auto bg-black/60 px-4 py-4 md:hidden">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <MobileDetailBackButton onBack={onClose} />
      <section className="relative z-10 mx-auto w-full max-w-[375px] space-y-5 rounded-[20px] border border-[#1f2540] bg-[#151932] p-4 pb-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]">
        <div className="flex justify-center">
          <div className="relative h-[507px] w-full max-w-[360px] overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
            <Image
              src={card.art}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[365px] flex-col gap-5 px-[15.995px]">
          <div className="min-w-0">
            <p className="text-[18px] leading-[28px] font-bold text-white">
              {card.name}
            </p>
            {card.subtitle ? (
              <p className="text-[14px] leading-[20px] font-normal text-[#e8e8e8]">
                {card.subtitle}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BattleCardStat label="Mana" value={String(card.mana)} />
            <BattleCardStat label="Power" value={String(currentPower)} />
            <BattleCardStat label="HP" value={`${card.currentHP} / ${maxHp}`} />
            <BattleCardStat label="Element" value={currentElement} />
            <BattleCardStat label="Position" value={currentZone} />
            <BattleCardStat label="Rarity" value={card.rarity} />
          </div>

          {card.statusEffects.length > 0 ? (
            <div className="w-full rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] py-4">
              <p className="text-[12px] leading-[24px] font-bold text-white">
                Status
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {card.statusEffects.map((status) => (
                  <span
                    key={status}
                    className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="w-full max-w-[348px] space-y-1">
            <p className="text-[12px] leading-[16px] text-[#e8e8e8]">Traits</p>
            <div className="flex flex-wrap gap-1.5">
              {detailTraits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pt-[17px] pb-4">
            <p className="text-[12px] leading-[24px] font-bold text-white">
              Description
            </p>
            <p className="mt-2 text-[13px] leading-[22px] font-normal text-[#99a1af]">
              {getDisplayedAbilityDescription(
                card.abilityDescription,
                card.ability?.type,
              )}
            </p>
            {card.leaderEligible && card.leaderDescription ? (
              <p className="mt-4 text-[13px] leading-[22px] font-normal text-[#99a1af]">
                {card.leaderDescription}
              </p>
            ) : null}
            {canUseAbility ? (
              <button
                type="button"
                onClick={onUseAbility}
                className="mt-4 rounded-full bg-[#0f56d9] px-4 py-2 text-sm font-semibold text-white"
              >
                {getAbilityActionLabel(card)}
              </button>
            ) : null}
            {canUseLeader ? (
              <button
                type="button"
                onClick={onUseLeaderAbility}
                className="mt-3 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white"
              >
                Use Leader Ability
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function PracticeCardModal({
  card,
  onClose,
  canUseLeader,
  canUseAbility,
  onUseAbility,
  onUseLeaderAbility,
}: {
  card: BattleUnit;
  onClose: () => void;
  canUseLeader: boolean;
  canUseAbility: boolean;
  onUseAbility: () => void;
  onUseLeaderAbility: () => void;
}) {
  const detailTraits = getBattleCardTraits(card);
  const currentPower = getUnitCurrentPower(card);
  const maxHp = getBattleUnitMaxHp(card);
  const currentElement = getBattleUnitElement(card);
  const currentZone = getSlotZone(card.slotIndex);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 md:p-6">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="relative z-10 w-full max-w-[960px] rounded-[16px] border border-[#1f2540] bg-[#151932] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] md:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <div className="grid gap-6 md:grid-cols-[360px_1fr] md:gap-8">
          <div className="relative h-[380px] w-full overflow-hidden rounded-[12px] border border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.45)] md:h-[507px] md:max-w-[360px]">
            <Image
              src={card.art}
              alt={card.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[26px] leading-[39px] font-bold text-white">
                  {card.name}
                </h2>
                {card.subtitle ? (
                  <p className="mt-1 text-[14px] leading-[20px] text-[#99a1af]">
                    {card.subtitle}
                  </p>
                ) : null}
              </div>
              <span className="mt-2 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-bold text-white">
                {card.rarity}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <BattleCardStat label="Mana" value={String(card.mana)} />
              <BattleCardStat label="Power" value={String(currentPower)} />
              <BattleCardStat
                label="HP"
                value={`${card.currentHP} / ${maxHp}`}
              />
              <BattleCardStat label="Element" value={currentElement} />
              <BattleCardStat label="Position" value={currentZone} />
              <BattleCardStat
                label="Leader"
                value={card.slotIndex === 0 ? "Yes" : "No"}
              />
            </div>

            {card.statusEffects.length > 0 ? (
              <div className="mt-5 space-y-1">
                <p className="text-[14px] text-[#99a1af]">Status</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {card.statusEffects.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[12px] font-medium text-white"
                    >
                      {status}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 space-y-1">
              <p className="text-[14px] text-[#99a1af]">Traits</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {detailTraits.map((trait) => (
                  <span
                    key={trait}
                    className="inline-flex items-center rounded-full bg-white/10 px-3 py-0.5 text-[12px] font-medium text-white"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex-1 rounded-[14px] border border-[#1f2540] bg-[#0f1329] px-[17px] pb-4 pt-[17px]">
              <p className="text-[16px] leading-[24px] font-bold text-white">
                Description
              </p>
              <p className="mt-3 text-[14px] leading-[22.75px] text-[#99a1af]">
                {getDisplayedAbilityDescription(
                  card.abilityDescription,
                  card.ability?.type,
                )}
              </p>
              {card.leaderEligible && card.leaderDescription ? (
                <p className="mt-4 text-[14px] leading-[22.75px] text-[#99a1af]">
                  {card.leaderDescription}
                </p>
              ) : null}
              {canUseAbility ? (
                <button
                  type="button"
                  onClick={onUseAbility}
                  className="mt-5 rounded-full bg-[#0f56d9] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  {getAbilityActionLabel(card)}
                </button>
              ) : null}
              {canUseLeader ? (
                <button
                  type="button"
                  onClick={onUseLeaderAbility}
                  className="mt-3 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Use Leader Ability
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function targetKey(target: BattleTarget) {
  return target.type === "player"
    ? `${target.owner}-player`
    : `${target.owner}-${target.slotIndex}`;
}

function getVisibleNodeRect(nodeId: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const matches = document.querySelectorAll<HTMLElement>(
    `[data-battle-node="${nodeId}"]`,
  );
  for (const element of matches) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return rect;
    }
  }

  return null;
}

function getNewLogEntries(previousLogs: string[], nextLogs: string[]) {
  if (previousLogs.length === 0) {
    return nextLogs;
  }

  for (
    let overlapStart = 0;
    overlapStart < previousLogs.length;
    overlapStart += 1
  ) {
    const suffix = previousLogs.slice(overlapStart);
    const prefix = nextLogs.slice(0, suffix.length);
    if (
      suffix.length <= nextLogs.length &&
      suffix.every((entry, index) => entry === prefix[index])
    ) {
      return nextLogs.slice(suffix.length);
    }
  }

  return nextLogs;
}

function formatAbilityLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function hasManualStartTurnAura(card: BattleUnit) {
  return (
    card.ability?.trigger === "Aura" && card.ability.type === "HealAllyPerTurn"
  );
}

function isDrawManaCard(card: BattleUnit) {
  return (
    card.ability?.trigger === "OnSummon" && card.ability.type === "DrawCard"
  );
}

function getAbilityActionLabel(card: BattleUnit) {
  return hasManualStartTurnAura(card) || isDrawManaCard(card)
    ? "Use Ability"
    : `Use Ability (${card.mana} Mana)`;
}

function getDisplayedAbilityDescription(
  description: string | null | undefined,
  abilityType?: string | null,
) {
  if (!description) {
    return "No description available for this skill.";
  }

  const normalized = description.replace(
    /\b[Dd]raw\s+(\d+)\s+card(s)?\b/g,
    (_match, amount: string) => `Gain ${amount} mana`,
  );

  if (abilityType === "DrawCard") {
    return `${normalized} This ability is free and can be used every other turn.`;
  }

  return normalized;
}

function getBattleTargetLabel(battleState: BattleState, target: BattleTarget) {
  if (target.type === "player") {
    return target.owner === "bot" ? "the bot leader" : "your leader";
  }

  return (
    battleState.board[target.owner][target.slotIndex]?.name ??
    getSlotLabel(target.slotIndex)
  );
}

function getCardAbilityPopupContent(
  battleState: BattleState,
  card: BattleUnit,
): CardAbilityPopupContent {
  if (card.slotIndex === 0 && card.leaderAbility) {
    const alreadyUsed = battleState.leaderUsed.player;
    return {
      title: `${card.name} - ${formatAbilityLabel(card.leaderAbility.type)}`,
      description:
        card.leaderDescription ||
        "This leader ability can be used once per game.",
      cost: 0,
      canActivate:
        battleState.activePlayer === "player" &&
        battleState.phase === "Main" &&
        !battleState.winner &&
        !alreadyUsed,
      disabledReason: alreadyUsed
        ? "Already used"
        : battleState.phase !== "Main"
          ? "Main Phase only"
          : battleState.activePlayer !== "player"
            ? "Wait for your turn"
            : null,
      alreadyUsed,
      hasActivation: true,
    };
  }

  if (hasManualStartTurnAura(card)) {
    const alreadyUsed = card.abilityUsedThisTurn;
    const canActivate = canActivateStartTurnAura(
      battleState,
      card.owner,
      card.slotIndex,
    );
    const isSealed = card.statusEffects.includes("Sealed");
    const statusBlockedReason = card.isSilenced
      ? "Silenced"
      : isSealed
        ? "Sealed"
        : card.statusEffects.includes("Disabled")
          ? "Disabled"
          : null;

    return {
      title: `${card.name} - ${formatAbilityLabel(card.ability?.type ?? "Ability")}`,
      description:
        getDisplayedAbilityDescription(card.abilityDescription) ||
        "Restore 1 HP to a friendly card or your leader once each turn.",
      cost: 0,
      canActivate,
      disabledReason: alreadyUsed
        ? "Already used this turn"
        : statusBlockedReason
          ? statusBlockedReason
          : battleState.turn <= 1
            ? "Available from turn 2 onward"
            : battleState.phase !== "Main"
              ? "Main Phase only"
              : battleState.activePlayer !== "player"
                ? "Wait for your turn"
                : null,
      alreadyUsed,
      hasActivation: true,
    };
  }

  const ability = card.ability?.trigger === "OnSummon" ? card.ability : null;
  if (!ability) {
    return {
      title: `${card.name} - Passive`,
      description: getDisplayedAbilityDescription(
        card.abilityDescription,
        card.ability?.type,
      ),
      cost: card.mana,
      canActivate: false,
      disabledReason: "No activatable skill",
      alreadyUsed: false,
      hasActivation: false,
    };
  }

  const alreadyUsed = card.abilityUsedThisTurn;
  const isDrawMana = ability.type === "DrawCard";
  const manaCost = isDrawMana ? 0 : card.mana;
  const enoughMana = isDrawMana || battleState.players.player.mana >= card.mana;
  const isSealed = card.statusEffects.includes("Sealed");
  const blockedByStatus = card.isSilenced || isSealed;
  const drawOnCooldown =
    isDrawMana &&
    card.lastDrawManaTurnStarted !== null &&
    battleState.players.player.turnsStarted - card.lastDrawManaTurnStarted < 2;
  const statusBlockedReason = card.isSilenced
    ? "Silenced"
    : isSealed
      ? "Sealed"
      : null;
  const canActivate =
    battleState.activePlayer === "player" &&
    battleState.phase === "Main" &&
    !battleState.winner &&
    !alreadyUsed &&
    enoughMana &&
    !blockedByStatus;

  return {
    title: `${card.name} - ${formatAbilityLabel(ability.type)}`,
    description: getDisplayedAbilityDescription(
      card.abilityDescription,
      ability.type,
    ),
    cost: manaCost,
    canActivate,
    disabledReason: alreadyUsed
      ? "Already used this turn"
      : statusBlockedReason
        ? statusBlockedReason
        : drawOnCooldown
          ? "Every other turn only"
          : !enoughMana
            ? `Not enough mana (need ${card.mana}, have ${battleState.players.player.mana})`
            : battleState.phase !== "Main"
              ? "Main Phase only"
              : battleState.activePlayer !== "player"
                ? "Wait for your turn"
                : null,
    alreadyUsed,
    hasActivation: true,
  };
}

function shouldRotateBattleCard(
  card: BattleUnit,
  battleState: BattleState | null,
) {
  if (!battleState) {
    return false;
  }

  const abilityText =
    card.slotIndex === 0
      ? (card.leaderDescription ?? "")
      : card.abilityDescription;
  const rotatesOnUse =
    /180\s*degrees?|rotate|turn the card|flip (?:the|this) card|leader 180/i.test(
      abilityText,
    );
  const isSuppressedReserve =
    getSlotZone(card.slotIndex) === "Reserve" &&
    battleState.reserveSuppressedUntilTurn[card.owner] === battleState.turn;

  return (
    (card.cloneActive && /flip (?:the|this) card|clone/i.test(abilityText)) ||
    (rotatesOnUse &&
      ((card.slotIndex === 0 && battleState.leaderUsed[card.owner]) ||
        card.abilityUsedThisTurn)) ||
    isSuppressedReserve
  );
}

function DirectAttackPanel({
  title,
  subtitle,
  directTargetable,
  attackSelectionActive,
  nodeId,
  onAttack,
}: {
  title: string;
  subtitle: string;
  directTargetable: boolean;
  attackSelectionActive: boolean;
  nodeId: string;
  onAttack?: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: DIRECT_ATTACK_DROP_ID,
  });
  const sharedClassName =
    "min-w-[120px] rounded-[16px] border px-4 py-3 text-left transition-all";

  if (directTargetable && onAttack) {
    return (
      <button
        ref={setNodeRef}
        data-battle-node={nodeId}
        type="button"
        onClick={onAttack}
        className={`${sharedClassName} ${
          isOver
            ? "border-[#ff844a] bg-[#3f160d] shadow-[0_0_0_2px_rgba(255,132,74,0.9),0_0_24px_rgba(255,108,54,0.42)]"
            : "border-[#ff844a] bg-[#311108] animate-pulse shadow-[0_0_0_2px_rgba(255,132,74,0.9),0_0_20px_rgba(255,108,54,0.32)]"
        }`}
      >
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
          Direct Attack
        </p>
        <p className="mt-1 text-sm font-bold text-white">{title}</p>
        <p className="mt-1 text-xs text-white/65">{subtitle}</p>
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-battle-node={nodeId}
      className={`${sharedClassName} border-white/10 bg-white/5 ${
        attackSelectionActive ? "opacity-40 saturate-0" : ""
      }`}
    >
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
        {title}
      </p>
      <p className="mt-1 text-xs text-white/65">{subtitle}</p>
    </div>
  );
}

function ArenaCard({
  card,
  slotIndex,
  side,
  phase,
  activePlayer,
  canAttack,
  dragMode,
  isSelectedAttacker,
  isTargetable,
  selectionMode,
  dimUnavailableTargets,
  isRotated,
  isFaceDown,
  abilityCardState,
  isAbilityPopupOpen,
  abilityPopupContent,
  onInspect,
  onSelectAttacker,
  onOpenAbilityPopup,
  onActivateAbilityPopup,
  onCloseAbilityPopup,
  onAttackTarget,
}: {
  card: BattleUnit | null;
  slotIndex: number;
  side: Owner;
  phase: BattleState["phase"] | "Lobby";
  activePlayer: Owner | "none";
  canAttack: boolean;
  dragMode: "attack" | "ability" | null;
  isSelectedAttacker: boolean;
  isTargetable: boolean;
  selectionMode: AbilitySelectionMode;
  dimUnavailableTargets: boolean;
  isRotated: boolean;
  isFaceDown: boolean;
  abilityCardState: AbilityCardState;
  isAbilityPopupOpen: boolean;
  abilityPopupContent: CardAbilityPopupContent | null;
  onInspect: (card: BattleUnit) => void;
  onSelectAttacker: (slotIndex: number) => void;
  onOpenAbilityPopup: (slotIndex: number) => void;
  onActivateAbilityPopup: (slotIndex: number) => void;
  onCloseAbilityPopup: () => void;
  onAttackTarget: (target: BattleTarget) => void;
}) {
  const isLeader = slotIndex === 0;
  const slotLabel = getSlotLabel(slotIndex);
  const showAttackIcon = side === "player" && !!card && canAttack;
  const statusEntries = card ? getStatusOverlayEntries(card) : [];
  const isUnavailableTarget =
    dimUnavailableTargets &&
    Boolean(card) &&
    !isTargetable &&
    !isSelectedAttacker &&
    !isAbilityPopupOpen;
  const attackGlow =
    side === "player" &&
    phase === "Battle" &&
    activePlayer === "player" &&
    canAttack &&
    !isSelectedAttacker;
  const leaderShift =
    side === "player"
      ? "-translate-y-[16%] lg:translate-y-0 lg:translate-x-[34%]"
      : "translate-y-[16%] lg:translate-y-0 lg:-translate-x-[34%]";
  const dropId = getBattleTargetDropId({
    type: "slot",
    owner: side,
    slotIndex,
  });
  const { isOver, setNodeRef } = useDroppable({ id: dropId });
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: getAttackCardDragId(side, slotIndex),
    data: card
      ? ({
          type: "battle-card",
          mode: dragMode ?? "attack",
          slotIndex,
          card,
        } satisfies AttackDragData)
      : undefined,
    disabled: !card || side !== "player" || !dragMode,
  });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;
  const abilityGlow =
    abilityCardState === "ready"
      ? isAbilityPopupOpen
        ? "rounded-[12px] shadow-[0_0_0_2px_rgba(240,205,99,0.68),0_0_22px_rgba(240,205,99,0.3)]"
        : "rounded-[12px] animate-pulse shadow-[0_0_0_2px_rgba(240,205,99,0.68),0_0_22px_rgba(240,205,99,0.3)]"
      : "";
  const abilityDimClass =
    abilityCardState === "locked"
      ? "opacity-75"
      : abilityCardState === "used"
        ? "opacity-60"
        : "";

  return (
    <div
      ref={setNodeRef}
      data-battle-node={getBattleSlotNodeId(side, slotIndex)}
      className={`relative aspect-[148/204] ${
        isLeader ? `z-10 ${leaderShift}` : ""
      } ${
        isSelectedAttacker
          ? "scale-[1.03] rounded-[12px] shadow-[0_0_0_2px_rgba(255,255,255,0.92),0_0_24px_rgba(255,255,255,0.36)]"
          : attackGlow
            ? "rounded-[12px] shadow-[0_0_0_1px_rgba(102,235,138,0.72),0_0_18px_rgba(102,235,138,0.24)]"
            : ""
      } ${
        isTargetable
          ? selectionMode === "ability"
            ? "rounded-[12px] animate-pulse shadow-[0_0_0_2px_rgba(234,196,88,0.92),0_0_24px_rgba(240,197,88,0.4)]"
            : "rounded-[12px] animate-pulse shadow-[0_0_0_2px_rgba(255,132,74,0.9),0_0_24px_rgba(255,108,54,0.42)]"
          : ""
      } ${selectionMode === null ? abilityGlow : ""}`}
    >
      {card ? <StatusIconStrip entries={statusEntries} /> : null}
      {card && abilityCardState === "locked" ? (
        <div className="pointer-events-none absolute left-2 top-2 z-20 inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-black/72 px-2 text-transparent shadow-[0_8px_18px_rgba(0,0,0,0.28)] before:block before:h-3 before:w-3 before:rotate-45 before:rounded-[2px] before:border before:border-[#8cc8ff] before:bg-[#1f6bff] before:content-['']">
          🔷
        </div>
      ) : null}
      {card && abilityCardState === "used" ? (
        <div className="pointer-events-none absolute left-2 top-2 z-20 inline-flex items-center justify-center rounded-full bg-[#3a4250]/92 px-2.5 py-1 text-transparent shadow-[0_8px_18px_rgba(0,0,0,0.28)] before:text-[10px] before:font-bold before:tracking-[0.08em] before:text-white/88 before:content-['USED']">
          ✓ USED
        </div>
      ) : null}
      {card ? (
        <MiniHealthBar
          currentHp={card.currentHP}
          maxHp={getBattleUnitMaxHp(card)}
          compactForAction={showAttackIcon}
        />
      ) : null}
      {card ? (
        <div
          ref={setDragRef}
          style={style}
          className={`relative h-full w-full ${
            isDragging ? "opacity-40" : ""
          } ${isRotated ? "rotate-180" : ""} ${
            isUnavailableTarget ? "opacity-40 grayscale saturate-0" : ""
          } ${abilityDimClass} touch-none transition-transform duration-300`}
        >
          <button
            type="button"
            onClick={() => {
              if (isTargetable) {
                onAttackTarget({
                  type: "slot",
                  owner: side,
                  slotIndex,
                });
                return;
              }

              if (
                side === "player" &&
                activePlayer === "player" &&
                phase === "Main" &&
                !selectionMode
              ) {
                if (abilityCardState === "used") {
                  onInspect(card);
                  return;
                }

                onOpenAbilityPopup(slotIndex);
                return;
              }

              if (
                side === "player" &&
                phase === "Battle" &&
                activePlayer === "player" &&
                canAttack
              ) {
                onSelectAttacker(slotIndex);
                return;
              }

              if (
                side === "player" &&
                phase === "Battle" &&
                activePlayer === "player"
              ) {
                return;
              }

              if (isUnavailableTarget) {
                return;
              }

              onInspect(card);
            }}
            className={`relative block h-full w-full ${
              isTargetable
                ? "cursor-pointer"
                : isUnavailableTarget
                  ? "cursor-default"
                  : dragMode
                    ? "cursor-grab active:cursor-grabbing touch-none"
                    : "cursor-pointer"
            }`}
            aria-label={
              isTargetable ? `Attack ${card.name}` : `View ${card.name}`
            }
            disabled={isUnavailableTarget}
            {...attributes}
            {...listeners}
          >
            <div className="relative h-full w-full [perspective:600px]">
              <div
                className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
                style={{
                  transform: isFaceDown ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <Image
                    src={card.art}
                    alt={card.name}
                    fill
                    className={`object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.35)] ${
                      isTargetable || (isTargetable && isOver)
                        ? "brightness-110"
                        : isUnavailableTarget
                          ? "brightness-[0.8]"
                          : ""
                    }`}
                    unoptimized
                  />
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <Image
                    src="/assets/card-back.svg"
                    alt={`${card.name} face-down`}
                    fill
                    className="object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/18 bg-[radial-gradient(circle_at_top,#1d3567_0%,#11192f_55%,#0a0d18_100%)] px-2 text-center">
          <p className="text-[10px] font-semibold tracking-[0.1em] text-white/45 uppercase md:text-[11px]">
            {slotLabel}
          </p>
        </div>
      )}
      {card && showAttackIcon ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectAttacker(slotIndex);
          }}
          disabled={!canAttack}
          className={`absolute right-[8px] top-[8px] z-10 inline-flex min-h-[32px] min-w-[32px] items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-white shadow-lg ${
            canAttack
              ? "bg-[#010b7b]/95"
              : "cursor-not-allowed bg-[#3a4267]/90 opacity-60"
          }`}
          aria-label={`Attack with ${card.name}`}
        >
          <PracticeAttackIcon />
          <span className="hidden sm:inline">Atk</span>
        </button>
      ) : null}
      {card && isAbilityPopupOpen && abilityPopupContent ? (
        <AbilityCardPopup
          content={abilityPopupContent}
          onActivate={() => onActivateAbilityPopup(slotIndex)}
          onClose={onCloseAbilityPopup}
        />
      ) : null}
    </div>
  );
}

function ArenaGrid({
  side,
  title,
  battleState,
  cards,
  directTargetable,
  playerTargetable,
  onDirectAttack,
  onPlayerTargetSelect,
  onInspect,
  selectedAttackerSlot,
  attackableSlots,
  abilityDragSlots,
  selectionMode,
  targetableKeys,
  targetableOwners,
  activeAbilitySlot,
  getAbilityPopupContent,
  onSelectAttacker,
  onOpenAbilityPopup,
  onActivateAbilityPopup,
  onCloseAbilityPopup,
  onAttackTarget,
}: {
  side: Owner;
  title: string;
  battleState: BattleState | null;
  cards: Array<BattleUnit | null>;
  directTargetable: boolean;
  playerTargetable: boolean;
  onDirectAttack: () => void;
  onPlayerTargetSelect: () => void;
  onInspect: (card: BattleUnit) => void;
  selectedAttackerSlot: number | null;
  attackableSlots: Set<number>;
  abilityDragSlots: Set<number>;
  selectionMode: AbilitySelectionMode;
  targetableKeys: Set<string>;
  targetableOwners: Set<Owner>;
  activeAbilitySlot: number | null;
  getAbilityPopupContent: (card: BattleUnit) => CardAbilityPopupContent | null;
  onSelectAttacker: (slotIndex: number) => void;
  onOpenAbilityPopup: (slotIndex: number) => void;
  onActivateAbilityPopup: (slotIndex: number) => void;
  onCloseAbilityPopup: () => void;
  onAttackTarget: (target: BattleTarget) => void;
}) {
  const mobileOrder =
    side === "player" ? PLAYER_MOBILE_ORDER : BOT_MOBILE_ORDER;
  const desktopOrder =
    side === "player" ? PLAYER_DESKTOP_ORDER : BOT_DESKTOP_ORDER;
  const hp = battleState?.players[side].hp ?? 40;
  const dimUnavailableTargets =
    selectionMode !== null && targetableOwners.has(side);
  const header = (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#78a8ff] uppercase">
          {side === "player" ? "Player Side" : "Bot Side"}
        </p>
        <h2 className="mt-2 text-[22px] font-bold text-white">{title}</h2>
      </div>
      {side === "bot" ? (
        <DirectAttackPanel
          title={`Leader HP ${hp}`}
          subtitle={
            directTargetable
              ? "Frontline is open. Attack here."
              : "Clear frontline first."
          }
          directTargetable={directTargetable}
          attackSelectionActive={selectionMode === "attack" && side === "bot"}
          nodeId={getBattleLeaderNodeId(side)}
          onAttack={onDirectAttack}
        />
      ) : playerTargetable ? (
        <button
          type="button"
          data-battle-node={getBattleLeaderNodeId(side)}
          onClick={onPlayerTargetSelect}
          className={`rounded-[16px] px-4 py-3 text-left ${
            selectionMode === "ability"
              ? "border border-[#d8b75e] bg-[#37280f] shadow-[0_0_0_2px_rgba(216,183,94,0.28)]"
              : "border border-[#7dc4ff] bg-[#0d2b63] shadow-[0_0_0_2px_rgba(125,196,255,0.24)]"
          }`}
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
            Leader HP
          </p>
          <p className="mt-1 text-sm font-bold text-white">{hp}</p>
        </button>
      ) : (
        <div
          data-battle-node={getBattleLeaderNodeId(side)}
          className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-left"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
            Leader HP
          </p>
          <p className="mt-1 text-sm font-bold text-white">{hp}</p>
        </div>
      )}
    </div>
  );

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-sm md:p-5">
      {side === "player" ? (
        <div className="hidden lg:block">{header}</div>
      ) : (
        header
      )}

      <div className="grid grid-cols-4 gap-3 md:gap-4 lg:hidden">
        {mobileOrder.map((slotIndex) => (
          <ArenaCard
            key={`${side}-mobile-${slotIndex}`}
            card={cards[slotIndex] ?? null}
            slotIndex={slotIndex}
            side={side}
            phase={battleState?.phase ?? "Lobby"}
            activePlayer={battleState?.activePlayer ?? "none"}
            canAttack={attackableSlots.has(slotIndex)}
            dragMode={
              side === "player"
                ? abilityDragSlots.has(slotIndex)
                  ? "ability"
                  : attackableSlots.has(slotIndex)
                    ? "attack"
                    : null
                : null
            }
            isSelectedAttacker={selectedAttackerSlot === slotIndex}
            isTargetable={targetableKeys.has(
              targetKey({ type: "slot", owner: side, slotIndex }),
            )}
            selectionMode={selectionMode}
            dimUnavailableTargets={dimUnavailableTargets}
            isRotated={
              cards[slotIndex]
                ? shouldRotateBattleCard(cards[slotIndex], battleState)
                : false
            }
            isFaceDown={
              cards[slotIndex]
                ? shouldFlipCardFaceDown(cards[slotIndex])
                : false
            }
            abilityCardState={
              cards[slotIndex]
                ? getAbilityCardState(
                    battleState,
                    cards[slotIndex],
                    side,
                    battleState?.phase ?? "Lobby",
                    battleState?.activePlayer ?? "none",
                    selectionMode,
                  )
                : null
            }
            isAbilityPopupOpen={
              side === "player" && activeAbilitySlot === slotIndex
            }
            abilityPopupContent={
              side === "player" && cards[slotIndex]
                ? getAbilityPopupContent(cards[slotIndex])
                : null
            }
            onInspect={onInspect}
            onSelectAttacker={onSelectAttacker}
            onOpenAbilityPopup={onOpenAbilityPopup}
            onActivateAbilityPopup={onActivateAbilityPopup}
            onCloseAbilityPopup={onCloseAbilityPopup}
            onAttackTarget={onAttackTarget}
          />
        ))}
      </div>

      {side === "player" ? (
        <div className="mt-4 lg:hidden">{header}</div>
      ) : null}

      <div className="hidden grid-cols-3 gap-3 md:gap-4 lg:grid">
        {desktopOrder.map((slotIndex) => (
          <ArenaCard
            key={`${side}-desktop-${slotIndex}`}
            card={cards[slotIndex] ?? null}
            slotIndex={slotIndex}
            side={side}
            phase={battleState?.phase ?? "Lobby"}
            activePlayer={battleState?.activePlayer ?? "none"}
            canAttack={attackableSlots.has(slotIndex)}
            dragMode={
              side === "player"
                ? abilityDragSlots.has(slotIndex)
                  ? "ability"
                  : attackableSlots.has(slotIndex)
                    ? "attack"
                    : null
                : null
            }
            isSelectedAttacker={selectedAttackerSlot === slotIndex}
            isTargetable={targetableKeys.has(
              targetKey({ type: "slot", owner: side, slotIndex }),
            )}
            selectionMode={selectionMode}
            dimUnavailableTargets={dimUnavailableTargets}
            isRotated={
              cards[slotIndex]
                ? shouldRotateBattleCard(cards[slotIndex], battleState)
                : false
            }
            isFaceDown={
              cards[slotIndex]
                ? shouldFlipCardFaceDown(cards[slotIndex])
                : false
            }
            abilityCardState={
              cards[slotIndex]
                ? getAbilityCardState(
                    battleState,
                    cards[slotIndex],
                    side,
                    battleState?.phase ?? "Lobby",
                    battleState?.activePlayer ?? "none",
                    selectionMode,
                  )
                : null
            }
            isAbilityPopupOpen={
              side === "player" && activeAbilitySlot === slotIndex
            }
            abilityPopupContent={
              side === "player" && cards[slotIndex]
                ? getAbilityPopupContent(cards[slotIndex])
                : null
            }
            onInspect={onInspect}
            onSelectAttacker={onSelectAttacker}
            onOpenAbilityPopup={onOpenAbilityPopup}
            onActivateAbilityPopup={onActivateAbilityPopup}
            onCloseAbilityPopup={onCloseAbilityPopup}
            onAttackTarget={onAttackTarget}
          />
        ))}
      </div>
    </section>
  );
}

function PracticeDeckModal({
  open,
  savedDecks,
  wallet,
  isConnecting,
  walletError,
  openPicker,
  onClose,
  onSelectDeck,
}: {
  open: boolean;
  savedDecks: SavedDeck[];
  wallet: ReturnType<typeof useWallet>["wallet"];
  isConnecting: boolean;
  walletError: string | null;
  openPicker: ReturnType<typeof useWallet>["openPicker"];
  onClose: () => void;
  onSelectDeck: (deck: SavedDeck) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close deck selection modal"
      />

      <div className="relative z-10 flex max-h-[min(88vh,780px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-[#32406b] bg-[#0d1330] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="border-b border-white/10 px-5 py-5 md:px-7">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-[#78a8ff] uppercase">
            Practice Setup
          </p>
          <h2 className="mt-2 text-[28px] font-bold text-white">
            Choose Your Deck
          </h2>
          <p className="mt-3 max-w-[640px] text-sm leading-[22px] text-white/58">
            Pick one of your saved decks to place on the left side of the arena.
            The bot deck is generated automatically and still follows the same
            deck-building limits.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
          {!wallet ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold text-white">
                Connect a wallet first
              </p>
              <p className="mt-3 text-sm text-white/55">
                Saved practice decks are loaded from the wallet-linked deck
                builder storage.
              </p>
              <button
                type="button"
                onClick={openPicker}
                disabled={isConnecting}
                className="relative mx-auto mt-5 block w-full max-w-[181px] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Image
                  src="/assets/connect-wallet-btn.svg"
                  alt="Connect Wallet"
                  width={181}
                  height={46}
                  className="h-auto w-full"
                />
                {isConnecting ? (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                    Connecting...
                  </span>
                ) : null}
              </button>
              {walletError ? (
                <p className="mx-auto mt-3 max-w-[260px] text-xs leading-tight text-red-400">
                  {walletError}
                </p>
              ) : null}
            </div>
          ) : savedDecks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
              <p className="text-lg font-semibold text-white">
                No saved decks yet
              </p>
              <p className="mt-3 text-sm text-white/55">
                Build and save a deck first before starting a practice match.
              </p>
              <Link
                href="/deck"
                className="mt-5 inline-flex rounded-full bg-[#0f56d9] px-5 py-3 text-sm font-semibold text-white"
              >
                Go to Deck Builder
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedDecks.map((deck) => {
                const previewCards = deck.cards.filter(
                  (card): card is PracticeCard => card !== null,
                );

                return (
                  <button
                    key={deck.id}
                    type="button"
                    onClick={() => onSelectDeck(deck)}
                    className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#151d3a_0%,#0d1327_100%)] p-4 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#78a8ff] uppercase">
                          Deck {deck.id}
                        </p>
                        <h3 className="mt-2 truncate text-lg font-bold text-white">
                          {deck.name}
                        </h3>
                      </div>
                      <p className="text-xs text-white/45">
                        {previewCards.length}/{TOTAL_SLOTS}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {previewCards.slice(0, 4).map((card) => (
                        <div
                          key={`${deck.id}-${card.id}`}
                          className="relative aspect-[148/204] overflow-hidden rounded-[12px] border border-white/10 bg-white/5"
                        >
                          <Image
                            src={card.art}
                            alt={card.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeResultModal({
  open,
  winner,
  onClose,
  onChooseDeck,
}: {
  open: boolean;
  winner: Owner | null;
  onClose: () => void;
  onChooseDeck: () => void;
}) {
  if (!open || !winner) {
    return null;
  }

  const didPlayerWin = winner === "player";

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close match result modal"
      />

      <div className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-[#32406b] bg-[#0d1330] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-7">
        <p className="text-[12px] font-semibold tracking-[0.14em] text-[#78a8ff] uppercase">
          Practice Result
        </p>
        <h2 className="mt-2 text-[30px] font-bold text-white">
          {didPlayerWin ? "Victory" : "Defeat"}
        </h2>
        <p className="mt-3 text-sm leading-[22px] text-white/62">
          {didPlayerWin
            ? "You won the practice match. Choose another saved deck or stay on the board to review the result."
            : "You lost the practice match. Review the board or choose another saved deck and try again."}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onChooseDeck}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0f56d9] px-5 py-3 text-sm font-semibold text-white"
          >
            Choose Deck
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/78 transition-colors hover:bg-white/10 hover:text-white"
          >
            Keep Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

function AttackDragOverlay({ card }: { card: BattleUnit }) {
  return (
    <div className="relative aspect-[148/204] w-[120px] md:w-[148px]">
      <Image
        src={card.art}
        alt={card.name}
        fill
        className="object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
        unoptimized
      />
    </div>
  );
}

function BotAttackOverlay({
  animation,
}: {
  animation: BotAttackAnimationState | null;
}) {
  if (!animation) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed z-[120]"
      style={{
        left: animation.from.left,
        top: animation.from.top,
        width: animation.from.width,
        height: animation.from.height,
        transform: `translate(${animation.translateX}px, ${animation.translateY}px)`,
        transition: `transform ${BOT_ATTACK_TRAVEL_MS}ms linear`,
      }}
    >
      <Image
        src={animation.card.art}
        alt={animation.card.name}
        fill
        className="object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.45)]"
        unoptimized
      />
    </div>
  );
}

function BattleLogPanel({
  logs,
  winner,
  pendingAbilityMode,
  selectedAttackerSlot,
  phase,
  activePlayer,
}: {
  logs: string[];
  winner: Owner | null;
  pendingAbilityMode: PendingUnitAbility["kind"] | null;
  selectedAttackerSlot: number | null;
  phase: BattleState["phase"] | "Lobby";
  activePlayer: Owner | "none";
}) {
  const instructions = winner
    ? "Match finished. Battle logs clear after every completed practice game."
    : pendingAbilityMode === "startTurnAura"
      ? "Choose any friendly card or your leader for Bulbasaur's free heal."
      : pendingAbilityMode === "manual"
        ? "Choose the highlighted target for the selected ability. Main Phase abilities spend mana and can only be used once."
        : selectedAttackerSlot !== null
          ? "Highlighted enemy slots are valid targets. Drag your card onto one, or tap a highlighted target."
          : activePlayer !== "player"
            ? "Wait for the bot turn to finish before choosing an attacker."
            : phase !== "Battle"
              ? "Move into Battle Phase first. Attack icons activate during Battle Phase."
              : "Tap a blue attack icon or drag a ready player card onto a highlighted enemy.";
  const displayedLogs = winner
    ? ["Match complete. Start another practice match when you're ready."]
    : logs.length > 0
      ? logs
      : ["Select a deck to begin practice."];

  return (
    <section className="mt-5 rounded-[24px] border border-white/10 bg-[#0b1024]/90 p-4 backdrop-blur-sm md:p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
          Battle Log
        </p>
        <p className="max-w-[560px] text-right text-xs leading-5 text-white/55">
          {instructions}
        </p>
      </div>
      <div className="mt-4 max-h-[240px] overflow-y-auto rounded-[18px] border border-white/10 bg-white/5 p-4">
        <div className="space-y-2">
          {displayedLogs.map((entry, index) => (
            <p
              key={`${index}-${entry}`}
              className="text-xs leading-5 text-white/62"
            >
              {entry}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PracticePageContent() {
  const { wallet, isConnecting, error, openPicker } = useWallet();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [tutorialPage, setTutorialPage] = useState(0);
  const [pendingSetup, setPendingSetup] = useState<PendingPracticeSetup | null>(
    null,
  );
  const [selectedAttackerSlot, setSelectedAttackerSlot] = useState<
    number | null
  >(null);
  const [activeAbilitySlot, setActiveAbilitySlot] = useState<number | null>(
    null,
  );
  const [pendingAbility, setPendingAbility] =
    useState<PendingUnitAbility | null>(null);
  const [activeAttackDrag, setActiveAttackDrag] =
    useState<AttackDragData | null>(null);
  const [inspectedCard, setInspectedCard] = useState<BattleUnit | null>(null);
  const [isResolvingBotTurn, setIsResolvingBotTurn] = useState(false);
  const [queuedPlayerTurnState, setQueuedPlayerTurnState] =
    useState<BattleState | null>(null);
  const [liveEventFeed, setLiveEventFeed] = useState<string[]>([]);
  const [liveBannerText, setLiveBannerText] = useState<string | null>(null);
  const [botAttackAnimation, setBotAttackAnimation] =
    useState<BotAttackAnimationState | null>(null);
  const [showAttackLimitReached, setShowAttackLimitReached] = useState(false);
  const botTurnTokenRef = useRef(0);
  const attackLimitTimerRef = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const savedDecks = useMemo(
    () => loadSavedDecks(wallet?.address ?? null),
    [wallet?.address],
  );

  const playerCards = battleState?.board.player ?? EMPTY_BATTLE_SLOTS;
  const botCards = battleState?.board.bot ?? EMPTY_BATTLE_SLOTS;
  const attackableSlots = useMemo(
    () => new Set(battleState ? getAttackableSlots(battleState, "player") : []),
    [battleState],
  );
  const abilityDragSlots = useMemo(() => {
    if (
      !battleState ||
      battleState.winner ||
      battleState.activePlayer !== "player" ||
      battleState.phase !== "Main"
    ) {
      return new Set<number>();
    }

    return new Set(
      playerCards.flatMap((card, slotIndex) =>
        card &&
        supportsHealDrag(card) &&
        (canActivateUnitAbility(battleState, "player", slotIndex) ||
          canActivateStartTurnAura(battleState, "player", slotIndex))
          ? [slotIndex]
          : [],
      ),
    );
  }, [battleState, playerCards]);

  const validTargets = useMemo(
    () =>
      battleState && selectedAttackerSlot !== null
        ? getValidAttackTargets(battleState, "player", selectedAttackerSlot)
        : [],
    [battleState, selectedAttackerSlot],
  );
  const abilityTargetState = useMemo(
    () =>
      battleState && pendingAbility
        ? pendingAbility.kind === "startTurnAura"
          ? getStartTurnAuraTargetState(
              battleState,
              "player",
              pendingAbility.slotIndex,
              pendingAbility.targets,
            )
          : getUnitAbilityTargetState(
              battleState,
              "player",
              pendingAbility.slotIndex,
              pendingAbility.targets,
            )
        : null,
    [battleState, pendingAbility],
  );
  const interactionTargets = abilityTargetState?.requiresTargets
    ? abilityTargetState.options
    : validTargets;

  const targetableKeys = useMemo(
    () => new Set(interactionTargets.map((target) => targetKey(target))),
    [interactionTargets],
  );
  const targetableOwners = useMemo(
    () =>
      new Set(
        interactionTargets
          .filter(
            (target): target is Extract<BattleTarget, { type: "slot" }> =>
              target.type === "slot",
          )
          .map((target) => target.owner),
      ),
    [interactionTargets],
  );
  const selectionMode: AbilitySelectionMode = pendingAbility
    ? "ability"
    : selectedAttackerSlot !== null
      ? "attack"
      : null;
  const directTargetable = !pendingAbility && targetableKeys.has("bot-player");
  const playerTargetable = Boolean(
    pendingAbility && targetableKeys.has("player-player"),
  );
  const effectiveAttackableSlots = pendingAbility
    ? new Set<number>()
    : attackableSlots;
  const attacksUsedThisTurn =
    battleState?.players.player.attacksUsedThisTurn ?? 0;
  const attackLimitReached = battleState
    ? battleState.activePlayer === "player" &&
      battleState.phase === "Battle" &&
      attacksUsedThisTurn >= MAX_ATTACKS_PER_TURN
    : false;
  const visibleAbilitySlot =
    battleState &&
    battleState.activePlayer === "player" &&
    battleState.phase === "Main" &&
    !pendingAbility
      ? activeAbilitySlot
      : null;
  const playerLeaderCanTrigger =
    battleState &&
    inspectedCard?.owner === "player" &&
    inspectedCard.slotIndex === 0
      ? canUseLeaderAbility(battleState, "player")
      : false;
  const playerUnitAbilityCanTrigger =
    battleState && inspectedCard?.owner === "player"
      ? canActivateUnitAbility(
          battleState,
          "player",
          inspectedCard.slotIndex,
        ) ||
        canActivateStartTurnAura(battleState, "player", inspectedCard.slotIndex)
      : false;
  const getAbilityPopupContent = (card: BattleUnit) =>
    battleState ? getCardAbilityPopupContent(battleState, card) : null;

  useEffect(() => {
    if (
      !battleState ||
      battleState.activePlayer !== "player" ||
      battleState.phase !== "Battle" ||
      selectedAttackerSlot === null ||
      !attackableSlots.has(selectedAttackerSlot)
    ) {
      const timer = window.setTimeout(() => {
        setSelectedAttackerSlot(null);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [attackableSlots, battleState, selectedAttackerSlot]);

  useEffect(() => {
    if (
      !pendingAbility ||
      !battleState ||
      battleState.activePlayer !== "player" ||
      battleState.phase !== "Main" ||
      battleState.winner
    ) {
      const timer = window.setTimeout(() => {
        setPendingAbility(null);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [battleState, pendingAbility]);

  useEffect(() => {
    return () => {
      botTurnTokenRef.current += 1;
      if (attackLimitTimerRef.current !== null) {
        window.clearTimeout(attackLimitTimerRef.current);
      }
    };
  }, []);

  const openTutorial = () => {
    setTutorialPage(0);
    setShowTutorialModal(true);
  };

  const showAttackLimitMessage = () => {
    setShowAttackLimitReached(true);
    if (attackLimitTimerRef.current !== null) {
      window.clearTimeout(attackLimitTimerRef.current);
    }
    attackLimitTimerRef.current = window.setTimeout(() => {
      setShowAttackLimitReached(false);
      attackLimitTimerRef.current = null;
    }, 1600);
  };

  const openAbilityPopup = (slotIndex: number) => {
    setSelectedAttackerSlot(null);
    setInspectedCard(null);
    setActiveAbilitySlot((current) =>
      current === slotIndex ? null : slotIndex,
    );
  };

  const pushLiveEventFeed = (entries: string[]) => {
    if (entries.length === 0) {
      return;
    }

    setLiveEventFeed((current) => [...current, ...entries].slice(-6));
  };

  const commitPlayerStateUpdate = (
    currentState: BattleState,
    nextState: BattleState,
    fallbackEntries: string[] = [],
  ) => {
    if (nextState === currentState) {
      return false;
    }

    const newEntries = getNewLogEntries(currentState.logs, nextState.logs);
    const feedEntries = newEntries.length > 0 ? newEntries : fallbackEntries;

    setBattleState(nextState);
    if (nextState.winner && currentState.winner !== nextState.winner) {
      setShowResultModal(true);
    }
    if (feedEntries.length > 0) {
      pushLiveEventFeed(feedEntries);
      setLiveBannerText(feedEntries[feedEntries.length - 1] ?? null);
    }

    return true;
  };

  const handlePlayerLeaderAbility = () => {
    if (!battleState) {
      return;
    }

    const leader = battleState.board.player[0];
    const nextState = activateLeaderAbility(battleState, "player");
    commitPlayerStateUpdate(
      battleState,
      nextState,
      leader
        ? [`${leader.name} used leader ability.`]
        : ["Leader ability used."],
    );
    setActiveAbilitySlot(null);
  };

  const playBotAttackAnimation = async (
    action: Extract<BotTurnAction, { type: "attack" }>,
    state: BattleState,
    token: number,
  ) => {
    const card = state.board.bot[action.slotIndex];
    if (!card) {
      return;
    }

    const sourceRect = getVisibleNodeRect(
      getBattleSlotNodeId("bot", action.slotIndex),
    );
    const targetRect = getVisibleNodeRect(getBattleTargetNodeId(action.target));
    if (!sourceRect || !targetRect) {
      await wait(BOT_ATTACK_TRAVEL_MS * 2);
      return;
    }

    const centerDeltaX =
      targetRect.left +
      targetRect.width / 2 -
      (sourceRect.left + sourceRect.width / 2);
    const centerDeltaY =
      targetRect.top +
      targetRect.height / 2 -
      (sourceRect.top + sourceRect.height / 2);

    setBotAttackAnimation({
      card,
      from: {
        left: sourceRect.left,
        top: sourceRect.top,
        width: sourceRect.width,
        height: sourceRect.height,
      },
      translateX: 0,
      translateY: 0,
    });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        if (botTurnTokenRef.current !== token) {
          resolve();
          return;
        }

        setBotAttackAnimation((current) =>
          current
            ? {
                ...current,
                translateX: centerDeltaX,
                translateY: centerDeltaY,
              }
            : current,
        );
        resolve();
      });
    });

    await wait(BOT_ATTACK_TRAVEL_MS);
    if (botTurnTokenRef.current !== token) {
      return;
    }

    setBotAttackAnimation((current) =>
      current
        ? {
            ...current,
            translateX: 0,
            translateY: 0,
          }
        : current,
    );

    await wait(BOT_ATTACK_TRAVEL_MS);
    if (botTurnTokenRef.current !== token) {
      return;
    }

    setBotAttackAnimation(null);
  };

  const runBotTurnSequence = (initialState: BattleState) => {
    if (
      initialState.activePlayer !== "bot" ||
      initialState.winner ||
      queuedPlayerTurnState ||
      isResolvingBotTurn
    ) {
      return;
    }

    const token = botTurnTokenRef.current + 1;
    botTurnTokenRef.current = token;

    setIsResolvingBotTurn(true);
    setSelectedAttackerSlot(null);
    setActiveAbilitySlot(null);
    setPendingAbility(null);
    setActiveAttackDrag(null);

    void (async () => {
      let current = initialState;

      setLiveBannerText((currentBanner) => currentBanner ?? "Opponent turn.");
      await wait(220);

      while (
        botTurnTokenRef.current === token &&
        !current.winner &&
        current.activePlayer === "bot"
      ) {
        const action = getNextBotTurnAction(current);
        if (!action) {
          break;
        }

        setLiveBannerText(action.summary);

        if (action.type === "attack") {
          await playBotAttackAnimation(action, current, token);
        } else {
          await wait(BOT_ACTION_DELAY_MS);
        }

        if (botTurnTokenRef.current !== token) {
          return;
        }

        const nextState = applyBotTurnAction(current, action);
        if (action.type === "endTurn") {
          pushLiveEventFeed([action.summary]);
          setLiveBannerText(action.summary);
          setQueuedPlayerTurnState(nextState);
          break;
        }

        const newEntries = getNewLogEntries(current.logs, nextState.logs);
        const feedEntries =
          newEntries.length > 0 ? newEntries : [action.summary];
        pushLiveEventFeed(feedEntries);
        setLiveBannerText(
          feedEntries[feedEntries.length - 1] ?? action.summary,
        );

        setBattleState(nextState);
        if (nextState.winner && current.winner !== nextState.winner) {
          setShowResultModal(true);
        }
        current = nextState;
        await wait(BOT_ACTION_DELAY_MS);
      }

      if (botTurnTokenRef.current === token) {
        setBotAttackAnimation(null);
        setIsResolvingBotTurn(false);
      }
    })();
  };

  const commitAbilityTarget = (
    kind: PendingUnitAbility["kind"],
    slotIndex: number,
    selectedTargets: BattleTarget[],
    target: BattleTarget,
  ) => {
    if (!battleState) {
      return;
    }

    const nextTargets = [...selectedTargets, target];
    const nextTargetState =
      kind === "startTurnAura"
        ? getStartTurnAuraTargetState(
            battleState,
            "player",
            slotIndex,
            nextTargets,
          )
        : getUnitAbilityTargetState(
            battleState,
            "player",
            slotIndex,
            nextTargets,
          );

    if (nextTargetState.complete) {
      if (kind === "startTurnAura") {
        const isFullHealthTarget =
          target.type === "player"
            ? battleState.players.player.hp >= 40
            : (() => {
                const unit = battleState.board[target.owner][target.slotIndex];
                return unit
                  ? unit.currentHP >= getBattleUnitMaxHp(unit)
                  : false;
              })();

        if (isFullHealthTarget) {
          const sourceCard = battleState.board.player[slotIndex];
          const nextState = activateStartTurnAura(
            battleState,
            "player",
            slotIndex,
            nextTargets,
          );
          commitPlayerStateUpdate(
            battleState,
            nextState,
            sourceCard
              ? [`${sourceCard.name} heal skipped.`]
              : ["Heal skipped."],
          );
          setPendingAbility(null);
          return;
        }
      }

      const sourceCard = battleState.board.player[slotIndex];
      const nextState =
        kind === "startTurnAura"
          ? activateStartTurnAura(battleState, "player", slotIndex, nextTargets)
          : activateUnitAbility(battleState, "player", slotIndex, nextTargets);
      commitPlayerStateUpdate(
        battleState,
        nextState,
        sourceCard
          ? [
              kind === "startTurnAura"
                ? `${sourceCard.name} used its free heal.`
                : `${sourceCard.name} used ${formatAbilityLabel(sourceCard.ability?.type ?? "Ability")}.`,
            ]
          : ["Ability used."],
      );
      setPendingAbility(null);
      return;
    }

    setPendingAbility({
      kind,
      slotIndex,
      targets: nextTargets,
    });
  };

  const handleAttackDragStart = (event: DragStartEvent) => {
    if (pendingAbility) {
      setActiveAttackDrag(null);
      return;
    }

    const dragData = event.active.data.current as AttackDragData | undefined;
    if (!dragData || dragData.type !== "battle-card") {
      setActiveAttackDrag(null);
      return;
    }

    setActiveAttackDrag(dragData);

    if (dragData.mode === "ability") {
      setSelectedAttackerSlot(null);
      setActiveAbilitySlot(null);
      setPendingAbility({
        kind: "manual",
        slotIndex: dragData.slotIndex,
        targets: [],
      });
      return;
    }

    setPendingAbility(null);
    setActiveAbilitySlot(null);
    setSelectedAttackerSlot(dragData.slotIndex);
  };

  const handleAttackDragEnd = (event: DragEndEvent) => {
    const dragData = event.active.data.current as AttackDragData | undefined;
    const overId = event.over ? String(event.over.id) : null;
    setActiveAttackDrag(null);

    if (!dragData) {
      return;
    }

    if (!overId) {
      if (dragData.mode === "ability") {
        setPendingAbility(null);
      }
      return;
    }

    const target = parseBattleTargetDropId(overId);
    if (!target) {
      if (dragData.mode === "ability") {
        setPendingAbility(null);
      }
      return;
    }

    if (dragData.mode === "ability") {
      commitAbilityTarget("manual", dragData.slotIndex, [], target);
      return;
    }

    if (pendingAbility) {
      return;
    }

    if (!battleState) {
      return;
    }

    const attacker = battleState.board.player[dragData.slotIndex];
    const nextState = executeAttack(
      battleState,
      "player",
      dragData.slotIndex,
      target,
    );
    if (
      nextState !== battleState &&
      nextState.players.player.attacksUsedThisTurn >= MAX_ATTACKS_PER_TURN
    ) {
      showAttackLimitMessage();
    }
    commitPlayerStateUpdate(
      battleState,
      nextState,
      attacker
        ? [
            `${attacker.name} attacked ${getBattleTargetLabel(battleState, target)}.`,
          ]
        : ["Attack resolved."],
    );
    setSelectedAttackerSlot(null);
  };

  const handleAttackDragCancel = () => {
    if (activeAttackDrag?.mode === "ability") {
      setPendingAbility(null);
    }
    setActiveAttackDrag(null);
  };

  const startBattleFromPendingSetup = (setup: PendingPracticeSetup) => {
    setSelectedDeck(setup.deck);
    setBattleState(initializeBattleState(setup.playerCards, setup.botCards));
    setPendingSetup(null);
    setSelectedAttackerSlot(null);
    setActiveAbilitySlot(null);
    setPendingAbility(null);
    setInspectedCard(null);
    setIsResolvingBotTurn(false);
    setShowResultModal(false);
    setQueuedPlayerTurnState(null);
    setLiveEventFeed(["Practice match started. Your turn 1 started."]);
    setLiveBannerText("Practice match started. Your turn 1 started.");
    setBotAttackAnimation(null);
  };

  const finishTutorial = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    }
    setShowTutorialModal(false);

    if (pendingSetup) {
      startBattleFromPendingSetup(pendingSetup);
    }
  };

  const handleDeckSelect = (deck: SavedDeck) => {
    const setup = {
      deck,
      playerCards: padDeck(deck.cards),
      botCards: generateBotDeck(),
    } satisfies PendingPracticeSetup;

    setShowDeckModal(false);
    if (
      typeof window !== "undefined" &&
      localStorage.getItem(TUTORIAL_STORAGE_KEY) !== "true"
    ) {
      setPendingSetup(setup);
      setTutorialPage(0);
      setShowTutorialModal(true);
      return;
    }

    startBattleFromPendingSetup(setup);
  };

  const beginAbilityActivation = (slotIndex: number) => {
    if (!battleState) {
      return;
    }

    const isStartTurnAura = canActivateStartTurnAura(
      battleState,
      "player",
      slotIndex,
    );
    setActiveAbilitySlot(null);
    const targetState = isStartTurnAura
      ? getStartTurnAuraTargetState(battleState, "player", slotIndex, [])
      : getUnitAbilityTargetState(battleState, "player", slotIndex, []);
    setSelectedAttackerSlot(null);
    setInspectedCard(null);

    if (targetState.complete && !targetState.requiresTargets) {
      const sourceCard = battleState.board.player[slotIndex];
      const nextState = isStartTurnAura
        ? activateStartTurnAura(battleState, "player", slotIndex, [])
        : activateUnitAbility(battleState, "player", slotIndex, []);
      commitPlayerStateUpdate(
        battleState,
        nextState,
        sourceCard
          ? [
              isStartTurnAura
                ? `${sourceCard.name} used its free heal.`
                : `${sourceCard.name} used ${formatAbilityLabel(sourceCard.ability?.type ?? "Ability")}.`,
            ]
          : ["Ability used."],
      );
      setPendingAbility(null);
      return;
    }

    if (targetState.options.length > 0) {
      setPendingAbility({
        kind: isStartTurnAura ? "startTurnAura" : "manual",
        slotIndex,
        targets: [],
      });
    }
  };

  const activateAbilityFromPopup = (slotIndex: number) => {
    if (!battleState) {
      return;
    }

    if (slotIndex === 0) {
      if (canUseLeaderAbility(battleState, "player")) {
        handlePlayerLeaderAbility();
      }
      return;
    }

    const card = battleState.board.player[slotIndex];
    if (!card) {
      return;
    }

    const popupContent = getCardAbilityPopupContent(battleState, card);
    if (!popupContent.hasActivation || !popupContent.canActivate) {
      return;
    }

    beginAbilityActivation(slotIndex);
  };

  const handleTargetSelection = (target: BattleTarget) => {
    if (pendingAbility) {
      commitAbilityTarget(
        pendingAbility.kind,
        pendingAbility.slotIndex,
        pendingAbility.targets,
        target,
      );
      return;
    }

    if (selectedAttackerSlot === null) {
      return;
    }

    if (!battleState) {
      return;
    }

    const attacker = battleState.board.player[selectedAttackerSlot];
    const nextState = executeAttack(
      battleState,
      "player",
      selectedAttackerSlot,
      target,
    );
    if (
      nextState !== battleState &&
      nextState.players.player.attacksUsedThisTurn >= MAX_ATTACKS_PER_TURN
    ) {
      showAttackLimitMessage();
    }
    commitPlayerStateUpdate(
      battleState,
      nextState,
      attacker
        ? [
            `${attacker.name} attacked ${getBattleTargetLabel(battleState, target)}.`,
          ]
        : ["Attack resolved."],
    );
    setSelectedAttackerSlot(null);
  };

  const actionLabel = !battleState
    ? "Start Practice"
    : battleState.winner
      ? "Choose Deck"
      : pendingAbility?.kind === "startTurnAura"
        ? "Choose Heal Target"
        : pendingAbility
          ? "Choose Ability Target"
          : queuedPlayerTurnState
            ? "Start Your Turn"
            : isResolvingBotTurn || battleState.activePlayer === "bot"
              ? "Opponent Turn..."
              : battleState.phase === "Main"
                ? "Start Battle Phase"
                : "End Turn";
  const actionButtonAsset =
    battleState && !battleState.winner
      ? "/assets/next_turn.svg"
      : "/assets/tournament-page/start_practice.svg";
  const actionDisabled = Boolean(
    battleState &&
    !battleState.winner &&
    (pendingAbility ||
      (battleState.activePlayer === "bot" && !queuedPlayerTurnState) ||
      isResolvingBotTurn),
  );
  const controlsPanel = (
    <div className="rounded-[24px] border border-white/10 bg-[#0b1024] p-4 text-left">
      <p className="text-[12px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
        Controls
      </p>
      <div className="mt-3 space-y-2 text-xs leading-5 text-white/62">
        <p>
          1. Use the center action button to move from Main Phase into Battle
          Phase.
        </p>
        <p>
          2. In Main Phase, click your card to open its skill popup and spend
          mana.
        </p>
        <p>
          3. Heal cards can also be dragged onto highlighted allies during Main
          Phase.
        </p>
        <p>
          4. In Battle Phase, click or drag a ready card onto a highlighted
          enemy.
        </p>
      </div>
    </div>
  );
  const handleOpenDeckModal = () => {
    setShowResultModal(false);
    setShowDeckModal(true);
  };
  const actionControls = (
    <>
      <motion.button
        type="button"
        onClick={() => {
          if (!battleState || battleState.winner) {
            handleOpenDeckModal();
            return;
          }

          if (queuedPlayerTurnState) {
            setBattleState(queuedPlayerTurnState);
            setQueuedPlayerTurnState(null);
            setActiveAbilitySlot(null);
            setLiveBannerText(
              `Your turn ${queuedPlayerTurnState.turn} started.`,
            );
            pushLiveEventFeed([
              `Your turn ${queuedPlayerTurnState.turn} started.`,
            ]);
            return;
          }

          if (battleState.activePlayer !== "player") {
            return;
          }

          if (battleState.phase === "Main") {
            setActiveAbilitySlot(null);
            const nextState = advanceToBattlePhase(battleState, "player");
            commitPlayerStateUpdate(battleState, nextState, [
              "Battle Phase started.",
            ]);
          } else {
            const nextState = endTurn(battleState);
            const newEntries = getNewLogEntries(
              battleState.logs,
              nextState.logs,
            );
            setBattleState(nextState);
            pushLiveEventFeed(
              newEntries.length > 0 ? newEntries : ["Opponent turn."],
            );
            setLiveBannerText(
              newEntries[newEntries.length - 1] ?? "Opponent turn.",
            );
            runBotTurnSequence(nextState);
          }
          setSelectedAttackerSlot(null);
          setActiveAbilitySlot(null);
          setPendingAbility(null);
        }}
        disabled={actionDisabled}
        className={`block w-full ${attackLimitReached ? "animate-pulse" : ""}`}
        whileHover={actionDisabled ? undefined : { scale: 1.04 }}
        whileTap={actionDisabled ? undefined : { scale: 0.96 }}
      >
        <Image
          src={actionButtonAsset}
          alt={actionLabel}
          width={250}
          height={60}
          className={`h-auto w-full ${actionDisabled ? "opacity-60" : ""}`}
        />
      </motion.button>
      <p className="text-center text-sm font-semibold text-white">
        {actionLabel}
      </p>
      {pendingAbility && pendingAbility.kind !== "startTurnAura" ? (
        <button
          type="button"
          onClick={() => {
            setPendingAbility(null);
            setActiveAbilitySlot(null);
          }}
          className="w-full rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          Cancel Ability
        </button>
      ) : null}
      {selectedAttackerSlot !== null ? (
        <button
          type="button"
          onClick={() => setSelectedAttackerSlot(null)}
          className="w-full rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
        >
          Cancel Attack
        </button>
      ) : null}
    </>
  );

  return (
    <PageBackground>
      <div className="bg-transparent py-10 font-sans">
        <div className="px-4 pb-4 pt-18 lg:hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-bold text-white">
                Training Grounds
              </h1>
              <p className="mt-3 text-sm text-white/55">
                Choose a saved deck, learn the battle flow, then pressure the
                bot.
              </p>
            </div>
            <PracticeTutorialButton compact onClick={openTutorial} />
          </div>
        </div>

        <div className="hidden w-full bg-transparent pb-0 pt-30 lg:block">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-6 px-4">
            <div className="mx-auto text-center">
              <h1 className="mb-4 text-7xl font-bold text-white">
                Training Grounds
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-center text-sm text-gray-400">
                Master your deck, test your strategy against the bot, and
                sharpen your skills before stepping into the arena. No WND
                required.
              </p>
            </div>
          </div>
          <div className="w-full overflow-hidden">
            <Image
              src="/assets/tournament-page/outline.svg"
              alt=""
              width={1600}
              height={120}
              className="pointer-events-none max-w-4xl lg:max-w-4xl xl:max-w-7xl"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-4 pb-2 lg:px-0 lg:py-12">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleAttackDragStart}
            onDragEnd={handleAttackDragEnd}
            onDragCancel={handleAttackDragCancel}
          >
            <div className="mt-10 space-y-4">
              {controlsPanel}
              <div className="rounded-[32px] border border-[#8085BD] bg-[linear-gradient(to_top,#120C35_8%,#143C87_45%,#13245E_98%)] px-4 py-5 md:px-6 md:py-6 lg:-mx-6 lg:mt-0 lg:w-[calc(100%+3rem)] xl:-mx-10 xl:w-[calc(100%+5rem)]">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] lg:items-center">
                  <div className="order-1 lg:order-3">
                    <ArenaGrid
                      side="bot"
                      title="Bot Deck"
                      battleState={battleState}
                      cards={botCards}
                      directTargetable={directTargetable}
                      playerTargetable={false}
                      onDirectAttack={() =>
                        handleTargetSelection({
                          type: "player",
                          owner: "bot",
                        })
                      }
                      onPlayerTargetSelect={() => undefined}
                      onInspect={setInspectedCard}
                      selectedAttackerSlot={selectedAttackerSlot}
                      attackableSlots={new Set<number>()}
                      abilityDragSlots={new Set<number>()}
                      selectionMode={selectionMode}
                      targetableKeys={targetableKeys}
                      targetableOwners={targetableOwners}
                      activeAbilitySlot={visibleAbilitySlot}
                      getAbilityPopupContent={getAbilityPopupContent}
                      onSelectAttacker={() => undefined}
                      onOpenAbilityPopup={() => undefined}
                      onActivateAbilityPopup={() => undefined}
                      onCloseAbilityPopup={() => undefined}
                      onAttackTarget={handleTargetSelection}
                    />
                  </div>

                  <div className="order-4 flex flex-col items-center justify-center gap-4 text-center lg:order-2">
                    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#9dc1ff] uppercase">
                      <span>Turn {battleState?.turn ?? 1}</span>
                      <span className="text-white/30">/</span>
                      <span>{battleState?.phase ?? "Lobby"}</span>
                    </div>
                    <div className="rounded-full border border-white/12 bg-white/6 px-6 py-2 text-[28px] font-black text-white/80">
                      VS
                    </div>
                    <div className="w-full rounded-[24px] border border-white/10 bg-white/6 p-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[12px] font-semibold tracking-[0.14em] text-[#9dc1ff] uppercase">
                          Battle Arena
                        </p>
                        <PracticeTutorialButton
                          compact
                          onClick={openTutorial}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <BattleCardStat
                          label="Player Leader HP"
                          value={String(battleState?.players.player.hp ?? 40)}
                        />
                        <BattleCardStat
                          label="Bot Leader HP"
                          value={String(battleState?.players.bot.hp ?? 40)}
                        />
                        <ManaBattleStat
                          label="Player Mana"
                          currentMana={battleState?.players.player.mana ?? 2}
                          manaMax={battleState?.players.player.manaMax ?? 7}
                        />
                        <ManaBattleStat
                          label="Bot Mana"
                          currentMana={battleState?.players.bot.mana ?? 2}
                          manaMax={battleState?.players.bot.manaMax ?? 7}
                        />
                        <BattleCardStat
                          label="Active"
                          value={
                            battleState
                              ? battleState.activePlayer === "player"
                                ? "Player"
                                : "Bot"
                              : "Lobby"
                          }
                        />
                        <BattleCardStat
                          label="Phase"
                          value={battleState?.phase ?? "Lobby"}
                        />
                      </div>
                      <div className="mt-4 rounded-[18px] border border-white/10 bg-[#0b1024] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
                            Attacks
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {`${attacksUsedThisTurn} / ${MAX_ATTACKS_PER_TURN}`}
                          </p>
                        </div>
                        {showAttackLimitReached ? (
                          <p className="mt-2 text-xs font-semibold text-[#ffcf6f]">
                            Attack limit reached.
                          </p>
                        ) : null}
                      </div>
                      <div className="mt-4 rounded-[18px] border border-white/10 bg-[#0b1024] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-semibold tracking-[0.12em] text-[#9dc1ff] uppercase">
                            Live Feed
                          </p>
                          {isResolvingBotTurn ? (
                            <span className="text-[11px] font-semibold tracking-[0.12em] text-[#ffb26b] uppercase">
                              Opponent Acting
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-white">
                          {liveBannerText ??
                            (battleState
                              ? battleState.activePlayer === "player"
                                ? "Your turn. Use abilities, attack, then pass with Next Turn."
                                : "Waiting for the opponent to act."
                              : "Select a deck to begin practice.")}
                        </p>
                        <div className="mt-3 max-h-[112px] overflow-y-auto rounded-[14px] border border-white/10 bg-white/5 p-3">
                          <div className="space-y-2">
                            {(liveEventFeed.length > 0
                              ? liveEventFeed.slice().reverse()
                              : [
                                  battleState
                                    ? "Battle feed updates here during opponent turns."
                                    : "No live events yet.",
                                ]
                            ).map((entry, index) => (
                              <p
                                key={`${index}-${entry}`}
                                className="text-xs leading-5 text-white/62"
                              >
                                {entry}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 hidden space-y-3 lg:block">
                        {actionControls}
                      </div>
                    </div>
                  </div>

                  <div className="order-2 rounded-[24px] border border-white/10 bg-white/6 p-4 text-center lg:hidden">
                    <div className="space-y-3">{actionControls}</div>
                  </div>

                  <div className="order-3 lg:order-1">
                    <ArenaGrid
                      side="player"
                      title={selectedDeck?.name ?? "Saved Deck"}
                      battleState={battleState}
                      cards={playerCards}
                      directTargetable={false}
                      playerTargetable={playerTargetable}
                      onDirectAttack={() => undefined}
                      onPlayerTargetSelect={() =>
                        handleTargetSelection({
                          type: "player",
                          owner: "player",
                        })
                      }
                      onInspect={setInspectedCard}
                      selectedAttackerSlot={selectedAttackerSlot}
                      attackableSlots={effectiveAttackableSlots}
                      abilityDragSlots={abilityDragSlots}
                      selectionMode={selectionMode}
                      targetableKeys={targetableKeys}
                      targetableOwners={targetableOwners}
                      activeAbilitySlot={visibleAbilitySlot}
                      getAbilityPopupContent={getAbilityPopupContent}
                      onSelectAttacker={(slotIndex) =>
                        setSelectedAttackerSlot((current) =>
                          current === slotIndex ? null : slotIndex,
                        )
                      }
                      onOpenAbilityPopup={openAbilityPopup}
                      onActivateAbilityPopup={activateAbilityFromPopup}
                      onCloseAbilityPopup={() => setActiveAbilitySlot(null)}
                      onAttackTarget={handleTargetSelection}
                    />
                  </div>
                </div>
              </div>
            </div>

            <BattleLogPanel
              logs={battleState?.logs ?? []}
              winner={battleState?.winner ?? null}
              pendingAbilityMode={pendingAbility?.kind ?? null}
              selectedAttackerSlot={selectedAttackerSlot}
              phase={battleState?.phase ?? "Lobby"}
              activePlayer={battleState?.activePlayer ?? "none"}
            />

            <DragOverlay>
              {activeAttackDrag?.card ? (
                <AttackDragOverlay card={activeAttackDrag.card} />
              ) : null}
            </DragOverlay>
            <BotAttackOverlay animation={botAttackAnimation} />
          </DndContext>
        </div>

        {inspectedCard ? (
          <PracticeMobileCardDetail
            card={inspectedCard}
            onClose={() => setInspectedCard(null)}
            canUseLeader={Boolean(playerLeaderCanTrigger)}
            canUseAbility={Boolean(playerUnitAbilityCanTrigger)}
            onUseAbility={() => beginAbilityActivation(inspectedCard.slotIndex)}
            onUseLeaderAbility={handlePlayerLeaderAbility}
          />
        ) : null}

        <PracticeDeckModal
          open={showDeckModal}
          savedDecks={savedDecks}
          wallet={wallet}
          isConnecting={isConnecting}
          walletError={error}
          openPicker={openPicker}
          onClose={() => setShowDeckModal(false)}
          onSelectDeck={handleDeckSelect}
        />

        <PracticeResultModal
          open={
            showResultModal &&
            Boolean(battleState?.winner) &&
            !showDeckModal &&
            !showTutorialModal
          }
          winner={battleState?.winner ?? null}
          onClose={() => setShowResultModal(false)}
          onChooseDeck={handleOpenDeckModal}
        />

        <PracticeTutorialModal
          open={showTutorialModal}
          pageIndex={tutorialPage}
          onClose={() => {
            if (pendingSetup) {
              finishTutorial();
              return;
            }
            setShowTutorialModal(false);
          }}
          onBack={() => setTutorialPage((current) => Math.max(current - 1, 0))}
          onNext={() => {
            if (tutorialPage === PRACTICE_TUTORIAL_PAGES.length - 1) {
              finishTutorial();
              return;
            }

            setTutorialPage((current) =>
              Math.min(current + 1, PRACTICE_TUTORIAL_PAGES.length - 1),
            );
          }}
          onSelectPage={setTutorialPage}
        />

        {inspectedCard ? (
          <div className="hidden md:block">
            <PracticeCardModal
              card={inspectedCard}
              onClose={() => setInspectedCard(null)}
              canUseLeader={Boolean(playerLeaderCanTrigger)}
              canUseAbility={Boolean(playerUnitAbilityCanTrigger)}
              onUseAbility={() =>
                beginAbilityActivation(inspectedCard.slotIndex)
              }
              onUseLeaderAbility={handlePlayerLeaderAbility}
            />
          </div>
        ) : null}
      </div>
    </PageBackground>
  );
}
