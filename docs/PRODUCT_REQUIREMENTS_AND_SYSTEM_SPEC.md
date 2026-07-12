# Aniverse Nexus Product Requirements and System Specification

Last reviewed from codebase: 2026-07-10

## 1. Product Summary

Aniverse Nexus is a Web3 anime trading card game built as a Next.js app with Solidity contracts for card minting and gacha pack opening. The product is designed around a game-first collectible loop: users connect a wallet, open anime-themed packs, reveal cards, store cards in an inventory, build a legal deck, and test that deck in a local practice battle against a bot.

The app currently supports three demo card series:

- Naruto
- One Piece
- Pokemon

The broader product direction is a cross-series trading card ecosystem with ownership, pack opening, deck strategy, practice battles, tournaments, and a marketplace.

## 2. Product Vision

Most NFT collectible products stop at minting and display. Aniverse Nexus extends the loop after acquisition by giving cards practical gameplay utility:

- Cards have rarity, stats, elements, zones, traits, abilities, and leader abilities.
- Users can compose legal decks from owned cards.
- Saved decks can be played in a turn-based practice battle.
- Tournament and marketplace screens show the intended competitive and economy layers.

## 3. Goals

- Provide a polished anime TCG experience rather than a raw NFT minting demo.
- Support both contract-backed pack opening and local simulation fallback.
- Keep card data coherent across inventory, deck building, practice battles, and contract seeding.
- Demonstrate a complete playable loop from pack opening to battle.
- Keep future expansion paths open for live marketplace, tournament, ranked play, and PvP.

## 4. Non-Goals For Current Version

- The marketplace is not a real trading backend yet.
- Tournament registration and live competitive play are not implemented yet.
- Practice mode is not authoritative multiplayer.
- Wallet support is MetaMask-focused.
- Inventory and deck state are stored client-side rather than in an indexed backend.

## 5. Target Users

- Anime and TCG fans who want a collectible card opening and battling experience.
- Web3 users who want wallet-owned collectible assets with actual gameplay.
- Hackathon judges or reviewers evaluating a game-first Polkadot EVM dApp.
- Future competitive players who may enter tournaments or trade cards.

## 6. Core Product Loop

1. User lands on the branded home page.
2. User connects MetaMask, or continues in simulation mode when contract addresses are unset.
3. User selects a pack series.
4. User opens a Standard, Premium, or Ultra pack.
5. App stores the pack result in session storage and navigates to the card reveal page.
6. User reveals cards one by one or reveals all.
7. Pulled cards are merged into wallet-scoped local inventory.
8. User reviews and filters the inventory.
9. User creates a legal deck.
10. User selects the saved deck in practice mode.
11. User battles a bot using card stats, abilities, turns, mana, targeting, and leader HP.

## 7. Current Route Map

| Route | Purpose | Implementation |
| --- | --- | --- |
| `/` | Landing page and onboarding | `src/features/home` |
| `/gacha` | Pack series selection | `src/features/gacha` |
| `/open-packs` | Pack tier selection and opening flow | `src/features/open-packs`, `src/hooks/usePackOpening.ts` |
| `/card-reveal` | Card reveal flow after opening | `src/features/card-reveal` |
| `/inventory` | Collection browser | `src/features/inventory`, `src/hooks/useInventory.ts` |
| `/deck` | Deck builder | `src/features/deck-builder` |
| `/practice` | Practice battle arena | `src/features/practice` |
| `/tournament` | Tournament hub and practice entry | `src/features/tournament` |
| `/marketplace` | Marketplace prototype | `src/features/marketplace` |

## 8. Feature List

### 8.1 Home

- Branded landing experience.
- Introduces the product loop and feature set.
- Links users into pack opening, inventory, deck building, tournaments, and marketplace.
- Uses responsive desktop and mobile layouts.

### 8.2 Wallet Connection

- Wallet state is managed by `src/context/wallet-context.tsx`.
- Current supported wallet type is MetaMask.
- Wallet context exposes:
  - connected wallet address
  - connect and disconnect functions
  - wallet picker state
  - address truncation helper
  - `ethers` browser provider helper
- MetaMask provider detection supports injected provider arrays and prefers MetaMask when requested.

### 8.3 Network Switching

