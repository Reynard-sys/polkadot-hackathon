import { Prisma, PrismaClient, CardSourceType } from "@prisma/client";
import cardsData from "../src/data/cards.json";

const prisma = new PrismaClient();

type SeedCard = {
  id: string;
  nftTokenId?: string;
  name: string;
  subtitle?: string;
  anime: string;
  rarity: string;
  mana?: number;
  power?: number;
  hp?: number;
  element?: string;
  zone?: string;
  zones?: string[];
  leaderEligible?: boolean;
  keywords?: string[];
  ability?: unknown;
  leaderAbility?: unknown;
  traits?: string[];
  imageUrl: string;
  maxSupply?: number;
};

function determineSourceName(anime: string) {
  if (anime === "Naruto") return "Naruto Demo Drop";
  if (anime === "OnePiece") return "One Piece Demo Drop";
  if (anime === "Pokemon") return "Pokemon Demo Drop";
  return "Aniverse Demo Drop";
}

async function main() {
  const cards = cardsData as SeedCard[];

  await prisma.cardCatalog.createMany({
    data: cards.map((card) => ({
      slug: card.id,
      tokenId: card.nftTokenId ? Number.parseInt(card.nftTokenId, 10) : null,
      name: card.name,
      subtitle: card.subtitle ?? null,
      anime: card.anime,
      sourceType: CardSourceType.demo,
      sourceName: determineSourceName(card.anime),
      rarity: card.rarity,
      element: card.element ?? null,
      mana: card.mana ?? null,
      power: card.power ?? null,
      hp: card.hp ?? null,
      zone: card.zone ?? null,
      zones: card.zones ?? (card.zone ? [card.zone] : []),
      leaderEligible: card.leaderEligible ?? false,
      keywords: card.keywords ?? [],
      ability: (card.ability ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      leaderAbility: (card.leaderAbility ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      traits: card.traits ?? [],
      imageUrl: card.imageUrl,
      playable: true,
      supplyCap: card.maxSupply ?? null,
      maxSupply: card.maxSupply ?? null,
    })),
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
