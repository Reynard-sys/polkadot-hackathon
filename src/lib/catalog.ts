import cardsData from "@/data/cards.json";

export type CatalogSeedCard = (typeof cardsData)[number];

export function findSeedCardByTokenId(tokenId: number) {
  return (cardsData as CatalogSeedCard[]).find(
    (card) => Number.parseInt(card.nftTokenId, 10) === tokenId,
  );
}

export function getSeriesFromAnime(anime: string) {
  if (anime === "Naruto") return "naruto";
  if (anime === "OnePiece") return "onepiece";
  if (anime === "Pokemon") return "pokemon";
  return "custom";
}
