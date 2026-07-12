# Aniverse Nexus Stellar Implementation Plan

## Document Purpose

This document defines the first implementation phase for converting Aniverse Nexus from its current Polkadot/Westend/Solidity live-pack direction into a Stellar-powered TCG collectible marketplace.

The goal is to keep the existing product experience and UI direction intact while replacing the blockchain/payment layer, adding real backend ownership, enabling real marketplace transactions, improving collector transparency, and allowing creator/IP cards to participate in crossover battles.

This plan intentionally avoids a full UI redesign. Any new UI elements should reuse the existing component style, spacing, buttons, cards, modals, typography, and layout patterns already present in the codebase.

---

## 1. Implementation Scope

### Included In This Phase

1. Remove Polkadot, Westend, and Solidity live-pack flow.
2. Add Stellar wallet connection.
3. Add Stellar checkout for pack purchases using XLM and Stellar USDC.
4. Add hybrid ownership model.
5. Add backend database ownership.
6. Replace mock marketplace with real listings and purchases.
7. Add transparent odds and supply display.
8. Add crossover battle support for creator/IP cards.

### Not Included In This Phase

The following are intentionally deferred to avoid MVP bloat:

- Full RBAC or permission matrix.
- Full on-chain card ownership.
- Soroban marketplace contracts.
- Automatic artist payout system.
- Creator earnings dashboard.
- Resale royalty logic.
- Tournament upgrades.
- PvP battle mode.
- Major UI redesign.
- New visual design system.

---

## 2. Product Direction

Aniverse Nexus will be repositioned as a Stellar-powered TCG collectible marketplace where collectors can buy card packs, reveal cards, trade duplicates, and use cards in crossover battles.

Cards may come from:

- Local artists.
- Creator collections.
- Anime/show/IP-style card providers.
- Existing demo collections.

The product should still feel like a TCG game, but the first implementation phase should prioritize payment, ownership, marketplace, and transparency.

---

## 3. Existing UI Preservation Rule

Do not redesign the UI.

When new UI is needed, reuse existing patterns from current pages:

- Existing buttons.
- Existing card layouts.
- Existing modal styles.
- Existing filter and sorting patterns.
- Existing marketplace card format.
- Existing inventory card format.
- Existing pack opening flow layout.
- Existing reveal animations and inventory visual language.

New UI should feel like it was already part of the app.

Examples:

- Stellar checkout should appear as a modal or step inside the existing pack opening flow.
- Marketplace listing creation should reuse existing card/detail modal patterns.
- Odds and supply display should be added as small info blocks, badges, or expandable details inside the existing pack/card UI.
- Crossover battle labels should be small badges on cards, not a new layout system.

---

## 4. Remove Polkadot / Westend / Solidity Live-Pack Flow

### Goal

Remove the current Polkadot EVM live-pack payment dependency and replace it with Stellar payment settlement.

### Remove Or Deprecate

Remove or archive the following from the active MVP path:

- Westend AssetHub network switching.
- `switchToWestend` utility/function.
- Polkadot RPC configuration.
- Subscan explorer configuration.
- Frontier gas settings.
- Polkadot EVM dApp language.
- MetaMask-only live pack payment assumptions.
- Solidity contract-backed live pack opening as the main pack purchase flow.
- `NEXT_PUBLIC_GACHA_NFT_ADDRESS` as an active frontend requirement.
- `NEXT_PUBLIC_GACHA_PACK_ADDRESS` as an active frontend requirement.
- Hardhat deployment scripts from the active MVP flow.
- Solidity live minting assumptions from pack opening.
- `CardRegistry.sol`, `GachaNFT.sol`, and `GachaPack.sol` as required runtime dependencies.

These files may remain in an archived folder or legacy contract directory if useful for reference, but they must not be required for the new Stellar MVP flow.

### Replace With

- Stellar wallet connection.
- Stellar payment request creation.
- Stellar payment verification.
- Backend pack result generation.
- Backend card ownership assignment.

### Acceptance Criteria

- App no longer requires Polkadot/Westend environment variables for pack purchases.
- App no longer attempts to switch to Westend before opening packs.
- App no longer uses Solidity contract calls for active pack purchase flow.
- Documentation and UI copy no longer describe the product as a Polkadot EVM dApp.
- Pack purchase flow uses Stellar payment confirmation before card reveal.

