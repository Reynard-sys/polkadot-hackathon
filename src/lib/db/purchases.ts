import {
  CardInstanceStatus,
  OwnershipReason,
  PackPurchaseStatus,
  PaymentAsset,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPackPhpEquivalent, getPackPrice } from "@/lib/stellar/payments";
import type { PackTier, PaymentAssetCode } from "@/lib/stellar/types";
import cardsData from "@/data/cards.json";

type SeedCard = (typeof cardsData)[number];

function getSeriesCards(seriesOrDropId: string) {
  const series =
    seriesOrDropId === "naruto" || seriesOrDropId === "onepiece" || seriesOrDropId === "pokemon"
      ? seriesOrDropId
      : "naruto";

  const mappedAnime =
    series === "onepiece" ? "OnePiece" : series === "pokemon" ? "Pokemon" : "Naruto";

  return (cardsData as SeedCard[]).filter((card) => card.anime === mappedAnime);
}

function cardsPerPack(packTier: PackTier) {
  if (packTier === "standard") return 10;
  if (packTier === "premium") return 20;
  return 30;
}

function pickPackCards(seriesOrDropId: string, packTier: PackTier) {
  const pool = getSeriesCards(seriesOrDropId);
  const count = cardsPerPack(packTier);
  const selected: SeedCard[] = [];

  for (let index = 0; index < count; index += 1) {
    selected.push(pool[index % pool.length]);
  }

  return selected;
}

export async function createPackCheckout(input: {
  walletAddress: string;
  seriesOrDropId: string;
  packTier: PackTier;
  paymentAsset: PaymentAssetCode;
}) {
  const memo = `pack:${crypto.randomUUID()}`;
  const amount = getPackPrice(input.packTier, input.paymentAsset);
  const phpEquivalent = getPackPhpEquivalent(input.packTier);

  const created = await prisma.packPurchase.create({
    data: {
      buyerWalletAddress: input.walletAddress.toUpperCase(),
      seriesOrDropId: input.seriesOrDropId,
      packTier: input.packTier,
      paymentAsset: input.paymentAsset as PaymentAsset,
      amount,
      phpEquivalent,
      memo,
      status: PackPurchaseStatus.pending,
    },
  });

  return {
    purchase: created,
    amount,
    phpEquivalent,
    memo,
  };
}

export async function fulfillPackPurchase(input: {
  checkoutId: string;
  transactionHash: string;
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.packPurchase.findUnique({
      where: { id: input.checkoutId },
      include: { cardInstances: true },
    });

    if (!purchase) {
      throw new Error("Pack checkout not found.");
    }

    if (purchase.stellarTransactionHash && purchase.stellarTransactionHash !== input.transactionHash) {
      throw new Error("Pack checkout already used by another transaction.");
    }

    if (purchase.status === PackPurchaseStatus.fulfilled) {
      return {
        purchaseId: purchase.id,
        tokenIds: purchase.cardInstances.map((item) => item.serialNumber ?? 0),
        cardInstanceIds: purchase.cardInstances.map((item) => item.id),
        series: purchase.seriesOrDropId,
        packTier: purchase.packTier,
      };
    }

    const pulledCards = pickPackCards(purchase.seriesOrDropId, purchase.packTier as PackTier);
    const tokenIds: number[] = [];
    const cardInstanceIds: string[] = [];

    for (const card of pulledCards) {
      const tokenId = Number.parseInt(card.nftTokenId, 10);
      const catalog = await tx.cardCatalog.findUnique({
        where: { tokenId },
      });
      if (!catalog) continue;

      const issuedCount = await tx.cardInstance.count({
        where: { cardCatalogId: catalog.id },
      });

      const created = await tx.cardInstance.create({
        data: {
          cardCatalogId: catalog.id,
          ownerWalletAddress: purchase.buyerWalletAddress,
          packPurchaseId: purchase.id,
          sourceDropId: null,
          serialNumber: issuedCount + 1,
          status: CardInstanceStatus.owned,
        },
      });

      await tx.ownershipHistory.create({
        data: {
          cardInstanceId: created.id,
          toWalletAddress: purchase.buyerWalletAddress,
          reason: OwnershipReason.pack_opening,
          relatedTransactionHash: input.transactionHash,
        },
      });

      tokenIds.push(tokenId);
      cardInstanceIds.push(created.id);
    }

    await tx.packPurchase.update({
      where: { id: purchase.id },
      data: {
        stellarTransactionHash: input.transactionHash,
        status: PackPurchaseStatus.fulfilled,
      },
    });

    return {
      purchaseId: purchase.id,
      tokenIds,
      cardInstanceIds,
      series: purchase.seriesOrDropId,
      packTier: purchase.packTier,
    };
  });
}
