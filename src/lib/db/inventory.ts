import { CardInstanceStatus } from "@prisma/client";
import type { InventoryCardInstanceDto } from "@/lib/stellar/types";
import { prisma } from "@/lib/prisma";
import { findSeedCardByTokenId } from "@/lib/catalog";
import { getFastCardImageUrl } from "@/lib/card-images";

function hydrateInventoryDto(item: Awaited<ReturnType<typeof fetchInventoryInstances>>[number], issuedCount: number | null): InventoryCardInstanceDto {
  const tokenId = item.cardCatalog.tokenId ?? null;
  const seedCard = tokenId ? findSeedCardByTokenId(tokenId) : null;

  return {
    instanceId: item.id,
    catalogId: item.cardCatalogId,
    tokenId,
    serialNumber: item.serialNumber ?? null,
    status: item.status,
    ownerWalletAddress: item.ownerWalletAddress,
    name: item.cardCatalog.name,
    subtitle: item.cardCatalog.subtitle ?? null,
    anime: item.cardCatalog.anime,
    rarity: item.cardCatalog.rarity,
    element: item.cardCatalog.element ?? null,
    mana: item.cardCatalog.mana ?? null,
    power: item.cardCatalog.power ?? null,
    hp: item.cardCatalog.hp ?? null,
    zone: item.cardCatalog.zone ?? null,
    zones: Array.isArray(item.cardCatalog.zones) ? (item.cardCatalog.zones as string[]) : [],
    leaderEligible: item.cardCatalog.leaderEligible,
    traits: Array.isArray(item.cardCatalog.traits) ? (item.cardCatalog.traits as string[]) : [],
    ability: item.cardCatalog.ability ?? seedCard?.ability ?? null,
    leaderAbility: item.cardCatalog.leaderAbility ?? seedCard?.leaderAbility ?? null,
    imageUrl: getFastCardImageUrl(item.cardCatalog.imageUrl),
    sourceType: item.cardCatalog.sourceType,
    sourceName: item.cardCatalog.sourceName,
    playable: item.cardCatalog.playable,
    supplyCap: item.cardCatalog.supplyCap ?? item.cardCatalog.maxSupply ?? null,
    issuedCount,
    listing: item.listing
      ? {
          id: item.listing.id,
          priceAsset: item.listing.priceAsset,
          priceAmount: item.listing.priceAmount,
          phpEquivalent: item.listing.phpEquivalent ?? null,
          status: item.listing.status,
        }
      : null,
  };
}

async function fetchInventoryInstances(walletAddress: string) {
  return prisma.cardInstance.findMany({
    where: {
      ownerWalletAddress: walletAddress.toUpperCase(),
      status: { in: [CardInstanceStatus.owned, CardInstanceStatus.listed, CardInstanceStatus.locked] },
    },
    orderBy: [{ acquiredAt: "desc" }],
    include: {
      cardCatalog: true,
      listing: true,
    },
  });
}

export async function getInventoryForWallet(walletAddress: string): Promise<InventoryCardInstanceDto[]> {
  const items = await fetchInventoryInstances(walletAddress);
  const groupedCounts = await prisma.cardInstance.groupBy({
    by: ["cardCatalogId"],
    where: {
      cardCatalogId: { in: items.map((item) => item.cardCatalogId) },
      status: { in: [CardInstanceStatus.owned, CardInstanceStatus.listed, CardInstanceStatus.locked] },
    },
    _count: true,
  });
  const issuedCounts = new Map(groupedCounts.map((entry) => [entry.cardCatalogId, entry._count]));

  return items.map((item) => hydrateInventoryDto(item, issuedCounts.get(item.cardCatalogId) ?? null));
}

export async function migrateLegacyInventory(walletAddress: string, tokenIds: number[]) {
  const normalizedWallet = walletAddress.toUpperCase();
  const user = await prisma.user.findUnique({ where: { walletAddress: normalizedWallet } });
  if (user?.inventoryMigratedAt) {
    throw new Error("Legacy inventory has already been migrated.");
  }

  const catalog = await prisma.cardCatalog.findMany({
    where: { tokenId: { in: tokenIds } },
  });
  const catalogByTokenId = new Map(catalog.map((item) => [item.tokenId, item]));

  await prisma.$transaction(async (tx) => {
    const instances = tokenIds.flatMap((tokenId) => {
      const card = catalogByTokenId.get(tokenId);
      return card
        ? [{
            cardCatalogId: card.id,
            ownerWalletAddress: normalizedWallet,
            status: CardInstanceStatus.owned,
          }]
        : [];
    });

    const created = instances.length > 0
      ? await tx.cardInstance.createManyAndReturn({
          data: instances,
          select: { id: true },
        })
      : [];

    if (created.length > 0) {
      await tx.ownershipHistory.createMany({
        data: created.map((instance) => ({
          cardInstanceId: instance.id,
          toWalletAddress: normalizedWallet,
          reason: "admin_migration",
        })),
      });
    }

    await tx.user.upsert({
      where: { walletAddress: normalizedWallet },
      update: { inventoryMigratedAt: new Date() },
      create: { walletAddress: normalizedWallet, inventoryMigratedAt: new Date() },
    });
  }, {
    // Supabase adds network latency; leave enough time for a large legacy import.
    maxWait: 10_000,
    timeout: 30_000,
  });
}
