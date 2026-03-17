# Aniverse Nexus

Aniverse Nexus is a Web3 trading card game built on a Polkadot EVM-compatible test network. Players open anime-themed packs, reveal cards, manage a collection, build legal decks, and test those decks in a playable practice battle system.

The product is positioned as a game-first consumer dApp rather than a mint-only NFT demo. The core loop is:

1. Connect MetaMask
2. Open a pack
3. Reveal the pulled cards
4. Store and review the collection
5. Build a rules-compliant deck
6. Practice against a bot
7. Expand toward tournaments and marketplace activity

## Table of Contents

- [Project Summary](#project-summary)
- [Why This Project Exists](#why-this-project-exists)
- [Current Scope](#current-scope)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Smart Contract Workflow](#smart-contract-workflow)
- [Demo Flow](#demo-flow)
- [Current Limitations](#current-limitations)
- [Documentation Map](#documentation-map)
- [Contributing](#contributing)
- [License](#license)

## Project Summary

Aniverse Nexus combines three product behaviors into a single Web3 system:

- collecting through gacha-style pack opening
- strategizing through deck construction and battle mechanics
- ecosystem growth through tournament and marketplace expansion

Instead of treating blockchain as a cosmetic ownership layer, this project connects wallet interaction to actual gameplay systems:

- pack opening is handled through Solidity contracts
- pack results feed into reveal and collection flows
- the card catalog powers deck construction and battle rules
- the practice system turns owned cards into tactical gameplay

The app currently supports three themed series for demo purposes:

- Naruto
- One Piece
- Pokemon

## Why This Project Exists

Many NFT collectible products stop at minting and display. That gives users ownership, but not necessarily retention. Aniverse Nexus is designed to answer a stronger product question:

> What happens after the mint?

This project answers that with an actual game loop:

- cards have roles
- cards have rarity and supply
- cards have elements, abilities, and leader interactions
- cards are organized into a legal 12-card deck
- decks are playable in a turn-based battle simulation

The broader vision is a wallet-owned cross franchise TCG ecosystem with collection, strategy, competition, and economy layers.

## Current Scope

This repository already contains a substantial playable and presentable product surface:

- branded landing page and responsive shell
- MetaMask-based wallet connection flow
- gacha pack selection and opening flow
- card reveal screen
- inventory browser
- rules-based deck builder
- practice battle mode with bot opponent
- tournament hub shell
- marketplace shell

Some modules are already deeply interactive, while others are intentionally positioned as product-direction scaffolding for later phases.

## Core Features

### 1. Gacha Pack Opening

- supports Naruto, One Piece, and Pokemon pack series
- supports Standard, Premium, and Ultra pack tiers
- integrates with Solidity contracts through `ethers`
- includes a client-side simulation fallback when pack contract addresses are absent

### 2. Card Reveal

- dedicated reveal experience after opening
- card-by-card browsing
- designed to feel like a game moment, not a raw transaction response

### 3. Inventory

- per-wallet browser storage keyed by address
- collection review and filtering
- bridge between acquisition and deck building

### 4. Deck Builder

- 12-card deck structure
- slot-based validation
- rarity restrictions for battle slots
- saved deck management
- tutorial system
- mobile and desktop responsive layouts

Current deck structure:

- 1 Leader
- 3 Frontline
- 4 Backline
- 4 Reserve

### 5. Practice Match System

- player-versus-bot battle arena
- turn phases
- mana progression
- leader HP representation
- attack targeting rules
- abilities and debuffs
- tutorial flow
- mobile and desktop board layouts

The practice engine is one of the strongest parts of the repo because it demonstrates actual gameplay utility for the card assets.

### 6. Tournament and Marketplace Direction

- tournament page communicates the competitive direction
- practice entry is integrated into the tournament experience
- marketplace page communicates the intended card economy direction

Current state:

- tournament and marketplace are product shells/prototypes, not fully integrated backend or contract systems

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- dnd-kit
- ethers v6

### Smart Contracts

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts v5
- TypeChain

### Network Target

- Westend AssetHub EVM
- MetaMask-compatible flow

## Repository Structure

```text
.
|-- contracts/                  # Solidity contracts, Hardhat config, scripts
|   |-- contracts/              # GachaNFT, GachaPack, CardRegistry
|   |-- scripts/                # Deploy, seed, smoke test, metadata helpers
|   `-- hardhat.config.ts
|-- docs/                       # Project, architecture, setup, demo, gameplay docs
|-- public/                     # Static assets, SVGs, tutorial art, pack art
|-- src/
|   |-- app/                    # Next.js App Router pages
|   |-- components/             # Shared UI components
|   |-- context/                # Wallet context
|   |-- data/                   # Card catalog JSON
|   |-- features/               # Feature-based UI modules
|   |-- hooks/                  # Inventory and pack-opening hooks
|   `-- lib/                    # ABI loaders, chain switching, pack simulator
|-- .env.example                # Frontend env template
`-- README.md
```

## Quick Start

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MetaMask
- access to Westend AssetHub EVM if you want to test the live pack-opening flow

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Create your frontend environment file

Copy `.env.example` to `.env.local` and fill in the contract addresses you want the app to use.

```bash
copy .env.example .env.local
```

Frontend environment variables:

```env
NEXT_PUBLIC_GACHA_NFT_ADDRESS=0x...
NEXT_PUBLIC_GACHA_PACK_ADDRESS=0x...
```

Notes:

- if these addresses are empty or set to the zero address, the app falls back to client-side simulation mode for pack opening
- if they point to live deployed contracts, the app will attempt live pack opening through MetaMask

### 3. Start the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### 4. Connect MetaMask

The current wallet UX is MetaMask-focused. The app will prompt MetaMask to switch to or add Westend AssetHub EVM when pack opening is triggered.

Westend AssetHub EVM parameters used by the app:

- Chain name: `Westend AssetHub`
- Chain ID: `420420421`
- Hex chain ID: `0x190f1b45`
- RPC URL: `https://westend-asset-hub-eth-rpc.polkadot.io`
- Explorer: `https://assethub-westend.subscan.io`

## Smart Contract Workflow

The contract workspace lives in `contracts/`.

### 1. Install contract dependencies

```bash
cd contracts
npm install
```

### 2. Create `contracts/.env`

Copy `contracts/.env.example` to `contracts/.env` and fill in your values:

```env
PRIVATE_KEY=<deployer-private-key-without-0x>
WESTEND_RPC_URL=https://westend-asset-hub-eth-rpc.polkadot.io
BASE_URI=https://ipfs.io/ipfs/<your-cid>/
CARD_REGISTRY_ADDRESS=
NEXT_PUBLIC_GACHA_NFT_ADDRESS=
NEXT_PUBLIC_GACHA_PACK_ADDRESS=
```

### 3. Compile contracts

```bash
npm run compile
```

### 4. Deploy to Westend AssetHub EVM

```bash
npm run deploy:westend
```

This deploys:

- `CardRegistry`
- `GachaNFT`
- `GachaPack`

### 5. Seed the registry with the 48-card catalog

```bash
npm run seed:westend
```

### 6. Sync env files

After deployment, copy the emitted addresses into:

- `contracts/.env`
- root `.env.local`

Alternatively, use the helper script:

```bash
npx hardhat run scripts/createEnv.ts --network westend_assethub
```

### 7. Optional helper scripts

```bash
npx hardhat run scripts/fullSmokeTest.ts --network westend_assethub
npx hardhat run scripts/openPackDemo.ts --network westend_assethub
npx hardhat run scripts/setBaseUri.ts --network westend_assethub
```

## Current Limitations

The project is strong, but it is not claiming more than the current branch actually does.

### Current limitations and trade-offs

- the wallet UI is currently MetaMask-only
- marketplace is currently mock/prototype data, not a live trading engine
- tournament pages are currently presentation/product-direction shells rather than a full multiplayer backend
- practice mode is local single-player against a bot, not live PvP

## Documentation Map

Detailed documentation lives in `docs/`.

- [docs/README.md](docs/README.md) - documentation index
- [docs/HACKATHON_PROJECT_OVERVIEW.md](docs/HACKATHON_PROJECT_OVERVIEW.md) - business, pitch, and hackathon framing
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - system architecture and data flow
- [docs/SETUP_AND_DEPLOYMENT.md](docs/SETUP_AND_DEPLOYMENT.md) - environment, local setup, deployment, troubleshooting
- [docs/SMART_CONTRACTS.md](docs/SMART_CONTRACTS.md) - Solidity contract design and deployment flow
- [docs/PRACTICE_BATTLE_SYSTEM.md](docs/PRACTICE_BATTLE_SYSTEM.md) - detailed practice battle rules
- [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) - recommended demo sequence for judges and reviewers
- [docs/HACKATHON_SUBMISSION_CHECKLIST.md](docs/HACKATHON_SUBMISSION_CHECKLIST.md) - submission readiness checklist
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) - contribution workflow and branch conventions

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