- Live pack opening calls `switchToWestend`.
- Target network:
  - Chain name: Westend AssetHub
  - Chain ID: `420420421`
  - Hex chain ID: `0x190f1b45`
  - RPC: `https://westend-asset-hub-eth-rpc.polkadot.io`
  - Explorer: `https://assethub-westend.subscan.io`

### 8.4 Gacha Pack Selection

- Users choose a series:
  - Naruto
  - One Piece
  - Pokemon
- Each series contains 16 cards.
- Pack selection uses static SVG and image assets from `public/assets/packs`.
- `/gacha` routes users to `/open-packs?series=<series>`.

### 8.5 Pack Opening

Pack tiers:

| Tier | Cards | Price | Guarantee | Duplicate cap per pack |
| --- | ---: | ---: | --- | ---: |
| Standard | 10 | `0.001 WND` | At least 1 Rare or better | 1 |
| Premium | 20 | `0.0018 WND` | At least 2 Rare or better | 2 |
| Ultra | 30 | `0.0025 WND` | At least 3 Rare or better and 1 Legendary or better | 3 |

Rarity weights:

| Rarity | Weight |
| --- | ---: |
| Common | 82.00% |
| Rare | 14.00% |
| Legendary | 3.80% |
| Mythic | 0.20% |

Pack opening supports two modes:

- Simulation mode: used when `NEXT_PUBLIC_GACHA_PACK_ADDRESS` is absent, empty, or zero.
- Live chain mode: used when a non-zero pack contract address is configured.

Simulation mode:

- Runs in the browser through `src/lib/gacha-engine.ts`.
- Can open packs without a connected wallet.
- If MetaMask is connected, asks for a signature to seed the pseudo-random roll.
- Stores pity counter in localStorage under `gacha_pity_counter`.

Live chain mode:

- Requires MetaMask.
- Switches to Westend AssetHub.
- Calls one of:
  - `openStandardPack`
  - `openPremiumPack`
  - `openUltraPack`
- Uses explicit Frontier gas settings.
- Parses `PackOpened` logs first, then falls back to receipt/log lookups.
- Handles pending nonce gaps, rejected transactions, insufficient funds, revert messages, and missing log data.

### 8.6 Card Reveal

- Reads pack results from `sessionStorage` key `packResult`.
- Resolves token IDs against `src/data/cards.json`.
- Displays cards through an animated flip reveal.
- Supports:
  - next card
  - reveal all
  - progress badge
  - rarity glow
  - image fallback state
  - final grid of revealed cards
  - link to inventory
- Merges opened cards into inventory once per reveal flow.

### 8.7 Inventory

- Inventory is wallet-scoped localStorage using key `inventory_<lowercaseAddress>`.
- Anonymous simulation reveal can save under `inventory_anonymous`.
- Duplicates increment `count`.
- Each owned card includes:
  - token ID
  - name
  - subtitle
  - rarity
  - anime series
  - image URL
  - count
  - traits
  - ability description
  - leader eligibility
  - leader description
- Mobile inventory supports rarity filters and card detail view.
- Desktop inventory supports search, rarity filter, anime filter, rarity sorting, pagination, and card detail modal.
- Sell button is present but opens an upcoming-feature modal.

### 8.8 Deck Builder

Deck builder uses owned inventory cards and persists saved decks per wallet.

Deck structure:

- 12 total slots
- Slot 0: Leader
- Slots 1 to 3: Frontline
- Slots 4 to 7: Backline
- Slots 8 to 11: Reserve

Rules:

- A saved battle deck must include:
  - 1 Leader
  - 3 Frontline
  - 4 Backline
- Reserve slots are flexible and not required for battle completion.
- Battle deck rarity caps apply only to slots 0 to 7:
  - Mythic max 1
  - Legendary max 2
  - Rare max 2
- Reserve slots do not use those rarity caps.
- Cards can only occupy compatible slots:
  - Leader slot requires leader-eligible card.
  - Other slots require matching zone data.
- Duplicate card entries are prevented in a deck beyond owned availability.

Deck builder capabilities:

- Create a deck.
- Edit deck name, max 20 characters.
- Add cards by quick action or drag and drop.
- Move cards between slots by drag and drop.
- Remove cards.
- Clear current deck.
- Save new deck.
- Edit saved deck.
- Delete saved deck with confirmation.
- Expand or collapse saved deck previews.
- Filter available cards.
- Sort by rarity.
- View deck power rating.
- View tutorial pages explaining card anatomy, rarity, elements, limits, and power.

