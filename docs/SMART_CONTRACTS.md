# Smart Contracts

This document explains the Solidity layer for Aniverse Nexus.

## 1. Contract Stack Overview

The project uses three primary contracts:

1. `CardRegistry.sol`
2. `GachaNFT.sol`
3. `GachaPack.sol`

Together they implement:

- on-chain card classification
- ERC-1155 NFT ownership
- paid pack opening with rarity rules and minting

## 2. Why This Design

The contract architecture separates concerns cleanly.

### Why not put everything in one contract?

Because the system has three different jobs:

- storing card classification
- representing collectible ownership
- running monetized pack-opening logic

Keeping these separate improves:

- readability
- maintainability
- upgrade flexibility
- auditability

## 3. `CardRegistry.sol`

### Role

`CardRegistry` stores the minimum on-chain metadata needed for pack generation:

- rarity
- series/anime
- max supply
- registration state

### Current enums

- `Rarity { Common, Rare, Legendary, Mythic }`
- `Anime { Naruto, OnePiece, Pokemon }`

### Key behavior

- owner registers cards in batches
- each card is indexed by token ID
- rarity pools are built on-chain and queryable by `GachaPack`

### Why it matters

Without this contract, `GachaPack` would need off-chain input at open time to know which token IDs belong to each rarity and series. This registry makes the draw logic more self-contained and deterministic from the chain's perspective.

## 4. `GachaNFT.sol`

### Role

`GachaNFT` is the ERC-1155 contract that represents the collectible cards themselves.

### Why ERC-1155 is the correct standard here

Aniverse Nexus is a collectible card game, not a one-of-one art collection.

That means:

- duplicates are valid
- supply caps matter per card ID
- packs often mint multiple cards at once

ERC-1155 fits this better than ERC-721 because:

- one token ID can represent one card type
- a wallet can hold multiple copies of the same card
- batch minting is gas-efficient

### Important state

- `maxSupply[tokenId]`
- `totalMinted[tokenId]`
- `minters[address]`

### Important functions

- `setMinter(address,bool)`
- `mintCard(address,uint256,uint256)`
- `mintCardBatch(address,uint256[],uint256[])`
- `remainingSupply(uint256)`
- `isSoldOut(uint256)`
- `uri(uint256)`
- `setBaseUri(string)`

### Access model

Only authorized minters or the owner can mint.

Intended pattern:

- `GachaPack` is authorized as a minter
- users never mint directly through `GachaNFT`

## 5. `GachaPack.sol`

### Role

`GachaPack` is the monetized pack-opening contract.

It:

- accepts payment
- chooses cards according to rarity rules
- applies pack guarantees
- respects series filtering
- enforces duplicate caps within a single pack
- mints the results through `GachaNFT`

### Pack types

| Pack type | Cards | Price        | Guarantee                                |
| --------- | ----- | ------------ | ---------------------------------------- |
| Standard  | 10    | `0.001 WND`  | at least 1 Rare                          |
| Premium   | 20    | `0.0018 WND` | at least 2 Rare                          |
| Ultra     | 30    | `0.0025 WND` | at least 3 Rare and at least 1 Legendary |

### Supported series

| Series index | Series    | Token range |
| ------------ | --------- | ----------- |
| `0`          | Naruto    | `1-16`      |
| `1`          | One Piece | `17-32`     |
| `2`          | Pokemon   | `33-48`     |

### Rarity weights

The contract uses weighted rarity selection:

- Common: 82.00%
- Rare: 14.00%
- Legendary: 3.80%
- Mythic: 0.20%

### Pity system

There is a pity mechanism tracked by address:

- after 50 packs without a Mythic, Mythic probability begins increasing
- each additional non-Mythic pack adds a small Mythic bonus

### Duplicate handling

Duplicates are allowed globally because the game uses ERC-1155 balances.

Inside a single pack, duplicate frequency is limited by pack tier:

- Standard: max 1 copy of a given card in the opened pack
- Premium: max 2 copies
- Ultra: max 3 copies

## 6. Deployment Relationship

The intended deployment order is:

1. deploy `CardRegistry`
2. deploy `GachaNFT`
3. deploy `GachaPack`
4. authorize `GachaPack` as a minter in `GachaNFT`
5. seed `CardRegistry` with all 48 cards
6. configure frontend env vars

## 7. Key Events

### `CardRegistry`

- `CardsBatchRegistered(uint256 count)`

### `GachaNFT`

- `CardMinted(address indexed to, uint256 indexed tokenId, uint256 amount)`
- `MinterUpdated(address indexed minter, bool authorised)`

### `GachaPack`

- `PackOpened(address indexed player, PackType packType, uint8 series, uint256[] tokenIds)`
- `CardMinted(address indexed player, uint256 indexed tokenId, CardRegistry.Rarity rarity)`
- `PackPriceUpdated(PackType packType, uint256 newPrice)`

These events are important because the frontend uses them to recover the results of pack openings.

## 8. Script Inventory

The `contracts/scripts/` directory contains helper scripts for the operational workflow.

### `deploy.ts`

Deploys:

- `CardRegistry`
- `GachaNFT`
- `GachaPack`

Then:

- authorizes the pack contract as a minter
- prints the addresses needed for env configuration

### `seedCards.ts`

Reads `src/data/cards.json` and registers the full card catalog into `CardRegistry`.

### `createEnv.ts`

Writes:

- `contracts/.env`
- root `.env.local`

based on the deployment outputs.

### `setBaseUri.ts`

Updates the metadata base URI on the deployed `GachaNFT`.

### `openPackDemo.ts`

Opens one pack of each type using an existing deployed `GachaPack` contract.

### `fullSmokeTest.ts`

One-shot end-to-end smoke script that:

- deploys
- seeds
- opens packs

This is especially useful for proving the contract flow quickly during development.

## 9. Operational Notes for Westend AssetHub EVM

The contract scripts are opinionated for the target Frontier environment.

### Important note

Some Frontier nodes can behave poorly with automatic gas estimation.

For this reason, the scripts supply explicit gas values rather than depending on `eth_estimateGas`.

This is not arbitrary. It is an operational guardrail specifically for the target test network environment used by the project.

## 10. Security and Ownership Considerations

### Ownership

All three contracts use owner-gated administration where appropriate.

### Mint control

Only authorized minters should be allowed to mint NFTs. In the intended flow, `GachaPack` is the controlled minter.

### Withdrawals

`GachaPack` supports owner withdrawals of collected funds.

### Refund logic

If a user overpays a pack transaction, the contract refunds the excess.

## 11. Design Trade-Offs

### Randomness

The contract uses pseudo-randomness derived from available block and caller data. This is suitable for a hackathon prototype and testnet product demonstration, but it is not the same as a verifiable random oracle.

### On-chain registry vs off-chain catalog

The registry stores only what the pack contract needs for opening logic. Rich game data still lives in the frontend catalog.

That is a pragmatic split:

- on-chain: rarity and classification needed for mint logic
- off-chain: rich card design data needed for gameplay UI

## 12. Current Contract-Frontend Boundary

The current repo should be understood like this:

- contracts handle collectible issuance and pack logic
- the frontend handles deck building and practice battles

That does not reduce the value of the contract layer. It simply means the next major integration milestone is stronger wallet-native inventory reconciliation.
