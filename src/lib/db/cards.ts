import { prisma } from "@/lib/prisma";

export async function getCatalogCountsByCardIds(cardIds: string[]) {
  const grouped = await prisma.cardInstance.groupBy({
    by: ["cardCatalogId"],
    where: {
      cardCatalogId: { in: cardIds },
      status: { in: ["owned", "listed", "locked"] },
    },
    _count: true,
  });

  return new Map(grouped.map((entry) => [entry.cardCatalogId, entry._count]));
}