Deck persistence:

- localStorage key: `deck_builder_<lowercaseAddress>`.
- Stored payload includes `nextDeckId` and `savedDecks`.
- Practice mode hydrates saved decks against the latest `cards.json` data.

### 8.9 Practice Battle

Practice mode is a complete local player-versus-bot battle system.

Sources:

- Rules: `src/features/practice/battle-engine.ts`
- UI: `src/features/practice/practice-page.tsx`
- Card data: `src/data/cards.json`

Battle setup:

- Player selects a saved deck.
- Player deck is padded to 12 slots.
- Bot generates a legal deck from the full catalog.
- Both sides start with fully built boards.
- Player starts first.

Board structure:

- 1 Leader
- 3 Frontline
- 4 Backline
- 4 Reserve

Victory:

- Each side has leader HP.
- Leaders start at 40 HP.
- Reduce opponent leader HP to 0 to win.

Turn model:

- Active side starts in Main Phase.
- Main Phase is for abilities and leader abilities.
- Battle Phase is for attacks.
- End turn passes control to the opponent.
- Bot turn resolves as an automated sequence.

Mana:

- Both sides start at 2 mana.
- Mana max increases by 1 at the start of each side's turn.
- Mana is capped at 7.
- Current mana refills to current max each turn.
- Regular card ability cost equals the card's `mana`.
- Leader abilities currently cost no mana and are once per game.

Attack rules:

- Team-wide attack cap is 3 attacks per turn.
- Frontline is normally targetable first.
- Backline opens after Frontline is cleared.
- Backline can be attacked early by Backline Strike behavior.
- Reserve can attack but cannot be directly attacked.
- Leaders can be attacked after enemy Frontline is cleared.
- Guard can force attacks into specific frontline units.
- Element advantage gives +1 damage:
  - Fire beats Air
  - Air beats Earth
  - Earth beats Water
  - Water beats Fire

Supported battle systems include:

- abilities
- leader abilities
- aura effects
- start-turn effects
- manual target selection
- healing
- damage
- buffs
- shields
- guard
- backline strike
- counter
- revive timers
- clones
- status effects
- bot target selection
- battle logs and live feed

Status effects:

- Stun
- Sleep
- Burn
- Poison
- Disabled
- Sealed
- Silenced
- Stoned

Practice UI supports:

- deck selection modal
- tutorial modal
- desktop and mobile layouts
- click/tap attacker selection
- drag-and-drop attacks
- drag-and-drop healing where valid
- ability popups
- mana display
- health bars
- attack counter
- live event feed
- result modal

### 8.10 Tournament

Tournament page is a product shell with three tabs:

- Online Tournaments
- Onsite Events
- Practice

Current functionality:

- Displays mock tournament cards.
- Supports viewing a rankings screen for a tournament.
- Practice tab links to `/practice`.
- Practice tab exposes the practice tutorial modal.
- Onsite events currently show an upcoming state.

Current mock tournaments:

- Summer Championship
- Yearly Championship
- Weekly Brawl
- Daily Brawl

Known note:

- One mock date is `2026-02-30`, which is not a valid calendar date and should be corrected before production demos.

### 8.11 Marketplace

Marketplace is a prototype shell.

Current functionality:

- Displays mock listed cards.
- Search by card name, info, or owner.
- Filter modal for rarity and element.
- Sort by price low-to-high or high-to-low.
- Buy modal with card details.
- No real purchase transaction is wired.
- No real listing contract, orderbook, or backend exists.

Current mock listing fields:

- card name
- role/info text
- owner
- price
- price movement
- rarity
- set
- description
- image

## 9. Card Catalog

Primary source: `src/data/cards.json`

Catalog summary:

- Total cards: 48
- Naruto: 16
- One Piece: 16
- Pokemon: 16
- Common: 30
- Rare: 9
- Legendary: 6
- Mythic: 3
- Leader-eligible cards: 9

Leader-eligible cards:

