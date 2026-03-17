# Architecture

## 1. High-Level System Overview

Aniverse Nexus is a feature-based Next.js application backed by a Solidity smart contract stack.

At a high level, the system has four layers:

1. **Presentation layer**
   Responsive pages, tutorials, animations, and card-focused UI.
2. **Gameplay layer**
   Card catalog, deck rules, practice battle engine, targeting logic, and status mechanics.
3. **Wallet and chain integration layer**
   MetaMask connection, network switching, pack-opening transactions, ABI bindings.
4. **Contract layer**
   ERC-1155 NFT contract, on-chain card registry, and pack-opening contract.

## 2. Architectural Principles

The codebase follows a pragmatic product-oriented structure rather than a purely technical demo shape.

### Key principles

- **Feature-first organization**
  Most user-facing functionality lives under `src/features`.

- **Single card catalog**
  `src/data/cards.json` is the central catalog for card identity, stats, rarity, series, and ability data.

- **Clear contract boundaries**
  The contract layer handles minting, pack rules, and on-chain rarity pools. The frontend handles UX, tutorials, deck building, and local practice logic.

- **Progressive realism**
  Some systems are fully wired and others are intentionally product-direction scaffolding. The docs make that distinction explicit.

## 3. Frontend Feature Map

### App routes

| Route          | Purpose                                  |
| -------------- | ---------------------------------------- |
| `/`            | Landing page and product entry           |
| `/gacha`       | Pack series selection                    |
| `/open-packs`  | Pack-opening screen and transaction flow |
| `/card-reveal` | Reveal pulled cards                      |
| `/inventory`   | Collection browser                       |
| `/deck`        | Deck builder                             |
| `/practice`    | Practice battle arena                    |
| `/tournament`  | Tournament hub                           |
| `/marketplace` | Marketplace shell                        |

### Feature modules

| Module                      | Responsibility                                       |
| --------------------------- | ---------------------------------------------------- |
| `src/features/home`         | Landing page sections and onboarding                 |
| `src/features/gacha`        | Pack selection UI                                    |
| `src/features/open-packs`   | Pack-opening UX and contract interaction entry point |
| `src/features/card-reveal`  | Reveal flow                                          |
| `src/features/inventory`    | Collection browsing                                  |
| `src/features/deck-builder` | Deck construction, validation, saved decks           |
| `src/features/practice`     | Practice battle UI and battle engine                 |
| `src/features/tournament`   | Tournament and practice entry shell                  |
| `src/features/marketplace`  | Marketplace UI shell                                 |

## 4. Smart Contract Architecture

The Solidity stack is intentionally separated by responsibility.

### `GachaNFT.sol`

Purpose:

- represents cards as ERC-1155 tokens
- enforces per-token supply caps
- supports batch minting
- exposes metadata URI logic

### `CardRegistry.sol`

Purpose:

- stores on-chain rarity and series classification
- provides rarity pools to the pack contract
- removes the need for off-chain rarity lookup during pack opening

### `GachaPack.sol`

Purpose:

- accepts pack payments
- applies pack rules and guarantees
- filters eligible token IDs by rarity and series
- performs pack draws
- mints the results through `GachaNFT`
- emits pack events for the frontend

## 5. Shared Card Catalog

`src/data/cards.json` is the most important shared data file in the repo.

It currently serves as the source of truth for:

- token ID mapping
- card names and subtitles
- rarity
- series/anime grouping
- element
- zone
- traits
- ability descriptions
- leader ability descriptions
- image URLs
- deck builder display data
- practice battle display and rules input
- contract seeding inputs

Using one card catalog across multiple layers keeps the system coherent:

- the deck builder and practice mode read the same cards
- the contract seeding scripts use the same source as the frontend
- new card sets can be added without rebuilding the whole architecture

## 6. State and Storage Model

### Wallet state

Wallet state is managed through `src/context/wallet-context.tsx`.

Current UI behavior:

- MetaMask is the active supported wallet path in the UI
- the wallet context provides the address, connect/disconnect, and `ethers` provider access

### Deck state

Saved decks are client-side. They are used directly by the deck builder and practice mode.

### Practice battle state

Practice battle state is fully client-side and lives in React state plus internal engine state.

## 7. Major User Flows

### Flow A: Pack opening

1. User selects a series on `/gacha`
2. User moves into `/open-packs`
3. UI determines whether it is in simulation mode or live contract mode
4. In live mode:
   - MetaMask provider is requested
   - network switch is attempted
   - contract method is called
   - receipt and logs are parsed
5. Result token IDs are handed to the reveal flow

### Flow B: Inventory and deck building

1. Inventory presents the owned card set
2. Deck builder uses owned cards to compose a legal deck
3. Saved decks are used later by practice mode

### Flow C: Practice match

1. User selects a saved deck
2. Practice mode builds a player board and a legal bot board
3. Battle state is derived from the shared card catalog and saved deck composition
4. Phase logic, mana logic, attack targeting, and effects all run locally

## 8. Local Simulation vs Live Chain Mode

The project intentionally supports two operational modes for the pack-opening experience.

### Simulation mode

Triggered when public contract addresses are absent or zeroed.

Use case:

- UI development
- demo fallback
- contract-independent testing

### Live chain mode

Triggered when `NEXT_PUBLIC_GACHA_PACK_ADDRESS` is set to a non-zero address.

Use case:

- real pack transaction testing
- event parsing
- contract-backed pack logic

## 9. Deployment Topology

### Frontend

- Next.js app
- can be run locally with `npm run dev`
- can be hosted on Vercel or another Node-compatible platform

### Contracts

- Hardhat workspace under `contracts/`
- currently targeted at Westend AssetHub EVM

### Metadata

- metadata base URI is expected to point to IPFS-hosted JSON files
- the contract layer appends `tokenId.json`

## 10. Known Trade-Offs

### Single-player practice

Practice mode demonstrates game rules well, but it is not yet authoritative multiplayer.

### Marketplace and tournament shells

These pages are valuable because they communicate product direction, but they are not yet complete economic or competitive backends.

## 11. Expansion Paths

The architecture is set up well for future work:

- connect marketplace UI to real listing contracts or an orderbook backend
- add ranked or live PvP
- add analytics, telemetry, and admin tooling
- add seasonal content or new card series without rewriting the full app structure
