"use client";

import { useMemo, useState } from "react";

type CardItem = {
  id: number;
  name: string;
  faction: string;
  accent: string;
  gradient: string;
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
    name: "Sakura Blade",
    faction: "Legendary",
    accent: "#facc15",
    gradient: "from-amber-300/90 via-rose-500/70 to-red-950/90",
  },
  {
    id: 2,
    name: "Ninja Storm",
    faction: "Common",
    accent: "#22d3ee",
    gradient: "from-cyan-300/90 via-sky-500/70 to-blue-950/90",
  },
  {
    id: 3,
    name: "Demon Rift",
    faction: "Rare",
    accent: "#f87171",
    gradient: "from-rose-300/80 via-red-500/70 to-zinc-900/90",
  },
  {
    id: 4,
    name: "Warlord",
    faction: "Rare",
    accent: "#f87171",
    gradient: "from-red-300/80 via-red-700/70 to-zinc-950/90",
  },
  {
    id: 5,
    name: "Thunder Edge",
    faction: "Common",
    accent: "#34d399",
    gradient: "from-emerald-300/90 via-teal-500/70 to-slate-900/90",
  },
  {
    id: 6,
    name: "Void Hunter",
    faction: "Legendary",
    accent: "#facc15",
    gradient: "from-yellow-300/90 via-orange-400/70 to-red-950/90",
  },
  {
    id: 7,
    name: "Frost Wing",
    faction: "Common",
    accent: "#22d3ee",
    gradient: "from-sky-300/90 via-blue-500/70 to-indigo-950/90",
  },
  {
    id: 8,
    name: "Cursed Echo",
    faction: "Rare",
    accent: "#f87171",
    gradient: "from-red-300/80 via-rose-700/70 to-zinc-950/90",
  },
  {
    id: 9,
    name: "Monk Sentinel",
    faction: "Common",
    accent: "#34d399",
    gradient: "from-lime-300/80 via-green-500/70 to-emerald-950/90",
  },
  {
    id: 10,
    name: "Sky Dancer",
    faction: "Legendary",
    accent: "#facc15",
    gradient: "from-yellow-200/90 via-amber-500/70 to-orange-950/90",
  },
];