---

## 5. Stellar Wallet Connection

### Goal

Add a Stellar wallet layer that supports user identity, checkout, and transaction signing.

### Requirements

The wallet layer should support:

- Connect Stellar-compatible wallet.
- Disconnect wallet.
- Store connected public key/address.
- Show truncated wallet address.
- Provide wallet connection state globally.
- Require connected wallet for paid pack purchases.
- Require connected wallet for listing and buying marketplace cards.

### Suggested Structure

```txt
src/context/stellar-wallet-context.tsx
src/hooks/useStellarWallet.ts
src/lib/stellar/wallet.ts
src/lib/stellar/types.ts
```

### Wallet Context Shape

```ts
type StellarWalletContextValue = {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  truncateAddress: (address?: string | null) => string;
};
```

### UI Rule

Do not redesign wallet UI. Reuse the existing wallet connect button/picker structure where possible and replace the MetaMask-specific behavior with Stellar wallet behavior.

### Acceptance Criteria

- User can connect a Stellar wallet.
- User can disconnect a Stellar wallet.
- Connected address is available globally.
- Existing wallet display UI shows the Stellar address.
- Pack checkout and marketplace purchase can access the connected Stellar address.

---

## 6. Stellar Pack Checkout Using XLM / USDC

### Goal

Replace the current live pack purchase flow with Stellar-based checkout.

### New Flow

```txt
User selects series
→ User selects pack tier
→ User chooses XLM or USDC
→ App displays PHP-equivalent amount
→ App creates payment request
→ User confirms Stellar transaction
→ Backend verifies payment
→ Backend generates pack result
→ App stores/receives pack result
→ User proceeds to card reveal
→ Cards are assigned to inventory
```

### Supported Assets

- XLM.
- Stellar USDC.

### Checkout Data Needed

```ts
type PackCheckoutRequest = {
  walletAddress: string;
  series: string;
  packTier: 'standard' | 'premium' | 'ultra';
  paymentAsset: 'XLM' | 'USDC';
  amount: string;
  phpEquivalent: number;
  memo: string;
};
```

### Backend Payment Verification

Before issuing cards, the backend must verify:

- Transaction exists.
- Transaction succeeded.
- Sender matches connected wallet.
- Recipient matches expected platform wallet.
- Asset matches selected payment asset.
- Amount matches expected price.
- Memo/reference matches the checkout request.
- Transaction has not already been used.

### Suggested Files

```txt
src/lib/stellar/payments.ts
src/lib/stellar/assets.ts
src/lib/stellar/transactions.ts
src/features/open-packs/components/stellar-checkout-modal.tsx
src/features/open-packs/hooks/useStellarPackCheckout.ts
src/app/api/stellar/create-pack-checkout/route.ts
src/app/api/stellar/verify-pack-payment/route.ts
```

### UI Rule

Use a checkout modal or step inside the current `/open-packs` flow. Do not create a separate full redesign.

The modal should include:

- Pack name.
- Selected series.
- Price in selected asset.
- PHP equivalent.
- Payment asset selector.
- Confirm payment button.
- Loading state.
- Success state.
- Error state.

### Acceptance Criteria

- User can choose XLM or USDC before paying.
- User sees PHP-equivalent pricing before checkout.
- Pack result is only created after verified payment.
- Transaction reference is stored with the pack purchase.
- Successful checkout leads to card reveal.

---

## 7. Hybrid Ownership Model

### Goal

Use Stellar for real payment settlement while using the backend database for reliable card ownership, inventory, marketplace state, and battle compatibility.

### Model

```txt
Stellar = payment settlement and transaction verification
Backend = card ownership, inventory, listings, card drops, purchase state, battle data
```

### Rules

- Ownership changes only after payment is verified.
- Every paid pack purchase must store a Stellar transaction reference.
- Every marketplace purchase must store a Stellar transaction reference.
- Backend ownership is the source of truth for MVP inventory and marketplace behavior.
- Future architecture should allow migration to full on-chain card ownership.

### No RBAC For MVP

Do not implement full role-based access control.

Use wallet-based checks instead:

