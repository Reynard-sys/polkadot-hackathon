-- CreateEnum
CREATE TYPE "public"."CardSourceType" AS ENUM ('demo', 'artist', 'ip');

-- CreateEnum
CREATE TYPE "public"."DropStatus" AS ENUM ('draft', 'published', 'paused', 'sold_out');

-- CreateEnum
CREATE TYPE "public"."CardInstanceStatus" AS ENUM ('owned', 'listed', 'locked', 'burned');

-- CreateEnum
CREATE TYPE "public"."PaymentAsset" AS ENUM ('XLM', 'USDC');

-- CreateEnum
CREATE TYPE "public"."PackPurchaseStatus" AS ENUM ('pending', 'paid', 'failed', 'fulfilled');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('active', 'sold', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."MarketplacePurchaseStatus" AS ENUM ('pending', 'paid', 'settled', 'failed');

-- CreateEnum
CREATE TYPE "public"."OwnershipReason" AS ENUM ('pack_opening', 'marketplace_purchase', 'admin_migration');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "inventoryMigratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardCatalog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tokenId" INTEGER,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "anime" TEXT NOT NULL,
    "sourceType" "public"."CardSourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "element" TEXT,
    "mana" INTEGER,
    "power" INTEGER,
    "hp" INTEGER,
    "zone" TEXT,
    "zones" JSONB NOT NULL,
    "leaderEligible" BOOLEAN NOT NULL DEFAULT false,
    "keywords" JSONB NOT NULL,
    "ability" JSONB,
    "leaderAbility" JSONB,
    "traits" JSONB NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "playable" BOOLEAN NOT NULL DEFAULT true,
    "supplyCap" INTEGER,
    "maxSupply" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardDrop" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creatorWalletAddress" TEXT,
    "sourceType" "public"."CardSourceType" NOT NULL,
    "status" "public"."DropStatus" NOT NULL DEFAULT 'published',
    "priceXlm" TEXT,
    "priceUsdc" TEXT,
    "phpDisplayPrice" DOUBLE PRECISION,
    "supplyCap" INTEGER,
    "issuedCount" INTEGER NOT NULL DEFAULT 0,
    "oddsConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardDrop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CardInstance" (
    "id" TEXT NOT NULL,
    "cardCatalogId" TEXT NOT NULL,
    "ownerWalletAddress" TEXT NOT NULL,
    "sourceDropId" TEXT,
    "packPurchaseId" TEXT,
    "serialNumber" INTEGER,
    "status" "public"."CardInstanceStatus" NOT NULL DEFAULT 'owned',
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackPurchase" (
    "id" TEXT NOT NULL,
    "buyerWalletAddress" TEXT NOT NULL,
    "seriesOrDropId" TEXT NOT NULL,
    "packTier" TEXT NOT NULL,
    "paymentAsset" "public"."PaymentAsset" NOT NULL,
    "amount" TEXT NOT NULL,
    "phpEquivalent" DOUBLE PRECISION,
    "stellarTransactionHash" TEXT,
    "memo" TEXT NOT NULL,
    "status" "public"."PackPurchaseStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketplaceListing" (
    "id" TEXT NOT NULL,
    "cardInstanceId" TEXT NOT NULL,
    "sellerWalletAddress" TEXT NOT NULL,
    "priceAsset" "public"."PaymentAsset" NOT NULL,
    "priceAmount" TEXT NOT NULL,
    "phpEquivalent" DOUBLE PRECISION,
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "cardInstanceId" TEXT NOT NULL,
    "buyerWalletAddress" TEXT NOT NULL,
    "sellerWalletAddress" TEXT NOT NULL,
    "paymentAsset" "public"."PaymentAsset" NOT NULL,
    "amount" TEXT NOT NULL,
    "stellarTransactionHash" TEXT,
    "memo" TEXT NOT NULL,
    "status" "public"."MarketplacePurchaseStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OwnershipHistory" (
    "id" TEXT NOT NULL,
    "cardInstanceId" TEXT NOT NULL,
    "fromWalletAddress" TEXT,
    "toWalletAddress" TEXT NOT NULL,
    "reason" "public"."OwnershipReason" NOT NULL,
    "relatedTransactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CardCatalog_slug_key" ON "public"."CardCatalog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CardCatalog_tokenId_key" ON "public"."CardCatalog"("tokenId");

-- CreateIndex
CREATE INDEX "CardInstance_ownerWalletAddress_status_idx" ON "public"."CardInstance"("ownerWalletAddress", "status");

-- CreateIndex
CREATE INDEX "CardInstance_cardCatalogId_idx" ON "public"."CardInstance"("cardCatalogId");

-- CreateIndex
CREATE UNIQUE INDEX "PackPurchase_stellarTransactionHash_key" ON "public"."PackPurchase"("stellarTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "PackPurchase_memo_key" ON "public"."PackPurchase"("memo");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceListing_cardInstanceId_key" ON "public"."MarketplaceListing"("cardInstanceId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_status_createdAt_idx" ON "public"."MarketplaceListing"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePurchase_listingId_key" ON "public"."MarketplacePurchase"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePurchase_cardInstanceId_key" ON "public"."MarketplacePurchase"("cardInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePurchase_stellarTransactionHash_key" ON "public"."MarketplacePurchase"("stellarTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplacePurchase_memo_key" ON "public"."MarketplacePurchase"("memo");

-- CreateIndex
CREATE INDEX "OwnershipHistory_cardInstanceId_createdAt_idx" ON "public"."OwnershipHistory"("cardInstanceId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."CardInstance" ADD CONSTRAINT "CardInstance_cardCatalogId_fkey" FOREIGN KEY ("cardCatalogId") REFERENCES "public"."CardCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardInstance" ADD CONSTRAINT "CardInstance_sourceDropId_fkey" FOREIGN KEY ("sourceDropId") REFERENCES "public"."CardDrop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CardInstance" ADD CONSTRAINT "CardInstance_packPurchaseId_fkey" FOREIGN KEY ("packPurchaseId") REFERENCES "public"."PackPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_cardInstanceId_fkey" FOREIGN KEY ("cardInstanceId") REFERENCES "public"."CardInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."MarketplaceListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MarketplacePurchase" ADD CONSTRAINT "MarketplacePurchase_cardInstanceId_fkey" FOREIGN KEY ("cardInstanceId") REFERENCES "public"."CardInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OwnershipHistory" ADD CONSTRAINT "OwnershipHistory_cardInstanceId_fkey" FOREIGN KEY ("cardInstanceId") REFERENCES "public"."CardInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
