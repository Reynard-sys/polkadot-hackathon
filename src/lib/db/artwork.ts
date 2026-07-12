import { randomUUID } from "node:crypto";
import {
  CardInstanceStatus,
  CardSourceType,
  ListingStatus,
  OwnershipReason,
  PaymentAsset,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estimatePhpEquivalent } from "@/lib/stellar/payments";
import type { PaymentAssetCode } from "@/lib/stellar/types";

export async function publishArtwork(input: {
  walletAddress: string;
  title: string;
  artistName: string;
  description?: string;
  imageDataUrl: string;
  priceAsset: PaymentAssetCode;
  priceAmount: string;
}) {
  const owner = input.walletAddress.toUpperCase();

  return prisma.$transaction(async (tx) => {
    const catalog = await tx.cardCatalog.create({
      data: {
        slug: `artist-${randomUUID()}`,
        name: input.title,
        subtitle: input.description || `Original artwork by ${input.artistName}`,
        anime: "Original",
        sourceType: CardSourceType.artist,
        sourceName: input.artistName,
        rarity: "Original",
        zones: [],
        keywords: [],
        traits: ["Original Artwork"],
        imageUrl: input.imageDataUrl,
        playable: false,
        supplyCap: 1,
        maxSupply: 1,
      },
    });

    const instance = await tx.cardInstance.create({
      data: {
        cardCatalogId: catalog.id,
        ownerWalletAddress: owner,
        serialNumber: 1,
        status: CardInstanceStatus.listed,
      },
    });

    const listing = await tx.marketplaceListing.create({
      data: {
        cardInstanceId: instance.id,
        sellerWalletAddress: owner,
        priceAsset: input.priceAsset as PaymentAsset,
        priceAmount: input.priceAmount,
        phpEquivalent: estimatePhpEquivalent(input.priceAmount, input.priceAsset),
        status: ListingStatus.active,
      },
    });

    await tx.ownershipHistory.create({
      data: {
        cardInstanceId: instance.id,
        toWalletAddress: owner,
        reason: OwnershipReason.admin_migration,
      },
    });

    return listing;
  });
}