| Token ID | Name | Series | Rarity |
| ---: | --- | --- | --- |
| 14 | Itachi Uchiha | Naruto | Legendary |
| 15 | Jiraiya | Naruto | Legendary |
| 16 | Naruto Uzumaki | Naruto | Mythic |
| 30 | Edward Newgate | OnePiece | Legendary |
| 31 | Shanks | OnePiece | Legendary |
| 32 | Gol D. Roger | OnePiece | Mythic |
| 46 | Gyarados | Pokemon | Legendary |
| 47 | Dragonite | Pokemon | Legendary |
| 48 | Mewtwo | Pokemon | Mythic |

Catalog fields used by the app:

- `id`
- `nftTokenId`
- `name`
- `subtitle`
- `anime`
- `rarity`
- `mana`
- `power`
- `hp`
- `element`
- `zone` and `zones`
- `leaderEligible`
- `keywords`
- `ability`
- `leaderAbility`
- `traits`
- `imageUrl`

## 10. Smart Contract System

Contract workspace: `contracts/`

### 10.1 `CardRegistry.sol`

Responsibilities:

- Stores card metadata needed by contracts:
  - rarity
  - anime series
  - max supply
  - registration flag
- Maintains token ID pools by rarity.
- Supports batch card registration.
- Exposes `getCardsByRarity`, `rarityPoolSize`, `isRegistered`, and `getRarity`.

### 10.2 `GachaNFT.sol`

Responsibilities:

- ERC-1155 card token contract.
- Token IDs 1 to 48 map to cards in `cards.json`.
- Enforces max supply per token.
- Supports authorized minters.
- Supports single and batch minting.
- Emits mint events.
- Builds metadata URI as `baseUri + tokenId + ".json"`.

Supply caps:

| Rarity | Token ranges | Max supply each |
| --- | --- | ---: |
| Common | 1-10, 17-26, 33-42 | 10,000 |
| Rare | 11-13, 27-29, 43-45 | 3,000 |
| Legendary | 14-15, 30-31, 46-47 | 500 |
| Mythic | 16, 32, 48 | 30 |

### 10.3 `GachaPack.sol`

Responsibilities:

- Accepts pack payments.
- Applies pack tier rules.
- Filters rarity pools by series.
- Draws token IDs with rarity weights, guarantees, duplicate caps, and pity.
- Calls `GachaNFT.mintCardBatch`.
- Emits `PackOpened`, `CardMinted`, and `PackPriceUpdated`.
- Allows owner to set pack prices and withdraw funds.

Series ranges:

| Series index | Series | Token IDs |
| ---: | --- | --- |
| 0 | Naruto | 1-16 |
| 1 | OnePiece | 17-32 |
| 2 | Pokemon | 33-48 |

### 10.4 Contract Tooling

Contracts use:

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts v5
- TypeChain
- ethers v6

Hardhat networks:

- `hardhat`
- `localhost`
- `westend_assethub`

Contract scripts:

- deploy
- seed cards
- create env
- open pack demo
- redeploy pack
- full smoke test
- set base URI
- set prices

## 11. System Architecture

### 11.1 Layers

1. Presentation layer
   - Next.js App Router pages.
   - Responsive feature UIs.
   - Static art assets and animations.

2. Gameplay layer
   - `cards.json`
   - deck validation
   - practice battle engine
   - targeting and ability rules

3. Wallet and chain layer
   - wallet context
   - MetaMask provider resolution
   - Westend network switching
   - ethers contract calls
   - receipt and log parsing

4. Contract layer
   - ERC-1155 NFT
   - card registry
   - gacha pack opening

### 11.2 Data Flow: Pack Opening

Simulation mode:

1. User selects pack type and series.
2. Optional MetaMask signature seeds browser simulation.
3. `simulatePack` returns card token IDs.
4. `/open-packs` writes token IDs to `sessionStorage`.
5. Router navigates to `/card-reveal`.
6. Reveal page resolves token IDs against `cards.json`.
7. Inventory hook merges cards into localStorage.

Live chain mode:

1. User selects pack type and series.
2. App requires MetaMask.
3. App switches wallet to Westend AssetHub.
4. App calls the matching pack contract method.
5. Read provider waits for transaction confirmation.
6. App parses `PackOpened` event logs or fallback logs.
7. App writes token IDs to `sessionStorage`.
8. Reveal and inventory flow proceeds as above.