- Wallet can manage cards it owns.
- Wallet can list cards it owns.
- Wallet can buy listings from other wallets.
- Wallet cannot buy its own listing.
- Wallet can use cards it owns in deck building and battle.

### Acceptance Criteria

- Inventory is based on backend ownership, not localStorage only.
- Marketplace ownership transfers happen after verified Stellar payment.
- Each ownership-changing action has an audit trail.
- System does not require RBAC to function.

---

## 8. Backend Database Ownership

### Goal

Move inventory and marketplace ownership from browser-local state to backend persistence.

Current localStorage inventory may remain temporarily for migration or fallback, but it should not be the primary source of truth for real marketplace behavior.

### Suggested Database Tables

The exact ORM/database may be chosen based on the current stack, but the model should support the following entities.

### `users`

```ts
{
  id: string;
  walletAddress: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `cardCatalog`

Stores the base definition of a card.

```ts
{
  id: string;
  tokenId?: number;
  name: string;
  subtitle?: string;
  sourceType: 'demo' | 'artist' | 'ip';
  sourceName: string;
  rarity: 'Common' | 'Rare' | 'Legendary' | 'Mythic';
  element?: string;
  mana?: number;
  power?: number;
  hp?: number;
  zones: string[];
  leaderEligible: boolean;
  ability?: string;
  leaderAbility?: string;
  traits: string[];
  imageUrl: string;
  playable: boolean;
  supplyCap?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### `cardDrops`

Stores pack/drop configuration.

```ts
{
  id: string;
  title: string;
  description?: string;
  creatorWalletAddress?: string;
  sourceType: 'artist' | 'ip' | 'demo';
  status: 'draft' | 'published' | 'paused' | 'sold_out';
  priceXlm?: string;
  priceUsdc?: string;
  phpDisplayPrice?: number;
  supplyCap?: number;
  issuedCount: number;
  oddsConfig: Json;
  createdAt: Date;
  updatedAt: Date;
}
```

### `cardInstances`

Represents owned copies of cards.

```ts
{
  id: string;
  cardCatalogId: string;
  ownerWalletAddress: string;
  sourceDropId?: string;
  packPurchaseId?: string;
  serialNumber?: number;
  status: 'owned' | 'listed' | 'locked' | 'burned';
  acquiredAt: Date;
  updatedAt: Date;
}
```

### `packPurchases`

```ts
{
  id: string;
  buyerWalletAddress: string;
  seriesOrDropId: string;
  packTier: 'standard' | 'premium' | 'ultra';
  paymentAsset: 'XLM' | 'USDC';
  amount: string;
  phpEquivalent?: number;
  stellarTransactionHash: string;
  memo: string;
  status: 'pending' | 'paid' | 'failed' | 'fulfilled';
  createdAt: Date;
  updatedAt: Date;
}
```

### `marketplaceListings`

```ts
{
  id: string;
  cardInstanceId: string;
  sellerWalletAddress: string;
  priceAsset: 'XLM' | 'USDC';
  priceAmount: string;
  phpEquivalent?: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

### `marketplacePurchases`

```ts
{
  id: string;
  listingId: string;
  cardInstanceId: string;
  buyerWalletAddress: string;
  sellerWalletAddress: string;
  paymentAsset: 'XLM' | 'USDC';
  amount: string;
  stellarTransactionHash: string;
  memo: string;
  status: 'pending' | 'paid' | 'settled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### `ownershipHistory`

```ts
{
  id: string;
  cardInstanceId: string;
  fromWalletAddress?: string;
  toWalletAddress: string;
  reason: 'pack_opening' | 'marketplace_purchase' | 'admin_migration';
  relatedTransactionHash?: string;
  createdAt: Date;
}
```

### Acceptance Criteria

- Cards in inventory are fetched from backend ownership records.
- Listing a card changes its status to `listed`.
- Buying a listed card transfers ownership to the buyer after payment verification.
- Ownership history is recorded.
- The system can still hydrate card details needed by deck builder and practice battle.

---

## 9. Replace Mock Marketplace With Real Listings And Purchases

### Goal

Turn the current marketplace prototype into a real marketplace backed by database records and Stellar payment verification.

### Marketplace Features

- View active listings from backend.
- Search listings by card name, creator/source, rarity, or element.
- Filter by rarity and element.
- Sort by price.
- View card detail modal.
- Buy listed card using XLM or USDC.
- List owned card from inventory.
- Cancel own active listing.
- Prevent users from buying their own listing.

### Listing Flow

```txt
User opens inventory
→ User selects owned card
→ User clicks list/sell
→ User enters price and asset
→ Backend validates ownership
→ Listing is created
→ Card status becomes listed
→ Listing appears in marketplace
```

### Buying Flow

```txt
Buyer opens marketplace
→ Buyer selects card
→ Buyer chooses buy
→ App creates payment request
→ Buyer confirms Stellar payment
→ Backend verifies payment
→ Backend transfers card ownership
→ Listing becomes sold
→ Card appears in buyer inventory
```

### Suggested API Routes

```txt
GET    /api/marketplace/listings
POST   /api/marketplace/listings
DELETE /api/marketplace/listings/:id
POST   /api/marketplace/purchases/create-checkout
POST   /api/marketplace/purchases/verify-payment
```

### Acceptance Criteria

- Marketplace no longer depends on mock listed card data.
- Listings are created from real owned card instances.
- Only the card owner can list a card.
- Only the listing seller can cancel a listing.
- Buyer cannot buy their own listing.
- Purchase only settles after Stellar payment verification.
- Sold card appears in buyer inventory.
- Sold card no longer appears as active listing.

---

## 10. Transparent Odds And Supply Display

### Goal

Improve collector trust by making scarcity, supply, and pack odds visible before purchase.

### Add To Pack UI

Display:

- Cards per pack.
- Price in selected asset.
- PHP equivalent.
- Rarity odds.
- Pack guarantee.
- Duplicate cap if applicable.
- Supply status if connected to a card drop.

Example:

```txt
Standard Pack
10 cards
At least 1 Rare or better
Common: 82.00%
Rare: 14.00%
Legendary: 3.80%
Mythic: 0.20%
```

### Add To Card Detail UI

Display when available:

- Supply cap.
- Issued count.
- Serial number.
- Source type: Artist, IP, Demo.
- Playable status.
- Rarity.
- Drop/source name.

Example:

```txt
Supply: 18 / 30 issued
Source: Local Artist Drop
Playable: Yes
```

### Add To Marketplace UI

Display:

- Rarity.
- Supply status.
- Source type.
- Playable badge.
- Price in XLM/USDC.
- PHP equivalent.

### Acceptance Criteria

- User can see pack odds before purchase.
- User can see supply data where available.
- Card scarcity information is visible in card details.
- Marketplace listings show enough scarcity data for collectors to evaluate the card.

---

## 11. Crossover Battle Support For Creator/IP Cards

### Goal

Allow cards from different sources to participate in the existing deck builder and practice battle system.

The current practice battle system should not be rebuilt. It should be extended so creator/IP cards can be hydrated into the same battle card format.

### Required Card Fields For Playability

A card is playable if it has valid gameplay fields:

- `mana`
- `power`
- `hp`
- `element`
- `zones`
- `rarity`
- `ability` or valid empty ability
- `leaderEligible`
- `leaderAbility` if leader eligible

### New Card Metadata

Add or support:

```ts
sourceType: 'artist' | 'ip' | 'demo';
sourceName: string;
playable: boolean;
```

### Battle Compatibility Rules

- Existing demo cards remain playable.
- Creator/IP cards may be playable if they include complete battle stats.
- Non-playable collector cards can appear in inventory and marketplace but should not appear as selectable battle cards.
- Deck builder should filter or badge non-playable cards.
- Practice battle should hydrate backend-owned cards into the existing battle card structure.

### UI Additions

Use small badges only:

- `Artist Card`
- `IP Card`
- `Playable`
- `Collector Only`
- `Crossover Ready`

### Acceptance Criteria

- Existing battle mode still works.
- Existing deck validation still works.
- Backend-owned cards can be used in deck builder if playable.
- Creator/IP cards can appear in battle if they have valid stats.
- Non-playable cards are excluded from battle deck selection or clearly marked.

---

## 12. Environment Variables

Replace old Polkadot/contract variables with Stellar/backend variables.

### Remove From Active MVP

```env
NEXT_PUBLIC_GACHA_NFT_ADDRESS=
NEXT_PUBLIC_GACHA_PACK_ADDRESS=
```

### Add

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS=
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=
DATABASE_URL=
```

Optional:

```env
STELLAR_WEBHOOK_SECRET=
PLATFORM_TREASURY_SECRET=
PRICE_ORACLE_SOURCE=
```

Do not expose private keys to the frontend.

---

## 13. Suggested Code Organization

### Stellar

```txt
src/lib/stellar/
  assets.ts
  horizon.ts
  payments.ts
  transactions.ts
  validation.ts
  types.ts
```

### Wallet

```txt
src/context/stellar-wallet-context.tsx
src/hooks/useStellarWallet.ts
```

### Backend Ownership

```txt
src/lib/db/
  cards.ts
  inventory.ts
  listings.ts
  purchases.ts
  ownership.ts
```

### API Routes

```txt
src/app/api/inventory/route.ts
src/app/api/pack-purchases/create-checkout/route.ts
src/app/api/pack-purchases/verify-payment/route.ts
src/app/api/marketplace/listings/route.ts
src/app/api/marketplace/purchases/create-checkout/route.ts
src/app/api/marketplace/purchases/verify-payment/route.ts
```

### Feature Updates

```txt
src/features/open-packs/
src/features/card-reveal/
src/features/inventory/
src/features/marketplace/
src/features/deck-builder/
src/features/practice/
```

---

## 14. Clean Code Rules

### General

- Keep feature logic out of UI components.
- Put reusable business logic in hooks or lib files.
- Use typed request/response objects.
- Avoid duplicated Stellar transaction parsing logic.
- Avoid duplicated ownership checks.
- Keep old Polkadot code isolated or removed from active imports.
- Do not mix backend ownership writes directly inside UI components.

### UI Components

- Components should receive data through props or hooks.
- Components should not know low-level Stellar details.
- Components should show loading, success, and error states.
- Reuse existing UI elements before creating new ones.

### API Routes

- Validate all input.
- Never trust frontend-provided ownership.
- Verify wallet ownership server-side.
- Verify Stellar payment server-side.
- Use idempotent payment verification to prevent duplicate fulfillment.
- Return clear error codes/messages.

### Database

- Use unique transaction hashes to prevent replay.
- Use listing status transitions carefully.
- Use ownership history for auditability.
- Do not allow listed/sold cards to be transferred twice.

---

## 15. Milestones

## Milestone 1: Polkadot Removal And Stellar Foundation

### Objective

Remove the old active blockchain flow and prepare the app for Stellar.

### Tasks

- Remove active use of Westend network switching.
- Remove active use of Solidity contract pack opening.
- Remove active dependency on Polkadot environment variables.
- Add Stellar environment variables.
- Create Stellar lib folder.
- Create Stellar wallet context.
- Replace MetaMask-specific live payment messaging with Stellar messaging.

### Done When

- App builds without requiring Polkadot/Westend live-pack configuration.
- Wallet state can represent a Stellar public key.
- Pack purchase flow no longer calls Solidity contracts.

---

## Milestone 2: Backend Ownership Foundation

### Objective

Create persistent backend ownership records for cards and inventory.

### Tasks

- Add database schema for users/wallets.
- Add card catalog model or backend mirror of `cards.json`.
- Add card instance model.
- Add ownership history model.
- Create inventory API.
- Update inventory to read from backend.
- Keep localStorage only as temporary fallback or migration source.

### Done When

- Connected wallet can fetch inventory from backend.
- Owned card instances have unique IDs.
- Ownership history is recorded when cards are created/assigned.

---

## Milestone 3: Stellar Pack Checkout

### Objective

Allow users to buy packs using XLM or USDC before revealing cards.

### Tasks

- Build checkout modal using existing UI style.
- Add XLM/USDC selector.
- Add PHP-equivalent display.
- Create pack checkout API.
- Create Stellar payment verification API.
- Generate pack result after verified payment.
- Assign card instances to buyer wallet.
- Connect pack result to existing card reveal page.

### Done When

- User can buy a pack with Stellar payment.
- Backend verifies transaction before issuing cards.
- Cards appear in backend inventory after reveal/fulfillment.
- Transaction reference is stored.

---

## Milestone 4: Transparent Odds And Supply Display

### Objective

Show collectors the odds and scarcity information before purchase and during browsing.

### Tasks

- Add odds display to pack cards/details.
- Add supply cap and issued count fields to card/drop data.
- Add scarcity display to card detail modal.
- Add rarity and source badges.
- Add playable/collector-only badge.

### Done When

- Pack odds are visible before purchase.
- Card detail shows supply information when available.
- Marketplace and inventory cards show relevant rarity/source/playable labels.

---

## Milestone 5: Real Marketplace Listings

### Objective

Replace marketplace mock data with backend listings.

### Tasks

- Create marketplace listing model.
- Create API to fetch active listings.
- Create API to list an owned card.
- Create API to cancel own listing.
- Update marketplace page to read backend listings.
- Update inventory detail flow to allow listing owned cards.
- Prevent listing cards not owned by connected wallet.

### Done When

- Marketplace shows real backend listings.
- User can list an owned card.
- User can cancel own active listing.
- Mock marketplace data is removed from active page behavior.

---

## Milestone 6: Stellar Marketplace Purchase

### Objective

Allow buyers to purchase listed cards using Stellar.

### Tasks

- Create marketplace checkout flow.
- Add XLM/USDC payment support for listings.
- Create purchase checkout API.
- Create purchase payment verification API.
- Transfer backend ownership after verified payment.
- Mark listing as sold.
- Record ownership history.
- Show transaction confirmation.

### Done When

- Buyer can purchase a listed card using Stellar.
- Backend verifies the payment.
- Ownership transfers to buyer.
- Listing becomes sold.
- Buyer sees card in inventory.
- Seller no longer owns the sold card.

---

## Milestone 7: Crossover Battle Support

### Objective

Allow backend-owned creator/IP cards to be used in deck builder and practice battle when they are playable.

### Tasks

- Add source metadata to cards.
- Add playable flag to cards.
- Add battle stat validation for playable cards.
- Update deck builder card hydration to support backend inventory.
- Exclude or badge non-playable cards.
- Ensure practice battle engine receives valid card objects.
- Test mixed-source deck battles.

### Done When

- Existing practice battle still works.
- User can build a deck from backend-owned playable cards.
- Cards from different source types can appear in one deck.
- Non-playable cards do not break deck builder or battle.

---

## Milestone 8: Cleanup, Testing, And Demo Readiness

### Objective

Clean the codebase and prepare a stable hackathon demo.

### Tasks

- Remove unused Polkadot imports.
- Remove unused contract payment branches.
- Remove active marketplace mock data.
- Update product copy away from anime-only branding.
- Update README and product spec.
- Add error handling for failed payments.
- Add loading states for checkout and verification.
- Test pack purchase flow.
- Test marketplace listing flow.
- Test marketplace purchase flow.
- Test inventory refresh.
- Test deck builder with backend-owned cards.
- Test battle mode with mixed-source cards.

### Done When

- Demo flow works end to end.
- No active Polkadot/Westend references remain in the user-facing MVP.
- Marketplace uses real backend listings.
- Stellar payment transaction references are stored.
- App builds successfully.

---

## 16. Final Target Demo Flow

```txt
Collector connects Stellar wallet
→ Collector selects a card pack
→ Collector sees odds, supply, and PHP-equivalent price
→ Collector pays using XLM or USDC
→ Payment is verified
→ Cards are revealed
→ Cards appear in backend inventory
→ Collector lists a duplicate card on marketplace
→ Another collector buys the listed card using Stellar
→ Payment is verified
→ Backend transfers ownership
→ Buyer sees card in inventory
→ Buyer uses playable cards in crossover practice battle
```

---

## 17. Final MVP Success Criteria

The implementation is successful when Aniverse Nexus can demonstrate:

- No active Polkadot/Westend/Solidity live-pack dependency.
- Stellar wallet connection.
- Stellar pack checkout with XLM and USDC.
- PHP-equivalent price display.
- Backend card ownership.
- Stellar transaction verification before ownership updates.
- Real marketplace listings.
- Real marketplace purchases.
- Transparent pack odds.
- Visible card supply/scarcity information.
- Creator/IP/demo card source support.
- Crossover battle support for playable cards.
- Existing UI style preserved.
- Clean, modular, maintainable code.
