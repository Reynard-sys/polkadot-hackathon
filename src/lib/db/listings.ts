import {
  CardInstanceStatus,
  ListingStatus,
  MarketplacePurchaseStatus,
  OwnershipReason,
  PaymentAsset,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PaymentAssetCode } from "@/lib/stellar/types";
import { estimatePhpEquivalent } from "@/lib/stellar/payments";

export async function getActiveListings() {
  const listings = await prisma.marketplaceListing.findMany({
    where: { status: ListingStatus.active },
    orderBy: { createdAt: "desc" },
    include: {
      cardInstance: {
        include: {
          cardCatalog: true,
        },
      },
    },
  });

  return Promise.all(
    listings.map(async (listing) => {
      const issuedCount = await prisma.cardInstance.count({
        where: { cardCatalogId: listing.cardInstance.cardCatalogId },
      });

      return {
        id: listing.id,
        sellerWalletAddress: listing.sellerWalletAddress,
        priceAsset: listing.priceAsset,
        priceAmount: listing.priceAmount,
        phpEquivalent: listing.phpEquivalent,
        status: listing.status,
        cardInstance: {
          id: listing.cardInstance.id,
          serialNumber: listing.cardInstance.serialNumber,
          ownerWalletAddress: listing.cardInstance.ownerWalletAddress,
          tokenId: listing.cardInstance.cardCatalog.tokenId,
          name: listing.cardInstance.cardCatalog.name,
          subtitle: listing.cardInstance.cardCatalog.subtitle,
          anime: listing.cardInstance.cardCatalog.anime,
          rarity: listing.cardInstance.cardCatalog.rarity,
          element: listing.cardInstance.cardCatalog.element,
          mana: listing.cardInstance.cardCatalog.mana,
          power: listing.cardInstance.cardCatalog.power,
          hp: listing.cardInstance.cardCatalog.hp,
          zone: listing.cardInstance.cardCatalog.zone,
          zones: Array.isArray(listing.cardInstance.cardCatalog.zones)
            ? (listing.cardInstance.cardCatalog.zones as string[])
            : [],
          leaderEligible: listing.cardInstance.cardCatalog.leaderEligible,
          traits: Array.isArray(listing.cardInstance.cardCatalog.traits)
            ? (listing.cardInstance.cardCatalog.traits as string[])
            : [],
          imageUrl: listing.cardInstance.cardCatalog.imageUrl,
          sourceType: listing.cardInstance.cardCatalog.sourceType,
          sourceName: listing.cardInstance.cardCatalog.sourceName,
          playable: listing.cardInstance.cardCatalog.playable,
          supplyCap:
            listing.cardInstance.cardCatalog.supplyCap ??
            listing.cardInstance.cardCatalog.maxSupply,
          issuedCount,
        },
      };
    }),
  );
}

export async function createListing(input: {
  walletAddress: string;
  cardInstanceId: string;
  priceAsset: PaymentAssetCode;
  priceAmount: string;
}) {
  const instance = await prisma.cardInstance.findUnique({
    where: { id: input.cardInstanceId },
    include: { listing: true },
  });
  if (!instance) throw new Error("Card instance not found.");
  if (instance.ownerWalletAddress !== input.walletAddress.toUpperCase()) {
    throw new Error("You do not own this card.");
  }
  if (instance.status !== CardInstanceStatus.owned) {
    throw new Error("This card is not available to list.");
  }
  if (instance.listing?.status === ListingStatus.active) {
    throw new Error("This card is already listed.");
  }

  return prisma.$transaction(async (tx) => {
    const listing = await tx.marketplaceListing.create({
      data: {
        cardInstanceId: instance.id,
        sellerWalletAddress: input.walletAddress.toUpperCase(),
        priceAsset: input.priceAsset as PaymentAsset,
        priceAmount: input.priceAmount,
        phpEquivalent: estimatePhpEquivalent(input.priceAmount, input.priceAsset),
        status: ListingStatus.active,
      },
    });

    await tx.cardInstance.update({
      where: { id: instance.id },
      data: { status: CardInstanceStatus.listed },
    });

    return listing;
  });
}

export async function cancelListing(input: { walletAddress: string; listingId: string }) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: input.listingId },
  });
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerWalletAddress !== input.walletAddress.toUpperCase()) {
    throw new Error("Only the seller can cancel this listing.");
  }
  if (listing.status !== ListingStatus.active) {
    throw new Error("Only active listings can be cancelled.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.marketplaceListing.update({
      where: { id: listing.id },
      data: { status: ListingStatus.cancelled },
    });

    await tx.cardInstance.update({
      where: { id: listing.cardInstanceId },
      data: { status: CardInstanceStatus.owned },
    });
  });
}

export async function createMarketplaceCheckout(input: {
  walletAddress: string;
  listingId: string;
  paymentAsset: PaymentAssetCode;
}) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: input.listingId },
  });
  if (!listing) throw new Error("Listing not found.");
  if (listing.sellerWalletAddress === input.walletAddress.toUpperCase()) {
    throw new Error("You cannot buy your own listing.");
  }
  if (listing.status !== ListingStatus.active) {
    throw new Error("Listing is no longer active.");
  }
  if (listing.priceAsset !== input.paymentAsset) {
    throw new Error(`This listing must be paid in ${listing.priceAsset}.`);
  }

  const memo = `market:${crypto.randomUUID()}`;

  const created = await prisma.marketplacePurchase.create({
    data: {
      listingId: listing.id,
      cardInstanceId: listing.cardInstanceId,
      buyerWalletAddress: input.walletAddress.toUpperCase(),
      sellerWalletAddress: listing.sellerWalletAddress,
      paymentAsset: input.paymentAsset as PaymentAsset,
      amount: listing.priceAmount,
      memo,
      status: MarketplacePurchaseStatus.pending,
    },
  });

  return {
    checkoutId: created.id,
    amount: listing.priceAmount,
    phpEquivalent: listing.phpEquivalent ?? estimatePhpEquivalent(listing.priceAmount, input.paymentAsset),
    memo,
    recipient: listing.sellerWalletAddress,
  };
}

export async function fulfillMarketplacePurchase(input: {
  checkoutId: string;
  transactionHash: string;
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.marketplacePurchase.findUnique({
      where: { id: input.checkoutId },
      include: { listing: true, cardInstance: true },
    });
    if (!purchase) throw new Error("Marketplace checkout not found.");
    if (purchase.listing.status !== ListingStatus.active) {
      throw new Error("Listing is no longer active.");
    }
    if (purchase.status === MarketplacePurchaseStatus.settled) {
      return purchase;
    }

    await tx.marketplacePurchase.update({
      where: { id: purchase.id },
      data: {
        stellarTransactionHash: input.transactionHash,
        status: MarketplacePurchaseStatus.settled,
      },
    });

    await tx.marketplaceListing.update({
      where: { id: purchase.listingId },
      data: { status: ListingStatus.sold },
    });

    await tx.cardInstance.update({
      where: { id: purchase.cardInstanceId },
      data: {
        ownerWalletAddress: purchase.buyerWalletAddress,
        status: CardInstanceStatus.owned,
      },
    });

    await tx.ownershipHistory.create({
      data: {
        cardInstanceId: purchase.cardInstanceId,
        fromWalletAddress: purchase.sellerWalletAddress,
        toWalletAddress: purchase.buyerWalletAddress,
        reason: OwnershipReason.marketplace_purchase,
        relatedTransactionHash: input.transactionHash,
      },
    });

    return tx.marketplacePurchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
  });
}
