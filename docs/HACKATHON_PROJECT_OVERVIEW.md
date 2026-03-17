# Aniverse Nexus

## One-Line Pitch

Aniverse Nexus is a Web3 trading card game platform on a Polkadot EVM-compatible chain where players open packs, own NFT cards, build legal decks, practice battle strategies, and eventually compete or trade in a shared ecosystem.

---

## Executive Summary

Aniverse Nexus combines three strong user behaviors into one product:

1. `Collect` through gacha-style pack opening
2. `Strategize` through deck building and battle simulation
3. `Compete and trade` through tournaments and a marketplace

The project is designed as a game-first consumer dApp. Instead of adding blockchain to a static collectible app, the repo uses NFT ownership as the foundation for an actual card game loop:

- players acquire cards through on-chain pack opening
- those cards appear in their collection
- cards are assembled into a rules-based deck
- decks are tested in a playable practice battle system
- the same assets can later support ranked play, tournaments, and trading

For a hackathon, this is important because the project is not just "NFT minting" and not just "a game UI." It is a full product direction with a clear player loop, contract model, and business path.

---

## What the Project Is

Aniverse Nexus is a multi-feature collectible card game platform built around themed anime-inspired card sets. The current codebase supports three sets for demo purposes only:

- Naruto
- One Piece
- Pokemon

The player journey is:

1. Connect a wallet
2. Open packs
3. Reveal pulled cards
4. View owned cards in inventory
5. Build a legal 12-card deck
6. Test the deck in practice mode against a bot
7. Move toward tournament play and marketplace activity

This makes the product feel closer to a digital TCG ecosystem than a simple NFT minting demo.

---

## The Problem It Solves

### For players

Most NFT collectible projects stop at ownership. They let users mint, display, or trade assets, but they do not create meaningful gameplay value after acquisition. That leads to weak retention because users have little reason to come back after the initial purchase.

Aniverse Nexus solves this by giving every acquired asset gameplay purpose:

- cards have stats
- cards belong to zones
- cards have abilities
- cards interact through a battle system
- cards contribute to deck strategy

### For the market

Traditional gacha products keep assets inside a closed game economy. Players spend money but never truly own the results.

Aniverse Nexus changes that by turning card pulls into wallet-owned assets while still preserving the excitement of pack opening and the depth of TCG strategy.

### For Polkadot

The project shows how EVM-compatible smart contracts on Polkadot can power consumer-facing gaming products, not only DeFi tools. It is a strong category fit for hackathons focused on Solidity/EVM dApps on Polkadot.

---

## Core Product Vision

The long-term vision is a Web3 cross franchise card game ecosystem with four connected layers:

### 1. Collection Layer

Players open packs and build personal collections of scarce cards with different rarities and supply caps.

### 2. Strategy Layer

Owned cards are not passive collectibles. They are assembled into decks with legal construction rules, rarity restrictions, and tactical roles.

### 3. Competition Layer

Players use decks in practice matches first, then in future tournaments, rankings, and live events.

### 4. Economy Layer

Cards become tradable, collectible, and prestige-bearing digital assets through marketplace activity and potentially future tournament rewards.

## The vision is not limited to anime and game franchises, we want to create a platform for projects closely related to cards and TCG ready for the future of Web3 gaming.

## What the Current Repo Already Does

The current repository is already much more than a landing page.

## 1. Landing and Wallet Entry

The app includes a branded home page, top navigation, shared wallet modal, and a mobile-friendly shell. Wallet connection is currently focused on MetaMask for the EVM transaction path.

## 2. On-Chain Gacha Pack Opening

The gacha flow includes:

- pack selection
- per-series opening routes
- transaction handling through `ethers`
- result handoff into a reveal screen

The project currently supports three pack series for demo purposes:

- Naruto
- One Piece
- Pokemon

Pack opening is wired to Solidity contracts and is intended to mint ERC-1155 NFTs to the connected wallet.

## 3. Card Reveal Experience

The reveal flow is not just a transaction success screen. It presents pulled cards in a dedicated reveal interface so the pack opening feels like a game moment, not a wallet event log.

## 4. Inventory

The inventory feature gives players a collection browser for owned cards with filtering and detail views. The contract layer already exists for ERC-1155 minting. This is the bridge between acquisition and gameplay.

## 5. Deck Builder

The deck builder is one of the strongest parts of the product because it turns collectibles into strategy.

Implemented functionality includes:

- saved decks
- leader, frontline, backline, and reserve structure
- rarity limits for the battle portion of the deck
- power rating calculation
- tutorial support
- mobile and desktop responsive deck management
- validation before save