function emptySlots() {
  return Array.from({ length: TOTAL_SLOTS }, () => null) as Array<CardItem | null>;
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_78%_58%,rgba(39,86,255,0.33),transparent_25%),radial-gradient(circle_at_20%_10%,rgba(40,73,160,0.4),transparent_32%),linear-gradient(180deg,#0b0f1f_0%,#121620_35%,#151618_100%)] pt-24 pb-28 text-white md:pb-16">
      <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <section className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Deck Builder</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-sm text-white/70 sm:text-base">
            Create your strategy deck, tune each slot, and prepare your strongest lineup for the next
            tournament.
          </p>
          <div className="mx-auto mt-7 flex w-full max-w-[760px] items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2f6dff]" />
            <div className="h-3 w-3 rotate-45 bg-[#2f6dff]" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2f6dff]" />
          </div>
        </section>

        {!isEditing && (
          <section className="mx-auto mt-9 max-w-[860px] rounded-2xl border border-[#2e4686] bg-[linear-gradient(160deg,#2d4f9b_0%,#1f3978_45%,#101738_100%)] p-7 shadow-[0_0_40px_rgba(45,98,255,0.2)] sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a2f6e] shadow-[0_4px_20px_rgba(58,113,255,0.3)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <rect x="14" y="4" width="6" height="6" rx="1" />
                <rect x="4" y="14" width="6" height="6" rx="1" />
                <rect x="14" y="14" width="6" height="6" rx="1" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold">No decks yet</h2>
            <p className="mt-2 text-center text-sm text-white/70">Create your first deck to get started.</p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={startNewDeck}
                className="rounded-full border border-[#1c50d8] bg-gradient-to-r from-[#1144b8] to-[#2768ff] px-8 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(43,118,255,0.4)] transition hover:scale-[1.02] hover:brightness-110"
              >
                + Create Deck
              </button>
            </div>
          </section>
        )}

        {isEditing && (
          <section className="mt-8 space-y-4">
            <div className="rounded-xl border border-[#2c3f75] bg-[#121a30]/90 px-4 py-3">
              <label htmlFor="deckName" className="sr-only">
                Deck Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="deckName"
                  value={deckName}
                  onChange={(event) => setDeckName(event.target.value)}
                  className="w-full rounded-lg border border-[#384f8d] bg-[#1c2746] px-3 py-2 text-sm font-semibold outline-none ring-[#4577ff] placeholder:text-white/40 focus:ring-1"
                  placeholder="My Deck"
                />
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#384f8d] bg-[#1c2746] text-xs font-semibold text-white/70">
                  EDIT
                </span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1.55fr]">
              <article className="rounded-xl border border-[#334a86] bg-[#17213b]/90 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Deck</h2>
                  <button
                    type="button"
                    onClick={clearCurrentDeck}
                    className="rounded-md bg-[#d72f3d] px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    Clear
                  </button>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg border border-[#31467f] bg-[#0f172d] p-2 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-white/60">Total Cards</p>
                    <p className="text-base font-bold">{selectedCards.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60">Deck Stats</p>
                    <p className="text-base font-bold">{TOTAL_SLOTS}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/60">Completion</p>
                    <p className="text-base font-bold">{completionRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                  {deckSlots.map((slot, index) => (
                    <button
                      type="button"
                      key={`${slot?.id ?? "empty"}-${index}`}
                      onClick={() => {
                        if (slot) {
                          removeCardFromDeck(index);
                        }
                      }}
                      className={`group relative min-h-28 overflow-hidden rounded-lg border border-[#415688] p-2 text-left ${
                        slot
                          ? `bg-gradient-to-br ${slot.gradient} shadow-[0_6px_16px_rgba(12,14,25,0.4)]`
                          : "bg-[linear-gradient(160deg,#283557_0%,#1b2541_100%)]"
                      }`}
                    >
                      {slot ? (
                        <>
                          <div
                            className="h-1.5 w-16 rounded-full"
                            style={{ backgroundColor: slot.accent }}
                            aria-hidden
                          />
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-black/75">
                            {slot.faction}
                          </p>
                          <p className="mt-1 text-sm font-bold">{slot.name}</p>
                          <p className="absolute bottom-2 right-2 text-[10px] font-semibold text-white/70 opacity-0 transition group-hover:opacity-100">
                            Remove
                          </p>
                        </>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-white/70">
                          <span className="text-4xl leading-none">+</span>
                          <span className="text-xs font-semibold">Empty Slot</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={saveDeck}
                  className="mt-3 w-full rounded-full border border-[#2156de] bg-gradient-to-r from-[#1146bc] to-[#2c70ff] py-2 text-xs font-semibold shadow-[0_6px_16px_rgba(29,93,255,0.4)] transition hover:brightness-110"
                >
                  Save Deck
                </button>
              </article>

              <article className="rounded-xl border border-[#334a86] bg-[#17213b]/90 p-3">
                <h2 className="mb-3 text-lg font-semibold">Available Cards</h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                  {AVAILABLE_CARDS.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => addCardToDeck(card)}
                      className={`group relative min-h-28 overflow-hidden rounded-lg border border-[#43598b] bg-gradient-to-br ${card.gradient} p-2 text-left shadow-[0_4px_14px_rgba(12,14,25,0.4)] transition hover:-translate-y-0.5`}
                    >
                      <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: card.accent }} aria-hidden />
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-black/75">{card.faction}</p>
                      <p className="mt-1 text-sm font-bold">{card.name}</p>
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-white/80 opacity-0 transition group-hover:opacity-100">
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {!isEditing && savedDecks.length > 0 && (
          <section className="mt-8 space-y-4">
            {savedDecks.map((deck) => {
              const filledSlots = deck.cards.filter((card): card is CardItem => card !== null).length;
              const savedDeckCompletion = Math.round((filledSlots / TOTAL_SLOTS) * 100);

              return (
                <article
                  key={deck.id}
                  className="rounded-xl border border-[#324881] bg-[#16213a]/90 p-4 shadow-[0_10px_22px_rgba(2,10,32,0.35)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{deck.name}</h3>
                      <p className="text-xs text-white/70">
                        {filledSlots}/{TOTAL_SLOTS} cards | Completion rate {savedDeckCompletion}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editDeck(deck)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#214fc4] text-sm"
                        aria-label={`Edit ${deck.name}`}
                      >
                        E
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDeck(deck.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#d73444] text-sm"
                        aria-label={`Delete ${deck.name}`}
                      >
                        X
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
                    {deck.cards.map((card, index) => (
                      <div
                        key={`${deck.id}-${card?.id ?? "empty"}-${index}`}
                        className={`min-h-16 rounded-md border border-[#42598b] ${
                          card ? `bg-gradient-to-br ${card.gradient}` : "bg-[#222d4a]"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => editDeck(deck)}
                      className="w-full rounded-full border border-[#2055de] bg-gradient-to-r from-[#1144ba] to-[#2d6fff] py-2 text-sm font-semibold"
                    >
                      Edit Deck
                    </button>
                  </div>
                </article>
              );
            })}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={startNewDeck}
                className="rounded-full border border-[#2055de] bg-gradient-to-r from-[#1144ba] to-[#2d6fff] px-8 py-2 text-sm font-semibold"
              >
                + Create Deck
              </button>
            </div>
          </section>
        )}
      </div>

      <nav className="fixed right-0 bottom-0 left-0 border-t border-white/10 bg-[#171b24] px-4 py-2 md:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-5 text-[11px] text-white/70">
          {["Home", "Marketplace", "Gacha", "Deck", "Tournament"].map((item) => (
            <li key={item} className="flex flex-col items-center justify-center gap-1 py-1">
              <span className="h-1.5 w-6 rounded-full bg-white/20" />
              <span className={item === "Deck" ? "font-semibold text-white" : ""}>{item}</span>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
