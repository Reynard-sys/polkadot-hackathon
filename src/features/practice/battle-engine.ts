"use client";

import cardsData from "@/data/cards.json";

export type BoardZone = "Leader" | "Frontline" | "Backline" | "Reserve";
export type CardZone = Exclude<BoardZone, "Leader">;
export type CardRarity = "Common" | "Rare" | "Legendary" | "Mythic";
export type Element = "Fire" | "Water" | "Earth" | "Air";
export type Anime = "Naruto" | "OnePiece" | "Pokemon";
export type Owner = "player" | "bot";
export type BattlePhase = "Main" | "Battle";
export type Trigger =
  | "OnSummon"
  | "Aura"
  | "OnDefeat"
  | "CombatTrigger"
  | "Passive";
export type StatusEffect =
  | "Stun"
  | "Sleep"
  | "Burn"
  | "Poison"
  | "Disabled"
  | "Sealed"
  | "Silenced"
  | "Stoned";

type CatalogAbility = {
  trigger: Trigger;
  type: string;
  description?: string | null;
  value?: number | null;
  target?: string | null;
  duration?: string | null;
  condition?: string | null;
  cloneStats?: {
    power: number;
    hp: number;
  };
  onTrigger?: {
    type: string;
    value: number;
    then?: string;
  };
  scalingTrigger?: {
    type: string;
    value: number;
    condition?: string | null;
  };
  randomEffects?: Array<{
    type: string;
    target?: string | null;
    value?: number | null;
  }>;
  secondAttackRestriction?: string | null;
};

type CatalogLeaderAbility = {
  type: string;
  description?: string | null;
  value?: number | null;
  target?: string | null;
  duration?: string | null;
};

type CatalogCard = {
  id: string;
  nftTokenId: string;
  name: string;
  subtitle?: string;
  anime: Anime;
  rarity: CardRarity;
  mana: number;
  power: number;
  hp: number;
  element: Element;
  zone?: string;
  zones?: string[];
  leaderEligible?: boolean;
  keywords?: string[];
  ability?: CatalogAbility | null;
  leaderAbility?: CatalogLeaderAbility | null;
  traits?: string[];
  imageUrl: string;
};

export type PracticeCard = {
  id: number;
  cardId: string;
  name: string;
  subtitle: string;
  art: string;
  anime: Anime;
  rarity: CardRarity;
  mana: number;
  power: number;
  hp: number;
  element: Element;
  keywords: string[];
  traits: string[];
  abilityDescription: string;
  ability: CatalogAbility | null;
  leaderEligible: boolean;
  leaderDescription: string | null;
  leaderAbility: CatalogLeaderAbility | null;
  zone: CardZone | null;
  zones: CardZone[];
};

export type SavedDeck = {
  id: number;
  name: string;
  cards: Array<PracticeCard | null>;
};

type PersistedDeckState = {
  savedDecks?: Array<{
    id?: number;
    name?: string;
    cards?: unknown[];
  }>;
};

export type BattleUnit = PracticeCard & {
  owner: Owner;
  slotIndex: number;
  currentHP: number;
  permanentPowerBonus: number;
  permanentHpBonus: number;
  turnPowerBonus: number;
  turnHpBonus: number;
  auraPowerBonus: number;
  auraHpBonus: number;
  canAttack: boolean;
  attacksThisTurn: number;
  shieldsRemaining: number;
  statusEffects: StatusEffect[];
  statusDurations: Partial<Record<StatusEffect, number>>;
  isSilenced: boolean;
  cloneActive: boolean;
  cloneHP: number;
  clonePower: number;
  patienceCounter: number;
  hasUsedOnDefeat: boolean;
  copiedAbility: CatalogAbility | null;
  copiedAbilityMode: "replace" | "add" | null;
  doubleAttackUsed: boolean;
  nextAttackPowerBonus: number;
  nextAttackDamageMultiplier: number;
  grantedRushThisTurn: boolean;
  grantedAttackTwiceThisTurn: boolean;
  abilityUsedThisTurn: boolean;
  lastDrawManaTurnStarted: number | null;
  declaredElement: Element | null;
};

export type BattleTarget =
  | {
      type: "slot";
      owner: Owner;
      slotIndex: number;
    }
  | {
      type: "player";
      owner: Owner;
    };

export type AbilityTargetState = {
  options: BattleTarget[];
  complete: boolean;
  requiresTargets: boolean;
};

type PendingRevive = {
  owner: Owner;
  slotIndex: number;
  reviveTurn: number;
  unit: BattleUnit;
};

export type BattlePlayerState = {
  hp: number;
  mana: number;
  manaMax: number;
  turnsStarted: number;
  attacksUsedThisTurn: number;
};

export type BattleState = {
  turn: number;
  activePlayer: Owner;
  phase: BattlePhase;
  players: Record<Owner, BattlePlayerState>;
  board: Record<Owner, Array<BattleUnit | null>>;
  leaderUsed: Record<Owner, boolean>;
  reserveSuppressedUntilTurn: Record<Owner, number | null>;
  pendingRevives: PendingRevive[];
  logs: string[];
  winner: Owner | null;
};

export type BotTurnAction =
  | {
      type: "ability";
      slotIndex: number;
      selectedTargets: BattleTarget[];
      summary: string;
    }
  | {
      type: "leader";
      summary: string;
    }
  | {
      type: "advance";
      summary: string;
    }
  | {
      type: "attack";
      slotIndex: number;
      target: BattleTarget;
      summary: string;
    }
  | {
      type: "endTurn";
      summary: string;
    };

const MAX_PLAYER_HP = 40;
const MAX_LOGS = 12;
export const MAX_ATTACKS_PER_TURN = 3;
const BATTLE_RARITY_LIMITS: Partial<Record<CardRarity, number>> = {
  Mythic: 1,
  Legendary: 2,
  Rare: 2,
};

export const TOTAL_SLOTS = 12;
export const PLAYER_DESKTOP_ORDER = [8, 4, 0, 9, 5, 1, 10, 6, 2, 11, 7, 3];
export const BOT_DESKTOP_ORDER = [1, 5, 8, 2, 6, 9, 3, 7, 10, 0, 4, 11];
export const PLAYER_MOBILE_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const BOT_MOBILE_ORDER = [8, 9, 10, 11, 4, 5, 6, 7, 1, 2, 3, 0];
export const TUTORIAL_STORAGE_KEY = "animeGachaTCG_tutorialComplete";

function isCardZone(value: string): value is CardZone {
  return value === "Frontline" || value === "Backline" || value === "Reserve";
}

function normalizeZones(zone?: string | null, zones?: string[]) {
  return [...new Set([...(zones ?? []), ...(zone ? [zone] : [])])].filter(
    isCardZone,
  );
}

export function getSlotZone(slotIndex: number): BoardZone {
  if (slotIndex === 0) return "Leader";
  if (slotIndex >= 1 && slotIndex <= 3) return "Frontline";
  if (slotIndex >= 4 && slotIndex <= 7) return "Backline";
  return "Reserve";
}

export function getSlotLabel(slotIndex: number) {
  return getSlotZone(slotIndex);
}

function isBattleSlotIndex(slotIndex: number) {
  const zone = getSlotZone(slotIndex);
  return zone === "Frontline" || zone === "Backline";
}

export function deckStorageKey(address: string) {
  return `deck_builder_${address.toLowerCase()}`;
}

const PRACTICE_CATALOG_SOURCE = cardsData as CatalogCard[];

export const PRACTICE_CATALOG: PracticeCard[] = PRACTICE_CATALOG_SOURCE.flatMap(
  (card) => {
    const id = Number.parseInt(card.nftTokenId, 10);
    if (!Number.isInteger(id)) {
      return [];
    }

    const zones = normalizeZones(card.zone, card.zones);

    return [
      {
        id,
        cardId: card.id,
        name: card.name,
        subtitle: card.subtitle ?? "",
        art: card.imageUrl,
        anime: card.anime,
        rarity: card.rarity,
        mana: card.mana,
        power: card.power,
        hp: card.hp,
        element: card.element,
        keywords: card.keywords ?? [],
        traits: card.traits ?? [],
        abilityDescription: card.ability?.description ?? "",
        ability: card.ability ?? null,
        leaderEligible: card.leaderEligible ?? false,
        leaderDescription: card.leaderAbility?.description ?? null,
        leaderAbility: card.leaderAbility ?? null,
        zone: zones[0] ?? null,
        zones,
      } satisfies PracticeCard,
    ];
  },
);

const PRACTICE_CARD_LOOKUP = new Map(
  PRACTICE_CATALOG.map((card) => [card.id, card]),
);

export function getPracticeCardById(id: number) {
  return PRACTICE_CARD_LOOKUP.get(id) ?? null;
}

export function hydratePracticeCard(card: unknown): PracticeCard | null {
  if (!card || typeof card !== "object") {
    return null;
  }

  const parsedCard = card as Partial<{
    id: number;
    cardId: string;
    name: string;
    subtitle: string;
    art: string;
    anime: Anime;
    rarity: CardRarity;
    mana: number;
    power: number;
    hp: number;
    element: Element;
    keywords: string[];
    traits: string[];
    abilityDescription: string;
    ability: CatalogAbility | null;
    leaderEligible: boolean;
    leaderDescription: string | null;
    leaderAbility: CatalogLeaderAbility | null;
    zone: CardZone | null;
    zones: CardZone[];
  }>;

  if (typeof parsedCard.id !== "number" || !Number.isFinite(parsedCard.id)) {
    return null;
  }

  const catalogCard = PRACTICE_CARD_LOOKUP.get(parsedCard.id);
  const zones = normalizeZones(parsedCard.zone ?? null, parsedCard.zones);
  const resolvedZones = zones.length > 0 ? zones : (catalogCard?.zones ?? []);

  return {
    id: parsedCard.id,
    cardId: catalogCard?.cardId ?? parsedCard.cardId ?? `card_${parsedCard.id}`,
    name: catalogCard?.name ?? parsedCard.name ?? `Card #${parsedCard.id}`,
    subtitle: catalogCard?.subtitle ?? parsedCard.subtitle ?? "",
    art: catalogCard?.art ?? parsedCard.art ?? "",
    anime: catalogCard?.anime ?? parsedCard.anime ?? "Naruto",
    rarity: catalogCard?.rarity ?? parsedCard.rarity ?? "Common",
    mana: catalogCard?.mana ?? parsedCard.mana ?? 0,
    power: catalogCard?.power ?? parsedCard.power ?? 0,
    hp: catalogCard?.hp ?? parsedCard.hp ?? 1,
    element: catalogCard?.element ?? parsedCard.element ?? "Fire",
    keywords: catalogCard?.keywords ?? parsedCard.keywords ?? [],
    traits: catalogCard?.traits ?? parsedCard.traits ?? [],
    abilityDescription:
      catalogCard?.abilityDescription ?? parsedCard.abilityDescription ?? "",
    ability: catalogCard?.ability ?? parsedCard.ability ?? null,
    leaderEligible:
      catalogCard?.leaderEligible ?? parsedCard.leaderEligible ?? false,
    leaderDescription:
      catalogCard?.leaderDescription ?? parsedCard.leaderDescription ?? null,
    leaderAbility: catalogCard?.leaderAbility ?? parsedCard.leaderAbility ?? null,
    zone: resolvedZones[0] ?? catalogCard?.zone ?? null,
    zones: resolvedZones,
  };
}