The deck format is:

- 1 Leader
- 3 Frontline
- 4 Backline
- 4 Reserve

This transforms ownership into actual game composition.

## 6. Practice Match System

The practice feature is not a placeholder. It includes a substantial battle engine with:

- a 1v1 player-versus-bot board
- mana progression
- phases
- attacking rules
- targeting logic
- elements
- status effects
- leader HP
- card abilities
- battle logs
- deck selection modal
- tutorial system

This means the project already demonstrates how card ownership can flow into gameplay.

## 7. Tournament Hub

The tournament page provides a product shell for:

- online tournaments
- onsite events
- practice entry
- rankings navigation

Some of this area is still prototype/demo content rather than fully on-chain or backend-connected functionality, but it clearly shows the intended competitive direction.

## 8. Marketplace Experience

The marketplace feature currently presents a marketplace UI and product direction. At the moment it functions more as a prototype/demo layer than a fully integrated on-chain market because of legal and copyright issues. That said, it is strategically important because it shows where collection liquidity and player-to-player trading can go next.

---

## What Makes This More Than a Typical NFT Demo

A lot of hackathon NFT projects stop at:

- mint button
- wallet ownership
- metadata display

Aniverse Nexus goes beyond that with:

- scarcity logic
- pack logic
- collection browsing
- deck legality rules
- battle mechanics
- tournament scaffolding
- marketplace direction

That is a much stronger product story because it demonstrates:

- acquisition
- utility
- retention
- monetization potential

all in one system.

---

## Gameplay and Design Philosophy

The game design emphasizes easy onboarding with meaningful tactical depth.

### Deck Structure

Each deck has fixed slots and role-based composition:

- Leader represents the player HP pool
- Frontline acts as the first defensive layer
- Backline supports from behind
- Reserve adds tactical depth and special access to abilities/attacks

### Rarity-Based Strategy

The builder and battle system use rarity not only as a collection signal, but as a gameplay balancing layer. Stronger rarities increase deck power and are limited in the battle deck.

### Element System

The game includes elemental matchups:

- Fire beats Air
- Air beats Earth
- Earth beats Water
- Water beats Fire

This gives players accessible but meaningful combat decisions.

### Status and Ability Design

Cards can apply effects such as:

- Burn
- Poison
- Stun
- Sleep
- Disabled
- Sealed
- Shield
- Guard-related control

That helps the practice battle mode feel like a real TCG rules engine rather than just a stat-comparison simulator.

---

## Blockchain Component

The blockchain layer is centered around three Solidity contracts:

## 1. `GachaNFT.sol`

This is the ERC-1155 collection contract.

Its role:

- represent cards as wallet-owned tokens
- enforce supply caps per token ID
- support single and batch minting
- expose metadata URI logic

Why ERC-1155 makes sense here:

- multiple copies of the same card are expected in a collectible card game
- batch minting is more gas-efficient for pack opening
- supply caps can be enforced cleanly across many cards

## 2. `CardRegistry.sol`

This is the on-chain card metadata registry for pack logic.

Its role:

- store card rarity and anime grouping
- group cards into rarity pools
- allow the pack contract to query rarity pools on-chain

This removes the need for pack opening to rely on off-chain rarity mapping during execution.

## 3. `GachaPack.sol`

This is the pack-opening logic contract.

Its role:

- accept payment for different pack types
- roll rarity distributions
- enforce guarantees
- prevent duplicate pulls within a pack
- mint results through the NFT contract
- emit pack opening events

The pack contract is the commercial engine of the platform.

---

## Card Economy Model

The current card economy is built on scarcity tiers.

Each token ID belongs to one rarity:

- Common
- Rare
- Legendary
- Mythic

These are used for:

- supply caps
- deck-building limits
- perceived value
- progression and chase behavior

This structure is strong for both gameplay and monetization because rarity affects:

- collectibility
- strategy
- aspiration
- secondary market value

---

## Technical Architecture

## Frontend Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion for animation
- dnd-kit for drag-and-drop interactions
- ethers v6 for EVM contract interaction

## Architectural Pattern

The app uses a feature-based structure:

- `src/app` for routes
- `src/features` for feature modules
- `src/components` for shared UI

This is useful for hackathon presentation because it shows the project is not a monolithic prototype. It is organized like a scalable product.

## Data Model

The gameplay layer uses `src/data/cards.json` as the source catalog for:

- card identity
- stats
- zone
- rarity
- element
- abilities
- leader abilities
- traits