### 11.3 Data Flow: Deck To Practice

1. User owns cards in wallet-scoped inventory.
2. Deck builder maps owned cards into deck card items.
3. User saves a legal deck into `deck_builder_<address>`.
4. Practice mode reads saved decks from the same localStorage key.
5. Practice hydrates cards against current catalog data.
6. Player deck initializes a 12-slot board.
7. Bot deck is generated from the catalog with legal constraints.
8. Battle engine drives turns, mana, attacks, effects, and winner state.

## 12. Storage Model

| Storage | Key | Contents |
| --- | --- | --- |
| localStorage | `inventory_<address>` | Owned cards and counts |
| localStorage | `inventory_anonymous` | Inventory for no-wallet simulation reveal |
| localStorage | `deck_builder_<address>` | Saved decks and next deck ID |
| localStorage | `gacha_pity_counter` | Simulation-mode mythic pity counter |
| localStorage | `animeGachaTCG_tutorialComplete` | Practice tutorial completion |
| sessionStorage | `packResult` | Temporary pack result for card reveal |

## 13. Environment Variables

Root `.env.example`:

```env
NEXT_PUBLIC_GACHA_NFT_ADDRESS=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_GACHA_PACK_ADDRESS=0x0000000000000000000000000000000000000000
```

When addresses are zeroed, the frontend uses simulation mode.

Contracts `.env.example` expects deployment and contract configuration such as:

- deployer private key
- Westend RPC URL
- metadata base URI
- deployed contract addresses

## 14. Tech Stack

Frontend:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- dnd-kit
- lucide-react
- ethers v6

Contracts:

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- TypeChain
- ethers v6

Assets:

- Static SVG and PNG/WebP files under `public/`.
- Remote card images from IPFS gateways configured in `next.config.ts`.

## 15. Testing And Verification Surface

Current available commands:

Root app:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Contracts:

```bash
cd contracts
npm run compile
npm run test
npm run deploy:local
npm run deploy:westend
npm run seed:local
npm run seed:westend
npm run demo:local
```

Contract tests are located in:

- `contracts/test/GachaTCG.test.ts`

## 16. Known Limitations And Risks

- Marketplace uses mock data and does not execute real purchases.
- Inventory selling is an upcoming-feature modal only.
- Tournament data is mock data.
- One mock tournament date is invalid: `2026-02-30`.
- Practice mode is local and not server-authoritative.
- Saved decks and inventory are browser-local and can be cleared by the user.
- Live inventory is not read back from ERC-1155 balances.
- Contract randomness is pseudo-random and appropriate for demo/testnet, not high-stakes mainnet randomness.
- Simulation-mode pity is local to the browser, not tied to an on-chain wallet state.
- Wallet UX is MetaMask-specific.
- Root metadata still says `Create Next App` and should be updated before public launch.
- Some source comments and strings contain mojibake characters from encoding issues.

## 17. Future Roadmap

Near-term:

- Update app metadata and polish invalid mock content.
- Link this document from README or docs index.
- Add automated frontend tests for pack opening, reveal, inventory, deck validation, and practice start.
- Add contract test coverage for Pokemon series and pity edge cases.
- Read live ERC-1155 balances into inventory when contract mode is enabled.

Mid-term:

- Implement real marketplace listing, buying, cancellation, and settlement.
- Add indexed backend or subgraph-style event ingestion.
- Add authenticated profile layer.
- Add tournament registration and match reporting.
- Add live PvP or asynchronous PvP.

Long-term:

- Add ranked seasons.
- Add new card series and seasonal drops.
- Add anti-cheat and authoritative battle validation.
- Add analytics and admin dashboards.
- Add richer wallet support beyond MetaMask.

## 18. Glossary

- Battle deck: slots 0 to 7, consisting of Leader, Frontline, and Backline.
- Reserve: slots 8 to 11; can attack in practice but is not directly targetable.
- Leader: slot 0; represents player HP and has a once-per-game leader ability.
- Pity: counter that improves Mythic odds after many packs without a Mythic.
- Simulation mode: frontend-only pack opening when contract addresses are unset.
- Live chain mode: pack opening through deployed Solidity contracts.
- Westend AssetHub: Polkadot EVM-compatible test network targeted by this app.