export function padDeck(cards: Array<PracticeCard | null>) {
  const next = cards.slice(0, TOTAL_SLOTS);
  while (next.length < TOTAL_SLOTS) {
    next.push(null);
  }
  return next;
}

export function loadSavedDecks(address: string | null) {
  if (!address || typeof window === "undefined") {
    return [] as SavedDeck[];
  }

  try {
    const raw = localStorage.getItem(deckStorageKey(address));
    if (!raw) {
      return [] as SavedDeck[];
    }

    const parsed = JSON.parse(raw) as PersistedDeckState;
    if (!Array.isArray(parsed.savedDecks)) {
      return [] as SavedDeck[];
    }

    return parsed.savedDecks
      .map((deck) => {
        if (typeof deck?.id !== "number") {
          return null;
        }

        const cards = Array.isArray(deck.cards)
          ? deck.cards.map((card) => hydratePracticeCard(card))
          : [];

        return {
          id: deck.id,
          name: typeof deck.name === "string" ? deck.name : `Deck ${deck.id}`,
          cards: padDeck(cards),
        } satisfies SavedDeck;
      })
      .filter((deck): deck is SavedDeck => deck !== null);
  } catch {
    return [] as SavedDeck[];
  }
}

function shuffleCards(cards: PracticeCard[]) {
  const next = [...cards];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function canAddBattleDeckCard(
  card: PracticeCard,
  rarityCounts: Map<CardRarity, number>,
) {
  const limit = BATTLE_RARITY_LIMITS[card.rarity];
  if (typeof limit !== "number") {
    return true;
  }

  return (rarityCounts.get(card.rarity) ?? 0) < limit;
}

export function generateBotDeck() {
  const nextDeck = Array.from(
    { length: TOTAL_SLOTS },
    () => null,
  ) as Array<PracticeCard | null>;
  const usedIds = new Set<number>();
  const battleRarityCounts = new Map<CardRarity, number>();

  const takeCard = (slotIndex: number, card: PracticeCard) => {
    nextDeck[slotIndex] = card;
    usedIds.add(card.id);

    if (slotIndex < 8) {
      battleRarityCounts.set(
        card.rarity,
        (battleRarityCounts.get(card.rarity) ?? 0) + 1,
      );
    }
  };

  const findCard = ({
    slotIndex,
    zone,
    leaderOnly = false,
  }: {
    slotIndex: number;
    zone?: CardZone;
    leaderOnly?: boolean;
  }) =>
    shuffleCards(PRACTICE_CATALOG).find(
      (card) =>
        !usedIds.has(card.id) &&
        (!leaderOnly || card.leaderEligible) &&
        (!zone || card.zones.includes(zone)) &&
        (slotIndex >= 8 || canAddBattleDeckCard(card, battleRarityCounts)),
    ) ?? null;

  const leader = findCard({ slotIndex: 0, leaderOnly: true });
  if (leader) {
    takeCard(0, leader);
  }

  for (const slotIndex of [1, 2, 3]) {
    const card = findCard({ slotIndex, zone: "Frontline" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  for (const slotIndex of [4, 5, 6, 7]) {
    const card = findCard({ slotIndex, zone: "Backline" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  for (const slotIndex of [8, 9, 10, 11]) {
    const card = findCard({ slotIndex, zone: "Reserve" });
    if (card) {
      takeCard(slotIndex, card);
    }
  }

  return nextDeck;
}

function createBattleUnit(
  card: PracticeCard,
  owner: Owner,
  slotIndex: number,
): BattleUnit {
  return {
    ...card,
    owner,
    slotIndex,
    currentHP: getSlotZone(slotIndex) === "Leader" ? MAX_PLAYER_HP : card.hp,
    permanentPowerBonus: 0,
    permanentHpBonus: 0,
    turnPowerBonus: 0,
    turnHpBonus: 0,
    auraPowerBonus: 0,
    auraHpBonus: 0,
    canAttack: false,
    attacksThisTurn: 0,
    shieldsRemaining: 0,
    statusEffects: [],
    statusDurations: {},
    isSilenced: false,
    cloneActive: false,
    cloneHP: 0,
    clonePower: 0,
    patienceCounter: 0,
    hasUsedOnDefeat: false,
    copiedAbility: null,
    copiedAbilityMode: null,
    doubleAttackUsed: false,
    nextAttackPowerBonus: 0,
    nextAttackDamageMultiplier: 1,
    grantedRushThisTurn: false,
    grantedAttackTwiceThisTurn: false,
    abilityUsedThisTurn: false,
    lastDrawManaTurnStarted: null,
    declaredElement: null,
  };
}

function cloneAbility(ability: CatalogAbility | null) {
  if (!ability) {
    return null;
  }

  return {
    ...ability,
    cloneStats: ability.cloneStats ? { ...ability.cloneStats } : undefined,
    onTrigger: ability.onTrigger ? { ...ability.onTrigger } : undefined,
    scalingTrigger: ability.scalingTrigger
      ? { ...ability.scalingTrigger }
      : undefined,
    randomEffects: ability.randomEffects
      ? ability.randomEffects.map((effect) => ({ ...effect }))
      : undefined,
  };
}

function cloneUnit(unit: BattleUnit | null) {
  if (!unit) {
    return null;
  }

  return {
    ...unit,
    keywords: [...unit.keywords],
    traits: [...unit.traits],
    zones: [...unit.zones],
    ability: cloneAbility(unit.ability),
    copiedAbility: cloneAbility(unit.copiedAbility),
    statusEffects: [...unit.statusEffects],
    statusDurations: { ...unit.statusDurations },
    leaderAbility: unit.leaderAbility ? { ...unit.leaderAbility } : null,
  };
}

function cloneState(state: BattleState): BattleState {
  return {
    ...state,
    players: {
      player: { ...state.players.player },
      bot: { ...state.players.bot },
    },
    board: {
      player: state.board.player.map((unit) => cloneUnit(unit)),
      bot: state.board.bot.map((unit) => cloneUnit(unit)),
    },
    leaderUsed: { ...state.leaderUsed },
    reserveSuppressedUntilTurn: { ...state.reserveSuppressedUntilTurn },
    pendingRevives: state.pendingRevives.map((entry) => ({
      ...entry,
      unit: cloneUnit(entry.unit)!,
    })),
    logs: [...state.logs],
  };
}

function getNextTurnManaMax(playerState: BattlePlayerState) {
  if (playerState.turnsStarted === 0) {
    return 2;
  }

  return Math.min(playerState.manaMax + 1, 7);
}

function opponentOf(owner: Owner): Owner {
  return owner === "player" ? "bot" : "player";
}

function appendLog(state: BattleState, message: string) {
  state.logs = [...state.logs, message].slice(-MAX_LOGS);
}

function getUnit(state: BattleState, owner: Owner, slotIndex: number) {
  return state.board[owner][slotIndex] ?? null;
}

function setUnit(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  unit: BattleUnit | null,
) {
  state.board[owner][slotIndex] = unit;
  if (unit) {
    unit.owner = owner;
    unit.slotIndex = slotIndex;
  }
}

function getUnits(
  state: BattleState,
  owner: Owner,
  options?: {
    includeLeader?: boolean;
    includeReserve?: boolean;
  },
) {
  return state.board[owner]
    .map((unit, slotIndex) => ({ unit, slotIndex }))
    .filter(({ unit, slotIndex }) => {
      if (!unit) {
        return false;
      }

      const zone = getSlotZone(slotIndex);
      if (zone === "Leader" && !options?.includeLeader) {
        return false;
      }

      if (zone === "Reserve" && !options?.includeReserve) {
        return false;
      }

      return true;
    }) as Array<{ unit: BattleUnit; slotIndex: number }>;
}

function getAllLivingUnits(state: BattleState, owner: Owner) {
  return getUnits(state, owner, {
    includeLeader: true,
    includeReserve: true,
  });
}

function getCurrentElement(unit: BattleUnit) {
  return unit.declaredElement ?? unit.element;
}

function getLeaderUnit(state: BattleState, owner: Owner) {
  return getUnit(state, owner, 0);
}

function getMaxHp(unit: BattleUnit) {
  return (
    (getSlotZone(unit.slotIndex) === "Leader" ? MAX_PLAYER_HP : unit.hp) +
    unit.permanentHpBonus +
    unit.turnHpBonus +
    unit.auraHpBonus
  );
}

export function getUnitCurrentPower(unit: BattleUnit) {
  return Math.max(
    0,
    unit.power +
      unit.permanentPowerBonus +
      unit.turnPowerBonus +
      unit.auraPowerBonus,
  );
}

export function getBattleUnitElement(unit: BattleUnit) {
  return getCurrentElement(unit);
}

export function getBattleUnitMaxHp(unit: BattleUnit) {
  return getMaxHp(unit);
}

function clampUnitHp(unit: BattleUnit) {
  unit.currentHP = Math.min(unit.currentHP, getMaxHp(unit));
}

function syncLeaderHealth(state: BattleState, owner: Owner) {
  const leader = getLeaderUnit(state, owner);
  if (!leader) {
    state.players[owner].hp = 0;
    return;
  }

  leader.currentHP = Math.max(0, Math.min(getMaxHp(leader), leader.currentHP));
  state.players[owner].hp = leader.currentHP;
}

function syncAllLeaderHealth(state: BattleState) {
  for (const owner of ["player", "bot"] as const) {
    syncLeaderHealth(state, owner);
  }
}

function setPlayerHp(state: BattleState, owner: Owner, nextHp: number) {
  const leader = getLeaderUnit(state, owner);
  const maxHp = leader ? getMaxHp(leader) : MAX_PLAYER_HP;
  const clampedHp = Math.max(0, Math.min(maxHp, nextHp));

  state.players[owner].hp = clampedHp;
  if (leader) {
    leader.currentHP = clampedHp;
  }
}

function hasStatus(unit: BattleUnit, status: StatusEffect) {
  return unit.statusEffects.includes(status);
}

function addStatus(
  unit: BattleUnit,
  status: StatusEffect,
  duration?: number | null,
) {
  if (!unit.statusEffects.includes(status)) {
    unit.statusEffects.push(status);
  }

  if (status === "Silenced") {
    unit.isSilenced = true;
  }

  if (typeof duration === "number") {
    unit.statusDurations[status] = duration;
  }
}

function removeStatus(unit: BattleUnit, status: StatusEffect) {
  unit.statusEffects = unit.statusEffects.filter((entry) => entry !== status);
  delete unit.statusDurations[status];
  if (status === "Silenced") {
    unit.isSilenced = false;
  }
}

function isReserveSuppressed(state: BattleState, unit: BattleUnit) {
  return (
    getSlotZone(unit.slotIndex) === "Reserve" &&
    state.reserveSuppressedUntilTurn[unit.owner] === state.turn
  );
}

function getAbilityList(unit: BattleUnit) {
  if (unit.copiedAbilityMode === "replace") {
    return unit.copiedAbility ? [unit.copiedAbility] : [];
  }

  if (unit.copiedAbilityMode === "add") {
    return [unit.ability, unit.copiedAbility].filter(
      (ability): ability is CatalogAbility => Boolean(ability),
    );
  }

  return unit.ability ? [unit.ability] : [];
}

function getTriggeredAbilities(unit: BattleUnit, trigger: Trigger) {
  return getAbilityList(unit).filter((ability) => ability.trigger === trigger);
}

function getManualAbility(unit: BattleUnit | null) {
  return unit?.ability?.trigger === "OnSummon" ? unit.ability : null;
}

function isDrawManaAbility(ability: CatalogAbility | null | undefined) {
  return ability?.type === "DrawCard";
}

function canUseDrawManaAbilityThisTurn(
  state: BattleState,
  owner: Owner,
  unit: BattleUnit,
) {
  if (!isDrawManaAbility(unit.ability)) {
    return true;
  }

  return (
    unit.lastDrawManaTurnStarted === null ||
    state.players[owner].turnsStarted - unit.lastDrawManaTurnStarted >= 2
  );
}

function getStartTurnAuraAbility(unit: BattleUnit | null) {
  if (!unit) {
    return null;
  }

  return (
    getAbilityList(unit).find(
      (ability) =>
        ability.trigger === "Aura" && ability.type === "HealAllyPerTurn",
    ) ?? null
  );
}

export function canActivateStartTurnAura(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
) {
  const source = getUnit(state, owner, slotIndex);
  const ability = getStartTurnAuraAbility(source);
  if (!source || !ability) {
    return false;
  }

  return (
    !state.winner &&
    state.activePlayer === owner &&
    state.phase === "Main" &&
    state.turn > 1 &&
    !source.abilityUsedThisTurn &&
    canUsePassiveAbility(state, source)
  );
}

function hasAbilityType(unit: BattleUnit, type: string) {
  return getAbilityList(unit).some((ability) => ability.type === type);
}

function hasKeyword(unit: BattleUnit, keyword: string) {
  return unit.keywords.includes(keyword);
}

function hasRush(unit: BattleUnit) {
  return unit.grantedRushThisTurn || hasKeyword(unit, "Rush");
}

function canUsePassiveAbility(state: BattleState, unit: BattleUnit) {
  return (
    !unit.isSilenced &&
    !hasStatus(unit, "Disabled") &&
    !hasStatus(unit, "Sealed") &&
    !isReserveSuppressed(state, unit)
  );
}

function isAttackPriorityUnit(state: BattleState, unit: BattleUnit) {
  return (
    canUsePassiveAbility(state, unit) &&
    (hasAbilityType(unit, "AttackFirst") || hasKeyword(unit, "Initiative"))
  );
}

function hasAttackTwice(state: BattleState, unit: BattleUnit) {
  return (
    unit.grantedAttackTwiceThisTurn ||
    (canUsePassiveAbility(state, unit) && hasAbilityType(unit, "AttackTwice")) ||
    hasKeyword(unit, "DoubleAttack")
  );
}

function ignoresGuardAndShield(state: BattleState, unit: BattleUnit) {
  return (
    canUsePassiveAbility(state, unit) &&
    (hasAbilityType(unit, "ShieldBreak") || hasKeyword(unit, "GuardBypass"))
  );
}

function hasBacklineStrike(state: BattleState, unit: BattleUnit) {
  return (
    canUsePassiveAbility(state, unit) &&
    (hasAbilityType(unit, "BacklineStrike") || hasKeyword(unit, "BacklineStrike"))
  );
}

function hasCounterImmune(state: BattleState, unit: BattleUnit) {
  return (
    canUsePassiveAbility(state, unit) &&
    (hasAbilityType(unit, "CounterImmune") ||
      hasKeyword(unit, "CounterImmune"))
  );
}

function hasGuard(state: BattleState, unit: BattleUnit) {
  return (
    getSlotZone(unit.slotIndex) === "Frontline" &&
    canUsePassiveAbility(state, unit) &&
    (hasKeyword(unit, "Guard") || hasAbilityType(unit, "ShieldAndGuard"))
  );
}

function getDamageReduction(state: BattleState, unit: BattleUnit) {
  if (!canUsePassiveAbility(state, unit) || !hasAbilityType(unit, "DamageReduction")) {
    return 0;
  }

  return unit.ability?.value ?? 0;
}

function getAllowedAttackCount(state: BattleState, unit: BattleUnit) {
  return hasAttackTwice(state, unit) ? 2 : 1;
}

function getRemainingAttackAllowance(state: BattleState, owner: Owner) {
  return Math.max(0, MAX_ATTACKS_PER_TURN - state.players[owner].attacksUsedThisTurn);
}

function unitIsAttackLocked(unit: BattleUnit) {
  return (
    hasStatus(unit, "Stun") ||
    hasStatus(unit, "Sleep") ||
    hasStatus(unit, "Disabled")
  );
}

function refreshOwnerAttackState(state: BattleState, owner: Owner) {
  for (const { unit } of getUnits(state, owner, {
    includeLeader: true,
    includeReserve: true,
  })) {
    const attackWindowOpen = state.turn >= 1 || hasRush(unit);
    unit.canAttack = attackWindowOpen && !unitIsAttackLocked(unit);
  }
}

function getFriendlyBattleSlots(state: BattleState, owner: Owner) {
  return getUnits(state, owner, {
    includeLeader: true,
    includeReserve: true,
  });
}

function sortThreatTargets(state: BattleState, owner: Owner) {
  return getAllLivingUnits(state, owner).sort((left, right) => {
    const leftZone = getSlotZone(left.slotIndex);
    const rightZone = getSlotZone(right.slotIndex);
    const zoneWeight = (zone: BoardZone) => {
      if (zone === "Frontline") return 0;
      if (zone === "Backline") return 1;
      if (zone === "Reserve") return 2;
      return 3;
    };

    const zoneDelta = zoneWeight(leftZone) - zoneWeight(rightZone);
    if (zoneDelta !== 0) {
      return zoneDelta;
    }

    const powerDelta =
      getUnitCurrentPower(right.unit) - getUnitCurrentPower(left.unit);
    if (powerDelta !== 0) {
      return powerDelta;
    }

    return left.unit.currentHP - right.unit.currentHP;
  });
}

function chooseEnemyUnitSlot(state: BattleState, owner: Owner) {
  return sortThreatTargets(state, opponentOf(owner))[0]?.slotIndex ?? null;
}

function chooseMostDamagedFriendlyUnitSlot(
  state: BattleState,
  owner: Owner,
  options?: {
    includeLeader?: boolean;
    includeReserve?: boolean;
  },
) {
  const choices = getUnits(state, owner, {
    includeLeader: options?.includeLeader,
    includeReserve: options?.includeReserve ?? true,
  })
    .map(({ unit, slotIndex }) => ({
      slotIndex,
      missingHp: getMaxHp(unit) - unit.currentHP,
      zone: getSlotZone(slotIndex),
    }))
    .filter((entry) => entry.missingHp > 0)
    .sort((left, right) => {
      if (right.missingHp !== left.missingHp) {
        return right.missingHp - left.missingHp;
      }

      const zoneWeight = (zone: BoardZone) => {
        if (zone === "Frontline") return 0;
        if (zone === "Backline") return 1;
        if (zone === "Reserve") return 2;
        return 3;
      };

      return zoneWeight(left.zone) - zoneWeight(right.zone);
    });

  return choices[0]?.slotIndex ?? null;
}

function healPlayer(state: BattleState, owner: Owner, value: number) {
  setPlayerHp(state, owner, state.players[owner].hp + value);
}

function gainMana(state: BattleState, owner: Owner, value: number) {
  state.players[owner].mana = Math.min(7, state.players[owner].mana + value);
}

function healUnit(unit: BattleUnit, value: number) {
  unit.currentHP = Math.min(getMaxHp(unit), unit.currentHP + value);
}

function damagePlayer(state: BattleState, owner: Owner, value: number) {
  setPlayerHp(state, owner, state.players[owner].hp - value);
  if (state.players[owner].hp <= 0) {
    state.winner = opponentOf(owner);
  }
}

function updateWinner(state: BattleState) {
  syncAllLeaderHealth(state);

  if (state.players.player.hp <= 0) {
    state.winner = "bot";
  }

  if (state.players.bot.hp <= 0) {
    state.winner = "player";
  }
}

function removeUnitFromBoard(state: BattleState, owner: Owner, slotIndex: number) {
  setUnit(state, owner, slotIndex, null);
}

function scheduleBrookRevive(
  state: BattleState,
  unit: BattleUnit,
  owner: Owner,
  slotIndex: number,
) {
  const reviveTurn = state.turn + (owner === state.activePlayer ? 2 : 1);
  const revivedUnit = cloneUnit(unit)!;
  revivedUnit.currentHP = 1;
  revivedUnit.statusEffects = [];
  revivedUnit.statusDurations = {};
  revivedUnit.cloneActive = false;
  revivedUnit.cloneHP = 0;
  revivedUnit.clonePower = 0;
  revivedUnit.shieldsRemaining = 0;
  revivedUnit.turnPowerBonus = 0;
  revivedUnit.turnHpBonus = 0;
  revivedUnit.grantedRushThisTurn = false;
  revivedUnit.grantedAttackTwiceThisTurn = false;
  revivedUnit.nextAttackPowerBonus = 0;
  revivedUnit.nextAttackDamageMultiplier = 1;
  revivedUnit.attacksThisTurn = 0;
  revivedUnit.canAttack = false;
  revivedUnit.hasUsedOnDefeat = true;
  state.pendingRevives.push({
    owner,
    slotIndex,
    reviveTurn,
    unit: revivedUnit,
  });
  appendLog(
    state,
    `${unit.name} will return at the start of ${owner === "player" ? "your" : "the bot's"} next turn.`,
  );
}

function destroyUnit(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  unit: BattleUnit,
) {
  if (!unit.isSilenced && hasAbilityType(unit, "Revive") && !unit.hasUsedOnDefeat) {
    scheduleBrookRevive(state, unit, owner, slotIndex);
    removeUnitFromBoard(state, owner, slotIndex);
    return;
  }

  appendLog(state, `${unit.name} was destroyed.`);
  removeUnitFromBoard(state, owner, slotIndex);
}

function applyCharmeleonScaling(state: BattleState) {
  for (const owner of ["player", "bot"] as const) {
    for (const { unit } of getAllLivingUnits(state, owner)) {
      if (!unit.isSilenced && hasAbilityType(unit, "BurnAndScale")) {
        unit.permanentPowerBonus += unit.ability?.scalingTrigger?.value ?? 1;
      }
    }
  }
}

function applyDamageToUnit(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  damage: number,
  options?: {
    ignoreShield?: boolean;
    ignoreDamageReduction?: boolean;
    sourceLabel?: string;
  },
) {
  const target = getUnit(state, owner, slotIndex);
  if (!target || damage <= 0) {
    return {
      prevented: false,
      destroyed: false,
      overflow: 0,
      appliedDamage: 0,
    };
  }

  if (target.cloneActive) {
    target.cloneHP -= damage;
    appendLog(
      state,
      `${target.name}'s clone took ${damage} damage first.`,
    );

    if (target.cloneHP <= 0) {
      target.cloneActive = false;
      target.cloneHP = 0;
      target.clonePower = 0;
      appendLog(state, `${target.name}'s clone was destroyed.`);
    }

    return {
      prevented: false,
      destroyed: false,
      overflow: 0,
      appliedDamage: 0,
    };
  }

  if (target.shieldsRemaining > 0 && !options?.ignoreShield) {
    target.shieldsRemaining -= 1;
    appendLog(state, `${target.name}'s shield blocked the hit.`);
    return {
      prevented: true,
      destroyed: false,
      overflow: 0,
      appliedDamage: 0,
    };
  }

  const reduction = options?.ignoreDamageReduction ? 0 : getDamageReduction(state, target);
  const finalDamage = Math.max(0, damage - reduction);
  if (finalDamage <= 0) {
    appendLog(state, `${target.name} absorbed the damage.`);
    return {
      prevented: false,
      destroyed: false,
      overflow: 0,
      appliedDamage: 0,
    };
  }

  target.currentHP -= finalDamage;
  const overflow = Math.max(0, -target.currentHP);
  const destroyed = target.currentHP <= 0;
  appendLog(
    state,
    `${target.name} took ${finalDamage} damage${options?.sourceLabel ? ` from ${options.sourceLabel}` : ""}.`,
  );

  if (destroyed) {
    destroyUnit(state, owner, slotIndex, target);
  }

  return {
    prevented: false,
    destroyed,
    overflow,
    appliedDamage: finalDamage,
  };
}

function beatsElement(attacker: Element, defender: Element) {
  return (
    (attacker === "Fire" && defender === "Air") ||
    (attacker === "Air" && defender === "Earth") ||
    (attacker === "Earth" && defender === "Water") ||
    (attacker === "Water" && defender === "Fire")
  );
}

function applyAuraBonuses(state: BattleState) {
  for (const owner of ["player", "bot"] as const) {
    for (const { unit } of getAllLivingUnits(state, owner)) {
      unit.auraPowerBonus = 0;
      unit.auraHpBonus = 0;
    }
  }

  for (const owner of ["player", "bot"] as const) {
    for (const { unit } of getAllLivingUnits(state, owner)) {
      if (!canUsePassiveAbility(state, unit)) {
        continue;
      }

      for (const ability of getTriggeredAbilities(unit, "Aura")) {
        switch (ability.type) {
          case "BuffAllAllies": {
            for (const { unit: ally } of getAllLivingUnits(state, owner)) {
              if (
                ability.target === "AllOtherFriendlyUnits" &&
                ally.slotIndex === unit.slotIndex
              ) {
                continue;
              }

              ally.auraPowerBonus += ability.value ?? 0;
            }
            break;
          }
          case "ElementPowerBuff": {
            for (const { unit: ally } of getAllLivingUnits(state, owner)) {
              if (getCurrentElement(ally) === "Air") {
                ally.auraPowerBonus += ability.value ?? 0;
              }
            }
            break;
          }
          case "ConditionalPowerBoost": {
            const conditionMet =
              ability.condition === "NarutoUzumakiOnBoard"
                ? getAllLivingUnits(state, owner).some(({ unit: ally }) =>
                    ally.name.includes("Naruto Uzumaki"),
                  )
                : ability.condition === "EnemyPlayerHP15OrLess"
                  ? state.players[opponentOf(owner)].hp <= 15
                  : false;

            if (conditionMet) {
              unit.auraPowerBonus += ability.value ?? 0;
            }
            break;
          }
          default:
            break;
        }
      }
    }
  }

  for (const owner of ["player", "bot"] as const) {
    for (const { unit } of getAllLivingUnits(state, owner)) {
      clampUnitHp(unit);
    }
  }

  syncAllLeaderHealth(state);
}

function chooseBestDeclaredElement(state: BattleState, owner: Owner) {
  const enemyUnits = getUnits(state, opponentOf(owner), {
    includeLeader: false,
    includeReserve: false,
  });

  if (enemyUnits.length === 0) {
    return "Fire" as Element;
  }

  const counts: Record<Element, number> = {
    Fire: 0,
    Water: 0,
    Earth: 0,
    Air: 0,
  };

  for (const { unit } of enemyUnits) {
    counts[getCurrentElement(unit)] += 1;
  }

  const options: Array<{ element: Element; score: number }> = [
    { element: "Fire", score: counts.Air },
    { element: "Air", score: counts.Earth },
    { element: "Earth", score: counts.Water },
    { element: "Water", score: counts.Fire },
  ];

  return options.sort((left, right) => right.score - left.score)[0].element;
}

function getFriendlyAbilityTargets(
  state: BattleState,
  owner: Owner,
  options?: {
    includeLeader?: boolean;
    includeReserve?: boolean;
    battleOnly?: boolean;
  },
) {
  return getUnits(state, owner, {
    includeLeader: options?.includeLeader,
    includeReserve: options?.includeReserve,
  })
    .filter(({ slotIndex }) => !options?.battleOnly || isBattleSlotIndex(slotIndex))
    .map(
      ({ slotIndex }) =>
        ({
          type: "slot",
          owner,
          slotIndex,
        }) satisfies BattleTarget,
    );
}

function getEnemyAbilityTargets(
  state: BattleState,
  owner: Owner,
  options?: {
    includeReserve?: boolean;
    battleOnly?: boolean;
  },
) {
  const enemy = opponentOf(owner);

  return getUnits(state, enemy, {
    includeLeader: false,
    includeReserve: options?.includeReserve ?? true,
  })
    .filter(({ slotIndex }) => !options?.battleOnly || isBattleSlotIndex(slotIndex))
    .map(
      ({ slotIndex }) =>
        ({
          type: "slot",
          owner: enemy,
          slotIndex,
        }) satisfies BattleTarget,
    );
}

function getSwapTargets(state: BattleState) {
  return (["player", "bot"] as const).flatMap((owner) =>
    getUnits(state, owner, {
      includeLeader: false,
      includeReserve: false,
    })
      .filter(({ slotIndex }) => isBattleSlotIndex(slotIndex))
      .map(
        ({ slotIndex }) =>
          ({
            type: "slot",
            owner,
            slotIndex,
          }) satisfies BattleTarget,
      ),
  );
}

function sameTarget(left: BattleTarget, right: BattleTarget) {
  return (
    left.type === right.type &&
    left.owner === right.owner &&
    (left.type !== "slot" || right.type !== "slot" || left.slotIndex === right.slotIndex)
  );
}

export function canActivateUnitAbility(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
) {
  const source = getUnit(state, owner, slotIndex);
  const ability = getManualAbility(source);
  if (!source || !ability) {
    return false;
  }

  const manaCost = isDrawManaAbility(ability) ? 0 : source.mana;

  return (
    !state.winner &&
    state.activePlayer === owner &&
    state.phase === "Main" &&
    !source.abilityUsedThisTurn &&
    canUseDrawManaAbilityThisTurn(state, owner, source) &&
    !source.isSilenced &&
    !hasStatus(source, "Sealed") &&
    !isReserveSuppressed(state, source) &&
    state.players[owner].mana >= manaCost
  );
}

export function getUnitAbilityTargetState(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  selectedTargets: BattleTarget[] = [],
): AbilityTargetState {
  if (!canActivateUnitAbility(state, owner, slotIndex)) {
    return {
      options: [],
      complete: false,
      requiresTargets: false,
    };
  }

  const ability = getManualAbility(getUnit(state, owner, slotIndex));
  if (!ability) {
    return {
      options: [],
      complete: false,
      requiresTargets: false,
    };
  }

  switch (ability.type) {
    case "Heal":
      return selectedTargets.length >= 1
        ? { options: [], complete: true, requiresTargets: true }
        : {
            options: [
              ...getFriendlyAbilityTargets(state, owner, {
                includeLeader: true,
                includeReserve: true,
              }),
              { type: "player", owner },
            ],
            complete: false,
            requiresTargets: true,
          };
    case "Disable":
    case "Bind":
    case "SealAbility":
    case "Sleep":
    case "Stun":
    case "Burn":
    case "BurnAndScale":
    case "Poison":
    case "PermanentSilence":
    case "Stone":
    case "CopyAbility":
      return selectedTargets.length >= 1
        ? { options: [], complete: true, requiresTargets: true }
        : {
            options: getEnemyAbilityTargets(state, owner, {
              includeReserve: true,
            }),
            complete: false,
            requiresTargets: true,
          };
    case "DamageMultiple":
      return selectedTargets.length >= 2
        ? { options: [], complete: true, requiresTargets: true }
        : {
            options: getEnemyAbilityTargets(state, owner, {
              includeReserve: true,
            }).filter(
              (target) =>
                !selectedTargets.some((selectedTarget) =>
                  sameTarget(selectedTarget, target),
                ),
            ),
            complete: false,
            requiresTargets: true,
          };
    case "SwapPositions":
      return selectedTargets.length >= 2
        ? { options: [], complete: true, requiresTargets: true }
        : {
            options: getSwapTargets(state).filter(
              (target) =>
                !selectedTargets.some((selectedTarget) =>
                  sameTarget(selectedTarget, target),
                ),
            ),
            complete: false,
            requiresTargets: true,
          };
    case "ForceAttack":
      if (selectedTargets.length >= 2) {
        return { options: [], complete: true, requiresTargets: true };
      }

      if (selectedTargets.length === 1) {
        const firstTarget = selectedTargets[0];
        if (firstTarget?.type !== "slot") {
          return { options: [], complete: false, requiresTargets: true };
        }

        return {
          options: getEnemyAbilityTargets(state, owner, {
            battleOnly: true,
          }).filter(
            (target) =>
              target.type === "slot" &&
              target.owner === firstTarget.owner &&
              target.slotIndex !== firstTarget.slotIndex,
          ),
          complete: false,
          requiresTargets: true,
        };
      }

      return {
        options: getEnemyAbilityTargets(state, owner, {
          battleOnly: true,
        }),
        complete: false,
        requiresTargets: true,
      };
    default:
      return {
        options: [],
        complete: true,
        requiresTargets: false,
      };
  }
}

export function getPendingStartTurnAuraSlot(
  state: BattleState,
  owner: Owner,
) {
  if (
    state.winner ||
    state.activePlayer !== owner ||
    state.phase !== "Main"
  ) {
    return null;
  }

  return (
    getAllLivingUnits(state, owner).find(({ unit }) => {
      return canActivateStartTurnAura(state, owner, unit.slotIndex);
    })?.slotIndex ?? null
  );
}

export function getStartTurnAuraTargetState(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  selectedTargets: BattleTarget[] = [],
): AbilityTargetState {
  const source = getUnit(state, owner, slotIndex);
  const ability = getStartTurnAuraAbility(source);
  if (
    !source ||
    !ability ||
    !canActivateStartTurnAura(state, owner, slotIndex)
  ) {
    return {
      options: [],
      complete: false,
      requiresTargets: false,
    };
  }

  return selectedTargets.length >= 1
    ? {
        options: [],
        complete: true,
        requiresTargets: true,
      }
    : {
        options: [
          ...getFriendlyAbilityTargets(state, owner, {
            includeLeader: true,
            includeReserve: true,
          }),
          { type: "player", owner },
        ],
        complete: false,
        requiresTargets: true,
      };
}

export function activateStartTurnAura(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  selectedTargets: BattleTarget[] = [],
) {
  const targetState = getStartTurnAuraTargetState(
    state,
    owner,
    slotIndex,
    selectedTargets,
  );
  if (!targetState.complete) {
    return state;
  }

  const draft = cloneState(state);
  const source = getUnit(draft, owner, slotIndex);
  const ability = getStartTurnAuraAbility(source);
  if (!source || !ability || !canActivateStartTurnAura(draft, owner, slotIndex)) {
    return state;
  }

  source.abilityUsedThisTurn = true;

  const selectedTarget = selectedTargets[0];
  if (selectedTarget?.type === "player") {
    if (draft.players[owner].hp < MAX_PLAYER_HP) {
      healPlayer(draft, owner, ability.value ?? 1);
      appendLog(
        draft,
        `${source.name} restored ${ability.value ?? 1} HP to ${owner === "player" ? "you" : "the bot"}.`,
      );
    }
  } else if (selectedTarget?.type === "slot") {
    const target = getUnit(draft, selectedTarget.owner, selectedTarget.slotIndex);
    if (target && target.currentHP < getMaxHp(target)) {
      healUnit(target, ability.value ?? 1);
      appendLog(
        draft,
        `${source.name} healed ${target.name} for ${ability.value ?? 1}.`,
      );
    }
  }

  applyAuraBonuses(draft);
  refreshOwnerAttackState(draft, owner);
  updateWinner(draft);
  return draft;
}

function applyStatusByAbility(
  state: BattleState,
  source: BattleUnit,
  targetOwner: Owner,
  targetSlotIndex: number,
  type: string,
  value?: number | null,
) {
  const target = getUnit(state, targetOwner, targetSlotIndex);
  if (!target) {
    return;
  }

  switch (type) {
    case "Disable":
    case "Bind":
      addStatus(target, "Disabled", value ?? 1);
      appendLog(state, `${source.name} disabled ${target.name}.`);
      break;
    case "SealAbility":
      addStatus(target, "Sealed", value ?? 1);
      appendLog(state, `${source.name} sealed ${target.name}'s ability.`);
      break;
    case "Sleep":
      addStatus(target, "Sleep", value ?? 2);
      appendLog(state, `${source.name} put ${target.name} to sleep.`);
      break;
    case "Stun":
      addStatus(target, "Stun", value ?? 1);
      appendLog(state, `${source.name} stunned ${target.name}.`);
      break;
    case "Burn":
    case "BurnAndScale":
      addStatus(target, "Burn", 2);
      appendLog(state, `${source.name} burned ${target.name}.`);
      break;
    case "Poison":
      addStatus(target, "Poison");
      appendLog(state, `${source.name} poisoned ${target.name}.`);
      break;
    case "PermanentSilence":
      addStatus(target, "Silenced");
      appendLog(state, `${source.name} silenced ${target.name}.`);
      break;
    case "Stone":
      addStatus(target, "Stun", 1);
      addStatus(target, "Disabled", 1);
      addStatus(target, "Stoned", 1);
      appendLog(state, `${source.name} turned ${target.name} to stone.`);
      break;
    default:
      break;
  }
}

function resolveOnSummonAbility(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  ability: CatalogAbility,
  selectedTargets: BattleTarget[] = [],
) {
  const source = getUnit(state, owner, slotIndex);
  if (!source || source.isSilenced || isReserveSuppressed(state, source)) {
    return;
  }

  switch (ability.type) {
    case "Heal": {
      const selectedTarget = selectedTargets[0];
      if (selectedTarget?.type === "player") {
        healPlayer(state, owner, ability.value ?? 0);
        appendLog(
          state,
          `${source.name} restored ${ability.value ?? 0} HP to ${owner === "player" ? "you" : "the bot"}.`,
        );
        break;
      }

      const targetSlot =
        selectedTarget?.type === "slot"
          ? selectedTarget.slotIndex
          : chooseMostDamagedFriendlyUnitSlot(state, owner, {
              includeLeader: true,
              includeReserve: true,
            });
      if (targetSlot !== null) {
        const target = getUnit(state, owner, targetSlot);
        if (target) {
          healUnit(target, ability.value ?? 0);
          appendLog(state, `${source.name} healed ${target.name}.`);
          break;
        }
      }
      break;
    }
    case "DistributeHeal": {
      let remaining = ability.value ?? 0;
      while (remaining > 0) {
        const targetSlot = chooseMostDamagedFriendlyUnitSlot(state, owner, {
          includeLeader: false,
          includeReserve: true,
        });
        if (targetSlot === null) {
          break;
        }

        const target = getUnit(state, owner, targetSlot);
        if (!target) {
          break;
        }

        healUnit(target, 1);
        remaining -= 1;
      }
      appendLog(state, `${source.name} spread healing across the team.`);
      break;
    }
    case "DrawCard": {
      const manaGain = ability.value ?? 1;
      gainMana(state, owner, manaGain);
      appendLog(
        state,
        `${source.name} granted ${manaGain} mana to ${owner === "player" ? "you" : "the bot"}.`,
      );
      break;
    }
    case "DamageMultiple": {
      const targets =
        selectedTargets.length > 0
          ? selectedTargets
              .filter((target): target is Extract<BattleTarget, { type: "slot" }> =>
                target.type === "slot",
              )
              .map((target) => ({
                unit: getUnit(state, target.owner, target.slotIndex),
                slotIndex: target.slotIndex,
              }))
              .filter(
                (target): target is { unit: BattleUnit; slotIndex: number } =>
                  Boolean(target.unit),
              )
          : sortThreatTargets(state, opponentOf(owner)).slice(0, 2);
      for (const target of targets) {
        applyDamageToUnit(state, target.unit.owner, target.slotIndex, ability.value ?? 1, {
          sourceLabel: source.name,
        });
      }
      break;
    }
    case "Shield":
    case "ShieldAndGuard": {
      source.shieldsRemaining += ability.value ?? 0;
      appendLog(
        state,
        `${source.name} gained ${ability.value ?? 0} shield${(ability.value ?? 0) === 1 ? "" : "s"}.`,
      );
      break;
    }
    case "ShieldAllFrontline": {
      for (const { unit: ally } of getUnits(state, owner, {
        includeReserve: false,
      })) {
        if (getSlotZone(ally.slotIndex) === "Frontline") {
          ally.shieldsRemaining += ability.value ?? 0;
        }
      }
      appendLog(state, `${source.name} shielded the whole frontline.`);
      break;
    }
    case "Disable":
    case "Bind":
    case "SealAbility":
    case "Sleep":
    case "Stun":
    case "Burn":
    case "BurnAndScale":
    case "Poison":
    case "PermanentSilence":
    case "Stone": {
      const targetSlot =
        selectedTargets[0]?.type === "slot"
          ? selectedTargets[0].slotIndex
          : chooseEnemyUnitSlot(state, owner);
      if (targetSlot !== null) {
        applyStatusByAbility(
          state,
          source,
          opponentOf(owner),
          targetSlot,
          ability.type,
          ability.value,
        );
      }
      break;
    }
    case "SpawnClone": {
      source.cloneActive = true;
      source.clonePower = ability.cloneStats?.power ?? 1;
      source.cloneHP = ability.cloneStats?.hp ?? 1;
      appendLog(state, `${source.name} summoned a clone.`);
      break;
    }
    case "BuffAllAllies": {
      for (const { unit: ally } of getAllLivingUnits(state, owner)) {
        if (getSlotZone(ally.slotIndex) === "Leader") {
          continue;
        }

        const value = ability.value ?? 0;
        ally.turnPowerBonus += value;
        ally.turnHpBonus += value;
        ally.currentHP += value;
        clampUnitHp(ally);
      }
      appendLog(state, `${source.name} buffed the whole board.`);
      break;
    }
    case "CopyAbility": {
      const targetSlot =
        selectedTargets[0]?.type === "slot"
          ? selectedTargets[0].slotIndex
          : chooseEnemyUnitSlot(state, owner);
      if (targetSlot === null) {
        break;
      }

      const target = getUnit(state, opponentOf(owner), targetSlot);
      if (!target || !target.ability) {
        break;
      }

      source.copiedAbility = cloneAbility(target.ability);
      source.copiedAbilityMode = source.name === "Mewtwo" ? "add" : "replace";
      appendLog(state, `${source.name} copied ${target.name}'s ability.`);

      if (
        source.copiedAbility &&
        source.copiedAbility.trigger === "OnSummon" &&
        source.copiedAbility.type !== "CopyAbility"
      ) {
        resolveOnSummonAbility(state, owner, slotIndex, source.copiedAbility);
      }
      break;
    }
    case "SwapPositions": {
      const firstTarget = selectedTargets[0];
      const secondTarget = selectedTargets[1];

      if (
        firstTarget?.type === "slot" &&
        secondTarget?.type === "slot" &&
        isBattleSlotIndex(firstTarget.slotIndex) &&
        isBattleSlotIndex(secondTarget.slotIndex)
      ) {
        const firstUnit = getUnit(state, firstTarget.owner, firstTarget.slotIndex);
        const secondUnit = getUnit(
          state,
          secondTarget.owner,
          secondTarget.slotIndex,
        );
        if (firstUnit && secondUnit) {
          setUnit(state, firstTarget.owner, firstTarget.slotIndex, secondUnit);
          setUnit(state, secondTarget.owner, secondTarget.slotIndex, firstUnit);
          appendLog(state, `${source.name} swapped two units on the board.`);
          break;
        }
      }

      const frontline = getUnits(state, owner, {
        includeReserve: false,
      })
        .filter(({ slotIndex }) => getSlotZone(slotIndex) === "Frontline")
        .sort((left, right) => getUnitCurrentPower(left.unit) - getUnitCurrentPower(right.unit))[0];
      const backline = getUnits(state, owner, {
        includeReserve: false,
      })
        .filter(({ slotIndex }) => getSlotZone(slotIndex) === "Backline")
        .sort((left, right) => getUnitCurrentPower(right.unit) - getUnitCurrentPower(left.unit))[0];

      if (frontline && backline) {
        setUnit(state, owner, frontline.slotIndex, backline.unit);
        setUnit(state, owner, backline.slotIndex, frontline.unit);
        appendLog(state, `${source.name} swapped two friendly positions.`);
      }
      break;
    }
    case "ForceAttack": {
      const forcedOwner = opponentOf(owner);
      const forcedAttackerSlot =
        selectedTargets[0]?.type === "slot"
          ? selectedTargets[0].slotIndex
          : chooseEnemyUnitSlot(state, owner);
      if (forcedAttackerSlot === null) {
        break;
      }

      const forcedAttacker = getUnit(state, forcedOwner, forcedAttackerSlot);
      if (!forcedAttacker) {
        break;
      }

      const forcedVictimSlot =
        selectedTargets[1]?.type === "slot"
          ? selectedTargets[1].slotIndex
          : getUnits(state, forcedOwner, {
              includeReserve: false,
            })
              .filter(({ slotIndex }) => slotIndex !== forcedAttackerSlot)
              .sort((left, right) => left.unit.currentHP - right.unit.currentHP)[0]
              ?.slotIndex ?? null;
      if (forcedVictimSlot === null) {
        break;
      }

      const allyVictim = getUnit(state, forcedOwner, forcedVictimSlot);
      if (!allyVictim) {
        break;
      }

      applyDamageToUnit(
        state,
        forcedOwner,
        forcedVictimSlot,
        getUnitCurrentPower(forcedAttacker),
        {
          sourceLabel: `${source.name}'s forced attack`,
        },
      );
      appendLog(
        state,
        `${forcedAttacker.name} was forced to hit ${allyVictim.name}.`,
      );
      break;
    }
    case "DeclareElement": {
      source.declaredElement = chooseBestDeclaredElement(state, owner);
      appendLog(state, `${source.name} adapted to ${source.declaredElement}.`);
      break;
    }
    case "ConditionalDamageBoost":
      appendLog(state, `${source.name} is ready to punish low-HP enemies.`);
      break;
    default:
      break;
  }
}

function revivePendingUnits(state: BattleState, owner: Owner) {
  const remaining: PendingRevive[] = [];
  for (const revive of state.pendingRevives) {
    if (revive.owner === owner && revive.reviveTurn === state.turn) {
      if (!getUnit(state, owner, revive.slotIndex)) {
        setUnit(state, owner, revive.slotIndex, revive.unit);
        appendLog(state, `${revive.unit.name} returned with 1 HP.`);
      } else {
        remaining.push(revive);
      }
    } else {
      remaining.push(revive);
    }
  }
  state.pendingRevives = remaining;
}

function tickStartPhaseAuraEffects(state: BattleState, owner: Owner) {
  for (const { unit, slotIndex } of getAllLivingUnits(state, owner)) {
    if (!canUsePassiveAbility(state, unit)) {
      continue;
    }

    for (const ability of getTriggeredAbilities(unit, "Aura")) {
      if (ability.type === "HealAllyPerTurn") {
        if (owner === "player") {
          continue;
        }

        const targetSlot = chooseMostDamagedFriendlyUnitSlot(state, owner, {
          includeLeader: false,
          includeReserve: true,
        });
        if (targetSlot !== null) {
          const target = getUnit(state, owner, targetSlot);
          if (target) {
            healUnit(target, ability.value ?? 1);
            unit.abilityUsedThisTurn = true;
            appendLog(state, `${unit.name} healed ${target.name} for 1.`);
          }
        }
      }

      if (ability.type === "PatienceCounter") {
        unit.patienceCounter += 1;
        if (unit.patienceCounter >= 3) {
          damagePlayer(state, opponentOf(owner), ability.onTrigger?.value ?? 3);
          appendLog(state, `${unit.name} exploded for ${ability.onTrigger?.value ?? 3} direct damage.`);
          removeUnitFromBoard(state, owner, slotIndex);
        }
      }
    }
  }
}

function tickStatuses(state: BattleState, owner: Owner) {
  for (const { unit, slotIndex } of [...getAllLivingUnits(state, owner)]) {
    if (hasStatus(unit, "Burn")) {
      applyDamageToUnit(state, owner, slotIndex, 1, {
        ignoreShield: true,
        ignoreDamageReduction: true,
        sourceLabel: "Burn",
      });
      applyCharmeleonScaling(state);
      const nextDuration = (unit.statusDurations.Burn ?? 1) - 1;
      if (nextDuration <= 0) {
        removeStatus(unit, "Burn");
      } else {
        unit.statusDurations.Burn = nextDuration;
      }
    }

    if (hasStatus(unit, "Poison")) {
      applyDamageToUnit(state, owner, slotIndex, 1, {
        ignoreShield: true,
        ignoreDamageReduction: true,
        sourceLabel: "Poison",
      });
    }
  }

  for (const { unit } of getAllLivingUnits(state, owner)) {
    for (const status of ["Stun", "Sleep", "Disabled", "Sealed", "Stoned"] as const) {
      const current = unit.statusDurations[status];
      if (typeof current === "number") {
        const nextDuration = current - 1;
        if (nextDuration <= 0) {
          removeStatus(unit, status);
        } else {
          unit.statusDurations[status] = nextDuration;
        }
      }
    }
  }
}

function clearOwnerTurnBonuses(state: BattleState, owner: Owner) {
  for (const { unit } of getAllLivingUnits(state, owner)) {
    unit.turnPowerBonus = 0;
    unit.turnHpBonus = 0;
    unit.grantedRushThisTurn = false;
    unit.grantedAttackTwiceThisTurn = false;
    unit.nextAttackPowerBonus = 0;
    unit.nextAttackDamageMultiplier = 1;
    clampUnitHp(unit);
  }
}

function startTurn(state: BattleState, owner: Owner) {
  state.activePlayer = owner;
  state.phase = "Main";
  const playerState = state.players[owner];
  playerState.manaMax = getNextTurnManaMax(playerState);
  playerState.turnsStarted += 1;
  playerState.mana = playerState.manaMax;
  state.players[owner].attacksUsedThisTurn = 0;
  for (const { unit } of getAllLivingUnits(state, owner)) {
    unit.attacksThisTurn = 0;
    unit.abilityUsedThisTurn = false;
  }
  revivePendingUnits(state, owner);
  tickStartPhaseAuraEffects(state, owner);
  tickStatuses(state, owner);
  applyAuraBonuses(state);
  refreshOwnerAttackState(state, owner);
  updateWinner(state);
}

function getGuardFrontlineTargets(state: BattleState, owner: Owner) {
  return getUnits(state, owner, { includeReserve: false }).filter(
    ({ unit, slotIndex }) =>
      getSlotZone(slotIndex) === "Frontline" && hasGuard(state, unit),
  );
}

export function getAttackableSlots(state: BattleState, owner: Owner) {
  if (state.winner || state.activePlayer !== owner || state.phase !== "Battle") {
    return [] as number[];
  }

  if (getRemainingAttackAllowance(state, owner) <= 0) {
    return [] as number[];
  }

  const enemyFrontlineAlive = getUnits(state, opponentOf(owner), {
    includeReserve: false,
  }).some(({ slotIndex }) => getSlotZone(slotIndex) === "Frontline");

  const candidates = getFriendlyBattleSlots(state, owner)
    .map(({ unit, slotIndex }) => ({
      unit,
      slotIndex,
    }))
    .filter(({ unit, slotIndex }) => {
      if (!unit.canAttack) {
        return false;
      }

      if (unitIsAttackLocked(unit)) {
        return false;
      }

      if (slotIndex === 0 && enemyFrontlineAlive) {
        return false;
      }

      return unit.attacksThisTurn < getAllowedAttackCount(state, unit);
    });

  const priority = candidates.filter(({ unit }) =>
    isAttackPriorityUnit(state, unit) && unit.attacksThisTurn === 0,
  );

  return (priority.length > 0 ? priority : candidates).map(
    ({ slotIndex }) => slotIndex,
  );
}

export function getValidAttackTargets(
  state: BattleState,
  owner: Owner,
  attackerSlotIndex: number,
) {
  const attacker = getUnit(state, owner, attackerSlotIndex);
  if (!attacker) {
    return [] as BattleTarget[];
  }

  const attackableSlots = getAttackableSlots(state, owner);
  if (!attackableSlots.includes(attackerSlotIndex)) {
    return [] as BattleTarget[];
  }

  const enemy = opponentOf(owner);
  const frontline = getUnits(state, enemy, { includeReserve: false }).filter(
    ({ slotIndex }) => getSlotZone(slotIndex) === "Frontline",
  );
  const backline = getUnits(state, enemy, { includeReserve: false }).filter(
    ({ slotIndex }) => getSlotZone(slotIndex) === "Backline",
  );

  const guardTargets = getGuardFrontlineTargets(state, enemy);
  if (guardTargets.length > 0 && !ignoresGuardAndShield(state, attacker)) {
    return guardTargets.map(({ slotIndex }) => ({
      type: "slot" as const,
      owner: enemy,
      slotIndex,
    }));
  }

  const targets: BattleTarget[] = frontline.map(({ slotIndex }) => ({
    type: "slot",
    owner: enemy,
    slotIndex,
  }));

  if (frontline.length === 0 || hasBacklineStrike(state, attacker)) {
    targets.push(
      ...backline.map(({ slotIndex }) => ({
        type: "slot" as const,
        owner: enemy,
        slotIndex,
      })),
    );
  }

  const isSecondAttack = attacker.attacksThisTurn >= 1;
  if (
    frontline.length === 0 &&
    !(owner === "player" && state.turn === 1) &&
    !(
      isSecondAttack &&
      hasAttackTwice(state, attacker) &&
      attacker.ability?.secondAttackRestriction === "UnitsOnly"
    )
  ) {
    targets.push({
      type: "player",
      owner: enemy,
    });
  }

  return targets;
}

function applyRandomEffect(
  state: BattleState,
  owner: Owner,
  attackerSlotIndex: number,
  chosenTarget: BattleTarget,
) {
  const attacker = getUnit(state, owner, attackerSlotIndex);
  if (!attacker || !attacker.ability?.randomEffects?.length) {
    return;
  }

  const randomEffect =
    attacker.ability.randomEffects[
      Math.floor(Math.random() * attacker.ability.randomEffects.length)
    ];
  if (!randomEffect) {
    return;
  }

  switch (randomEffect.type) {
    case "Stun":
      if (chosenTarget.type === "slot") {
        applyStatusByAbility(
          state,
          attacker,
          chosenTarget.owner,
          chosenTarget.slotIndex,
          "Stun",
          randomEffect.value ?? 1,
        );
      }
      break;
    case "Burn":
      if (chosenTarget.type === "slot") {
        applyStatusByAbility(
          state,
          attacker,
          chosenTarget.owner,
          chosenTarget.slotIndex,
          "Burn",
          randomEffect.value ?? 1,
        );
      }
      break;
    case "Heal":
      healPlayer(state, owner, randomEffect.value ?? 1);
      appendLog(state, `${attacker.name}'s random effect restored 1 HP.`);
      break;
    case "DrawCard": {
      const manaGain = randomEffect.value ?? 1;
      gainMana(state, owner, manaGain);
      appendLog(
        state,
        `${attacker.name}'s random effect granted ${manaGain} mana.`,
      );
      break;
    }
    default:
      break;
  }
}

function consumeNinjaScroll(state: BattleState, owner: Owner) {
  for (const { unit } of getAllLivingUnits(state, owner)) {
    if (
      !unit.isSilenced &&
      !isReserveSuppressed(state, unit) &&
      hasAbilityType(unit, "NextAttackBuff") &&
      !unit.abilityUsedThisTurn
    ) {
      unit.abilityUsedThisTurn = true;
      return unit.ability?.value ?? 0;
    }
  }

  return 0;
}

function calculateAttackDamage(
  state: BattleState,
  attacker: BattleUnit,
  target: BattleTarget,
) {
  let damage = getUnitCurrentPower(attacker);
  let bonusDamage = 0;

  if (attacker.nextAttackPowerBonus > 0) {
    damage += attacker.nextAttackPowerBonus;
  }

  const ninjaScrollBuff = consumeNinjaScroll(state, attacker.owner);
  if (ninjaScrollBuff > 0) {
    damage += ninjaScrollBuff;
    appendLog(state, `Ninja Scroll gave ${attacker.name} +${ninjaScrollBuff} power.`);
  }

  for (const ability of getTriggeredAbilities(attacker, "CombatTrigger")) {
    if (ability.type === "PowerBoost") {
      const alliedBattleUnits = getFriendlyBattleSlots(state, attacker.owner);
      const otherAttacks = alliedBattleUnits.reduce((count, entry) => {
        if (entry.slotIndex === attacker.slotIndex) {
          return count;
        }
        return count + entry.unit.attacksThisTurn;
      }, 0);

      const shouldApply =
        ability.condition === "FirstAttackerThisTurn"
          ? alliedBattleUnits.every((entry) => entry.unit.attacksThisTurn === 0)
          : ability.condition === "AnotherAllyAttackedThisTurn"
            ? otherAttacks > 0
            : ability.condition === "OnlyAttackerThisTurn"
              ? otherAttacks === 0
              : false;

      if (shouldApply) {
        damage += ability.value ?? 0;
      }
    }

    if (
      ability.type === "BonusDamageVsElement" &&
      target.type === "slot" &&
      getCurrentElement(getUnit(state, target.owner, target.slotIndex)!) === "Fire"
    ) {
      bonusDamage += ability.value ?? 0;
    }
  }

  if (
    hasAbilityType(attacker, "ConditionalDamageBoost") &&
    attacker.abilityUsedThisTurn &&
    state.players[target.owner].hp <= 10 &&
    attacker.attacksThisTurn === 0
  ) {
    bonusDamage += attacker.ability?.value ?? 0;
  }

  let multiplier = attacker.nextAttackDamageMultiplier;
  if (
    hasAbilityType(attacker, "FirstAttackDouble") &&
    !attacker.doubleAttackUsed &&
    attacker.attacksThisTurn === 0
  ) {
    multiplier *= attacker.ability?.value ?? 2;
  }

  const defenderElement =
    target.type === "slot"
      ? getCurrentElement(getUnit(state, target.owner, target.slotIndex)!)
      : getCurrentElement(getUnit(state, target.owner, 0) ?? attacker);

  if (beatsElement(getCurrentElement(attacker), defenderElement)) {
    bonusDamage += 1;
  }

  return {
    damage: Math.max(0, damage + bonusDamage) * Math.max(1, multiplier),
    usedDoubleDamage:
      hasAbilityType(attacker, "FirstAttackDouble") &&
      !attacker.doubleAttackUsed &&
      attacker.attacksThisTurn === 0,
  };
}

export function executeAttack(
  state: BattleState,
  owner: Owner,
  attackerSlotIndex: number,
  target: BattleTarget,
) {
  const draft = cloneState(state);
  if (
    draft.winner ||
    draft.activePlayer !== owner ||
    draft.phase !== "Battle"
  ) {
    return state;
  }

  const attacker = getUnit(draft, owner, attackerSlotIndex);
  if (!attacker) {
    return state;
  }

  const validTargets = getValidAttackTargets(draft, owner, attackerSlotIndex);
  const isValid = validTargets.some((entry) =>
    entry.type === target.type &&
    entry.owner === target.owner &&
    (entry.type !== "slot" || target.type !== "slot" || entry.slotIndex === target.slotIndex),
  );

  if (!isValid) {
    return state;
  }

  const { damage, usedDoubleDamage } = calculateAttackDamage(
    draft,
    attacker,
    target,
  );

  attacker.attacksThisTurn += 1;
  draft.players[owner].attacksUsedThisTurn += 1;

  if (target.type === "player") {
    damagePlayer(draft, target.owner, damage);
    appendLog(
      draft,
      `${attacker.name} attacked ${target.owner === "player" ? "you" : "the bot"} for ${damage}.`,
    );
  } else {
    const targetUnit = getUnit(draft, target.owner, target.slotIndex);
    if (!targetUnit) {
      return state;
    }

    const result = applyDamageToUnit(
      draft,
      target.owner,
      target.slotIndex,
      damage,
      {
        ignoreShield: ignoresGuardAndShield(draft, attacker),
        sourceLabel: attacker.name,
      },
    );

    if (
      !result.prevented &&
      !result.destroyed &&
      canUsePassiveAbility(draft, targetUnit) &&
      hasKeyword(targetUnit, "Counter") &&
      !hasCounterImmune(draft, attacker)
    ) {
      applyDamageToUnit(draft, owner, attackerSlotIndex, getUnitCurrentPower(targetUnit), {
        sourceLabel: `${targetUnit.name}'s Counter`,
      });
    }

    if (getAbilityList(attacker).some((ability) => ability.type === "RandomEffect")) {
      applyRandomEffect(draft, owner, attackerSlotIndex, target);
    }
  }

  if (usedDoubleDamage) {
    attacker.doubleAttackUsed = true;
  }

  attacker.nextAttackPowerBonus = 0;
  attacker.nextAttackDamageMultiplier = 1;
  applyAuraBonuses(draft);
  refreshOwnerAttackState(draft, owner);
  updateWinner(draft);
  return draft;
}

function chooseBotAttackTarget(state: BattleState, attackerSlotIndex: number) {
  const targets = getValidAttackTargets(state, "bot", attackerSlotIndex);
  if (targets.length === 0) {
    return null;
  }

  const directAttack = targets.find((target) => target.type === "player");
  if (directAttack && state.players.player.hp <= 6) {
    return directAttack;
  }

  const unitTargets = targets.filter(
    (target): target is Extract<BattleTarget, { type: "slot" }> =>
      target.type === "slot",
  );
  if (unitTargets.length > 0) {
    return unitTargets.sort((left, right) => {
      const leftUnit = getUnit(state, left.owner, left.slotIndex)!;
      const rightUnit = getUnit(state, right.owner, right.slotIndex)!;

      if (leftUnit.currentHP !== rightUnit.currentHP) {
        return leftUnit.currentHP - rightUnit.currentHP;
      }

      return getUnitCurrentPower(rightUnit) - getUnitCurrentPower(leftUnit);
    })[0];
  }

  return directAttack ?? targets[0];
}

function getBattleTargetLabel(state: BattleState, target: BattleTarget) {
  if (target.type === "player") {
    return target.owner === "player" ? "your leader" : "the bot leader";
  }

  return getUnit(state, target.owner, target.slotIndex)?.name ?? "the target";
}

function chooseBotAttackSlot(state: BattleState) {
  const attackable = getAttackableSlots(state, "bot");
  if (attackable.length === 0) {
    return null;
  }

  return (
    attackable
      .map((slotIndex) => ({
        slotIndex,
        unit: getUnit(state, "bot", slotIndex)!,
      }))
      .sort((left, right) => {
        const leftIsPriority = isAttackPriorityUnit(state, left.unit) ? 0 : 1;
        const rightIsPriority = isAttackPriorityUnit(state, right.unit) ? 0 : 1;
        if (leftIsPriority !== rightIsPriority) {
          return leftIsPriority - rightIsPriority;
        }

        return getUnitCurrentPower(right.unit) - getUnitCurrentPower(left.unit);
      })[0]?.slotIndex ?? null
  );
}

export function getNextBotTurnAction(state: BattleState): BotTurnAction | null {
  if (state.winner || state.activePlayer !== "bot") {
    return null;
  }

  const nextAbility = getBotActivatableAbilitySlots(state, "bot")[0];
  if (nextAbility) {
    const selectedTargets = chooseBotAbilityTargets(state, "bot", nextAbility.slotIndex);
    return {
      type: "ability",
      slotIndex: nextAbility.slotIndex,
      selectedTargets,
      summary: `${nextAbility.unit.name} uses an ability.`,
    };
  }

  if (canUseLeaderAbility(state, "bot")) {
    const leader = getUnit(state, "bot", 0);
    return {
      type: "leader",
      summary: `${leader?.name ?? "Opponent leader"} uses a leader ability.`,
    };
  }

  if (state.phase === "Main") {
    return {
      type: "advance",
      summary: "Opponent enters Battle Phase.",
    };
  }

  const attackerSlotIndex = chooseBotAttackSlot(state);
  if (typeof attackerSlotIndex === "number") {
    const attacker = getUnit(state, "bot", attackerSlotIndex);
    const target = chooseBotAttackTarget(state, attackerSlotIndex);
    if (attacker && target) {
      return {
        type: "attack",
        slotIndex: attackerSlotIndex,
        target,
        summary: `${attacker.name} attacks ${getBattleTargetLabel(state, target)}.`,
      };
    }
  }

  return {
    type: "endTurn",
    summary: "Opponent ends turn.",
  };
}

export function applyBotTurnAction(state: BattleState, action: BotTurnAction) {
  switch (action.type) {
    case "ability":
      return activateUnitAbility(state, "bot", action.slotIndex, action.selectedTargets);
    case "leader":
      return activateLeaderAbility(state, "bot");
    case "advance":
      return advanceToBattlePhase(state, "bot");
    case "attack":
      return executeAttack(state, "bot", action.slotIndex, action.target);
    case "endTurn":
      return endTurn(state);
    default:
      return state;
  }
}

export function canUseLeaderAbility(state: BattleState, owner: Owner) {
  const leader = getUnit(state, owner, 0);
  return (
    state.activePlayer === owner &&
    state.phase === "Main" &&
    !state.leaderUsed[owner] &&
    Boolean(leader?.leaderAbility) &&
    !state.winner
  );
}

export function activateLeaderAbility(state: BattleState, owner: Owner) {
  if (!canUseLeaderAbility(state, owner)) {
    return state;
  }

  const draft = cloneState(state);
  const leader = getUnit(draft, owner, 0);
  if (!leader?.leaderAbility) {
    return state;
  }

  const value = leader.leaderAbility.value ?? 0;
  const enemy = opponentOf(owner);

  switch (leader.leaderAbility.type) {
    case "Sleep": {
      const targetSlot = chooseEnemyUnitSlot(draft, owner);
      if (targetSlot !== null) {
        applyStatusByAbility(draft, leader, enemy, targetSlot, "Sleep", value || 2);
      }
      break;
    }
    case "PowerHealthBoost": {
      const targetSlot =
        getUnits(draft, owner, {
          includeReserve: false,
        })
          .filter(({ slotIndex }) => getSlotZone(slotIndex) !== "Leader")
          .sort(
            (left, right) =>
              getUnitCurrentPower(right.unit) - getUnitCurrentPower(left.unit),
          )[0]?.slotIndex ?? null;
      if (targetSlot !== null) {
        const target = getUnit(draft, owner, targetSlot);
        if (target) {
          target.turnPowerBonus += value;
          target.turnHpBonus += value;
          target.currentHP += value;
          clampUnitHp(target);
          appendLog(draft, `${leader.name} empowered ${target.name}.`);
        }
      }
      break;
    }
    case "BuffAllAllies": {
      for (const { unit } of getAllLivingUnits(draft, owner)) {
        if (getSlotZone(unit.slotIndex) === "Leader") {
          continue;
        }
        unit.turnPowerBonus += value;
        unit.turnHpBonus += value;
        unit.currentHP += value;
        clampUnitHp(unit);
      }
      appendLog(draft, `${leader.name} rallied the whole team.`);
      break;
    }
    case "CancelAllReserve":
    case "DisableAllReserve":
      draft.reserveSuppressedUntilTurn[enemy] = draft.turn;
      appendLog(draft, `${leader.name} shut down enemy reserve abilities this turn.`);
      break;
    case "GrantAttackTwice":
      for (const { unit } of getUnits(draft, owner, {
        includeReserve: false,
      })) {
        if (getSlotZone(unit.slotIndex) === "Frontline") {
          unit.grantedAttackTwiceThisTurn = true;
        }
      }
      appendLog(draft, `${leader.name} granted frontline units a second attack.`);
      break;
    case "GrantDoubleAttack": {
      const targetSlot =
        getFriendlyBattleSlots(draft, owner)
          .sort(
            (left, right) =>
              getUnitCurrentPower(right.unit) - getUnitCurrentPower(left.unit),
          )[0]?.slotIndex ?? null;
      if (targetSlot !== null) {
        const target = getUnit(draft, owner, targetSlot);
        if (target) {
          target.nextAttackDamageMultiplier = Math.max(
            target.nextAttackDamageMultiplier,
            value || 2,
          );
          appendLog(draft, `${leader.name} doubled ${target.name}'s next attack.`);
        }
      }
      break;
    }
    case "GrantRush":
      for (const { unit } of getFriendlyBattleSlots(draft, owner)) {
        unit.grantedRushThisTurn = true;
      }
      appendLog(draft, `${leader.name} gave the team Rush.`);
      break;
    default:
      break;
  }

  draft.leaderUsed[owner] = true;
  applyAuraBonuses(draft);
  refreshOwnerAttackState(draft, owner);
  return draft;
}

export function activateUnitAbility(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
  selectedTargets: BattleTarget[] = [],
) {
  const targetState = getUnitAbilityTargetState(
    state,
    owner,
    slotIndex,
    selectedTargets,
  );
  if (!canActivateUnitAbility(state, owner, slotIndex) || !targetState.complete) {
    return state;
  }

  const draft = cloneState(state);
  const source = getUnit(draft, owner, slotIndex);
  const ability = getManualAbility(source);
  if (!source || !ability) {
    return state;
  }

  const manaCost = isDrawManaAbility(ability) ? 0 : source.mana;
  draft.players[owner].mana = Math.max(0, draft.players[owner].mana - manaCost);
  source.abilityUsedThisTurn = true;
  if (isDrawManaAbility(ability)) {
    source.lastDrawManaTurnStarted = draft.players[owner].turnsStarted;
  }
  resolveOnSummonAbility(draft, owner, slotIndex, ability, selectedTargets);
  applyAuraBonuses(draft);
  refreshOwnerAttackState(draft, owner);
  refreshOwnerAttackState(draft, opponentOf(owner));
  updateWinner(draft);
  return draft;
}

function getBotActivatableAbilitySlots(state: BattleState, owner: Owner) {
  return getUnits(state, owner, {
    includeLeader: false,
    includeReserve: true,
  })
    .map(({ slotIndex, unit }) => ({
      slotIndex,
      unit,
      ability: getManualAbility(unit),
    }))
    .filter(
      (
        entry,
      ): entry is { slotIndex: number; unit: BattleUnit; ability: CatalogAbility } =>
        Boolean(entry.ability) && canActivateUnitAbility(state, owner, entry.slotIndex),
    )
    .sort((left, right) => {
      const priority = (type: string) => {
        if (type === "DamageMultiple" || type === "Burn" || type === "BurnAndScale") return 0;
        if (
          type === "Disable" ||
          type === "Bind" ||
          type === "SealAbility" ||
          type === "Sleep" ||
          type === "Stun" ||
          type === "Stone" ||
          type === "PermanentSilence"
        ) {
          return 1;
        }
        if (
          type === "Shield" ||
          type === "ShieldAndGuard" ||
          type === "ShieldAllFrontline" ||
          type === "Heal" ||
          type === "DistributeHeal"
        ) {
          return 2;
        }
        return 3;
      };

      const delta = priority(left.ability.type) - priority(right.ability.type);
      if (delta !== 0) {
        return delta;
      }

      return right.unit.mana - left.unit.mana;
    });
}

function chooseBotAbilityTargets(
  state: BattleState,
  owner: Owner,
  slotIndex: number,
) {
  const selections: BattleTarget[] = [];

  while (true) {
    const targetState = getUnitAbilityTargetState(state, owner, slotIndex, selections);
    if (targetState.complete) {
      return selections;
    }

    const source = getUnit(state, owner, slotIndex);
    const ability = getManualAbility(source);
    if (!ability || targetState.options.length === 0) {
      return selections;
    }

    const missingHpForTarget = (target: BattleTarget) => {
      if (target.type === "player") {
        return MAX_PLAYER_HP - state.players[target.owner].hp;
      }

      const unit = getUnit(state, target.owner, target.slotIndex);
      return unit ? getMaxHp(unit) - unit.currentHP : 0;
    };

    let nextTarget =
      targetState.options.sort((left, right) => {
        if (left.type === "slot" && right.type === "slot") {
          const leftUnit = getUnit(state, left.owner, left.slotIndex);
          const rightUnit = getUnit(state, right.owner, right.slotIndex);
          if (leftUnit && rightUnit) {
            return (
              getUnitCurrentPower(rightUnit) - getUnitCurrentPower(leftUnit) ||
              leftUnit.currentHP - rightUnit.currentHP
            );
          }
        }
        return 0;
      })[0] ?? null;

    switch (ability.type) {
      case "Heal":
      case "DistributeHeal":
        nextTarget =
          targetState.options.sort(
            (left, right) => missingHpForTarget(right) - missingHpForTarget(left),
          )[0] ?? nextTarget;
        break;
      case "SwapPositions": {
        const weakFrontline = targetState.options
          .filter(
            (target): target is Extract<BattleTarget, { type: "slot" }> =>
              target.type === "slot" &&
              target.owner === owner &&
              target.slotIndex >= 1 &&
              target.slotIndex <= 3,
          )
          .sort((left, right) => {
            const leftUnit = getUnit(state, left.owner, left.slotIndex)!;
            const rightUnit = getUnit(state, right.owner, right.slotIndex)!;
            return getUnitCurrentPower(leftUnit) - getUnitCurrentPower(rightUnit);
          })[0];
        const strongBackline = targetState.options
          .filter(
            (target): target is Extract<BattleTarget, { type: "slot" }> =>
              target.type === "slot" &&
              target.owner === owner &&
              target.slotIndex >= 4 &&
              target.slotIndex <= 7,
          )
          .sort((left, right) => {
            const leftUnit = getUnit(state, left.owner, left.slotIndex)!;
            const rightUnit = getUnit(state, right.owner, right.slotIndex)!;
            return getUnitCurrentPower(rightUnit) - getUnitCurrentPower(leftUnit);
          })[0];
        nextTarget =
          selections.length === 0
            ? weakFrontline ?? strongBackline ?? nextTarget
            : strongBackline ?? weakFrontline ?? nextTarget;
        break;
      }
      case "ForceAttack":
        nextTarget =
          targetState.options.sort((left, right) => {
            const leftUnit =
              left.type === "slot" ? getUnit(state, left.owner, left.slotIndex) : null;
            const rightUnit =
              right.type === "slot" ? getUnit(state, right.owner, right.slotIndex) : null;
            if (selections.length === 0) {
              return getUnitCurrentPower(rightUnit!) - getUnitCurrentPower(leftUnit!);
            }

            return leftUnit!.currentHP - rightUnit!.currentHP;
          })[0] ?? nextTarget;
        break;
      default:
        break;
    }

    if (!nextTarget) {
      return selections;
    }

    selections.push(nextTarget);
  }
}

export function advanceToBattlePhase(state: BattleState, owner: Owner) {
  if (
    state.winner ||
    state.activePlayer !== owner ||
    state.phase !== "Main"
  ) {
    return state;
  }

  const draft = cloneState(state);
  draft.phase = "Battle";
  refreshOwnerAttackState(draft, owner);
  return draft;
}

export function endTurn(state: BattleState) {
  const draft = cloneState(state);
  if (draft.winner) {
    return draft;
  }

  const currentOwner = draft.activePlayer;
  clearOwnerTurnBonuses(draft, currentOwner);
  applyAuraBonuses(draft);

  draft.turn += 1;
  const nextOwner = opponentOf(currentOwner);
  startTurn(draft, nextOwner);
  appendLog(
    draft,
    `${nextOwner === "player" ? "Your" : "Bot"} turn ${draft.turn} started.`,
  );
  return draft;
}

export function runBotTurn(state: BattleState) {
  let next = cloneState(state);
  if (next.winner || next.activePlayer !== "bot") {
    return state;
  }

  while (!next.winner && next.activePlayer === "bot") {
    const action = getNextBotTurnAction(next);
    if (!action) {
      break;
    }

    next = applyBotTurnAction(next, action);
  }

  return next;
}

export function initializeBattleState(
  playerDeck: Array<PracticeCard | null>,
  botDeck: Array<PracticeCard | null>,
) {
  const playerBoard = padDeck(playerDeck).map((card, slotIndex) =>
    card
      ? createBattleUnit(getPracticeCardById(card.id) ?? card, "player", slotIndex)
      : null,
  );
  const botBoard = padDeck(botDeck).map((card, slotIndex) =>
    card
      ? createBattleUnit(getPracticeCardById(card.id) ?? card, "bot", slotIndex)
      : null,
  );

  const state: BattleState = {
    turn: 1,
    activePlayer: "player",
    phase: "Main",
    players: {
      player: {
        hp: MAX_PLAYER_HP,
        mana: 2,
        manaMax: 2,
        turnsStarted: 1,
        attacksUsedThisTurn: 0,
      },
      bot: {
        hp: MAX_PLAYER_HP,
        mana: 2,
        manaMax: 2,
        turnsStarted: 0,
        attacksUsedThisTurn: 0,
      },
    },
    board: {
      player: playerBoard,
      bot: botBoard,
    },
    leaderUsed: {
      player: false,
      bot: false,
    },
    reserveSuppressedUntilTurn: {
      player: null,
      bot: null,
    },
    pendingRevives: [],
    logs: [],
    winner: null,
  };

  applyAuraBonuses(state);
  syncAllLeaderHealth(state);
  refreshOwnerAttackState(state, "player");
  appendLog(state, "Practice battle started.");
  return state;
}