This allows the same card catalog to feed:

- reveal screens
- inventory
- deck builder
- practice battle engine
- smart contract seeding

That is a strong architectural choice because it keeps the game system coherent across UI and blockchain layers.

---

## Why This Fits a Hackathon

This project is strong for a hackathon because it demonstrates multiple layers of execution:

### 1. Product clarity

It is easy to explain:

> "Open anime card packs, own the cards as NFTs, build decks, and battle with them."

### 2. Technical breadth

It includes:

- modern frontend engineering
- wallet integration
- EVM smart contracts
- NFT minting
- battle rules logic
- responsive game UI

### 3. User-facing polish

The repo contains real page flows, tutorials, animations, reveal screens, responsive layouts, and an actual practice mode. That makes it demo-friendly.

### 4. Business relevance

It is not a purely technical demo. It clearly points toward a real consumer product.

---

## Potential Business Model

Aniverse Nexus has several monetization paths.

## 1. Pack Sales

The primary business model is selling packs.

Why it works:

- simple for users to understand
- aligns with collectible card behavior
- supports recurring revenue
- fits both casual and high-engagement users

Potential pack tiers:

- standard
- premium
- ultra
- seasonal or event-limited packs

## 2. Marketplace Fees

Once marketplace trading becomes fully on-chain, the platform can take a fee on:

- each sale
- each listing
- premium featured listings

This creates an economy-layer revenue stream beyond primary sales.

## 3. Tournament Entry and Prize Pools

Future monetization can come from:

- paid tournament entries
- sponsored tournaments
- branded event partnerships
- premium qualification passes

This is especially attractive if the product grows a competitive player base.

## 4. Cosmetic or Seasonal Content

Without breaking gameplay fairness, the platform could monetize:

- alternate card frames
- animated reveal sequences
- profile cosmetics
- seasonal passes
- exclusive event commemorative NFTs

## 5. IP or Brand Partnerships

Even without official anime licensing at the hackathon stage, the product direction naturally supports:

- creator collaborations
- themed expansion sets
- esports/tournament sponsors
- publisher or community partnerships

## 6. B2B / White-Label Potential

The engine could eventually be repackaged as:

- a white-label collectible card platform
- a branded campaign platform for media/IP communities
- a tournament-ready loyalty and engagement system

That creates a second business path beyond direct consumer revenue.

---

## Target Users

The likely audience segments are:

## 1. Gacha Players

Users who enjoy opening packs, chasing rare pulls, and collecting sets.

## 2. TCG / Strategy Players

Users who care about:

- deck optimization
- matchups
- ability timing
- testing and mastery

## 3. Web3 Collectors

Users who want wallet-owned digital assets with scarcity and transferability.

## 4. Competitive Community Builders

Users attracted by rankings, events, and tournament play rather than only collecting.

---

## Differentiation

Aniverse Nexus sits in a useful middle ground between three categories:

### Compared to pure NFT collectibles

It offers actual gameplay utility.

### Compared to traditional digital card games

It offers true asset ownership and secondary market potential.

### Compared to many Web3 games

It has a simpler, more understandable user loop:

- open
- collect
- build
- battle

That makes it much easier to demo and pitch.

---

## Honest Current Status

For hackathon credibility, it is important to separate what is already functional from what is product-direction scaffolding.

### Already functional in the repo

- landing and navigation experience
- wallet modal
- gacha/open pack flow
- reveal flow
- inventory browsing with browser-local wallet-keyed storage
- deck builder with rule enforcement
- practice battle system with tutorials and bot play
- smart contract code for NFT minting and pack logic

### Present but still prototype/demo-oriented

- marketplace as a production trading system
- tournament backend integration
- ranked multiplayer or live PvP

That is still a strong hackathon position because the core product loop is already visible and playable.

---

## Roadmap After the Hackathon

## Short-term

- finalize contract deployment and wallet-read reliability
- complete on-chain inventory ownership sync
- connect marketplace to actual listings and transfers
- connect tournaments to real progression and rewards

## Mid-term

- live PvP matchmaking
- ranked ladder
- reward distribution
- seasonal expansions

## Long-term

- creator/IP collaborations
- cross-community tournaments
- white-label TCG infrastructure for other brands

---

## Why This Project Matters

Aniverse Nexus is not just a collection of nice screens and not just a set of Solidity contracts.

It is an ecosystem prototype that shows how:

- digital ownership
- game design
- collection loops
- and on-chain economies

can be combined into a single consumer-facing product on a Polkadot EVM-compatible stack.
