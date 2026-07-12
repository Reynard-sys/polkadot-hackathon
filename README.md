# Aniverse Nexus

Aniverse Nexus is a game-first digital trading card platform built with Next.js, Stellar, Freighter, Prisma, and Supabase Postgres. Players can open themed packs, reveal and collect cards, build legal decks, practice against a bot, and trade cards or original artwork in a wallet-authenticated marketplace.

The project is designed around a complete playable loop rather than a standalone NFT minting demo:

1. Connect and authenticate with Freighter.
2. Buy or simulate a card pack.
3. Reveal the cards and add them to an inventory.
4. Build a rules-compliant deck.
5. Play a practice match.
6. List cards or original artwork in the marketplace.

## Highlights

- Stellar Testnet payments with XLM and configurable Stellar USDC
- Freighter wallet authentication using signed challenges
- Server-verified payment amount, asset, memo, sender, and recipient
- Prisma-backed inventory, ownership history, pack purchases, and listings
- Responsive card reveal, inventory, deck builder, and practice battle experiences
- Seller-to-buyer marketplace settlement with ownership transfer history
- Original artwork publishing with a marketplace listing created atomically
- Demo pack mode when a platform Stellar address is not configured

## Technology

- Next.js 16 and React 19
- TypeScript with strict type checking
- Tailwind CSS 4 and Motion
- Stellar SDK and Freighter API
- Prisma ORM and Supabase Postgres
- dnd-kit for deck-building interactions

The repository also retains an earlier Solidity/Hardhat prototype in `contracts/` as supporting research. The active application and payment flow use Stellar.

## Application Architecture

```text
Freighter wallet
      |
      | signed challenge / signed payment
      v
Next.js UI and route handlers
      |                    |
      | Prisma             | Horizon transaction verification
      v                    v
Supabase Postgres      Stellar Testnet
```

Important backend guarantees:

- Wallet sessions are stored in signed, HTTP-only cookies.
- Marketplace payments are verified against the seller wallet—not a shared platform address.
- Pack and marketplace memos and transaction hashes are unique.
- Inventory, listing, purchase, and ownership updates use database transactions.
- A card must be owned by the authenticated seller before it can be listed.

## Repository Layout

```text
.
|-- docs/                    # Setup, architecture, product, and demo documentation
|-- prisma/                  # Schema, migrations, and seed data
|-- public/                  # Static application assets
|-- src/
|   |-- app/                 # Pages and backend route handlers
|   |-- components/          # Shared UI components
|   |-- context/             # Wallet and authenticated-session providers
|   |-- data/                # Card catalog
|   |-- features/            # Product feature modules
|   |-- hooks/               # Pack-opening and inventory orchestration
|   `-- lib/                 # Database, Stellar, auth, and game-domain logic
|-- contracts/               # Archived EVM/Hardhat prototype workspace
|-- prisma.config.ts         # Prisma CLI configuration
`-- next.config.ts           # Next.js and image configuration
```

## Local Setup

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- A Supabase project
- Freighter browser extension

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and replace the placeholders:

```powershell
Copy-Item .env.example .env.local
```

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS=G...
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=G...
DATABASE_URL=postgresql://...
SESSION_SECRET=replace-with-a-long-random-secret
```

If `NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS` is empty, pack opening uses demo mode. Database-backed authentication, inventory, and marketplace features still require `DATABASE_URL` and `SESSION_SECRET`.

### 3. Prepare the database

For a new database:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
```

### 4. Start the application

```bash
npm run dev
```

Open `http://localhost:3000` and set Freighter to Testnet before connecting.

## Quality Checks

Run the review gate before submitting changes:

```bash
npm run check
npm run build
```

`npm run check` runs ESLint, strict TypeScript checking, and Prisma schema validation. The production build additionally verifies all application routes and static pages.

## Demo Route

For a short judge-facing walkthrough:

1. Connect Freighter on Stellar Testnet.
2. Open a pack and reveal the cards.
3. Visit Inventory and inspect the backend-owned card instances.
4. Build a deck and launch a practice battle.
5. List an owned card in Marketplace.
6. Open **Sell Your Artwork** and publish an original piece.

See [docs/DEMO_GUIDE.md](docs/DEMO_GUIDE.md) for the extended presentation flow.

## Documentation

- [Documentation index](docs/README.md)
- [Supabase and Freighter Testnet setup](docs/SUPABASE_AND_FREIGHTER_TESTNET_TUTORIAL.md)
- [Prisma and Postgres setup](docs/PRISMA_POSTGRES_SETUP.md)
- [Product requirements and system specification](docs/PRODUCT_REQUIREMENTS_AND_SYSTEM_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Practice battle system](docs/PRACTICE_BATTLE_SYSTEM.md)
- [Hackathon submission checklist](docs/HACKATHON_SUBMISSION_CHECKLIST.md)

## Security Notes

- Never commit `.env`, `.env.local`, database passwords, wallet seed phrases, or private keys.
- Use a unique, high-entropy `SESSION_SECRET` in deployed environments.
- Keep the app on Testnet until production assets, issuers, monitoring, and operational controls are ready.
- Rotate any credential that has been pasted into a terminal recording, issue, chat, or public log.

## License

Licensed under the [MIT License](LICENSE).
