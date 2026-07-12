# Prisma + Postgres Setup Guide

This project uses Prisma as the ORM and PostgreSQL as the database for:

- backend inventory
- marketplace listings and purchases
- pack purchase records
- ownership history
- wallet-backed user records

If `DATABASE_URL` is missing, backend inventory and marketplace features will not work.

## 1. Install PostgreSQL

Install PostgreSQL locally if you do not already have it.

Recommended:

- PostgreSQL 15 or newer
- pgAdmin is optional

During installation, remember:

- the `postgres` username you choose
- the password you set
- the port, usually `5432`

## 2. Create the database

Create a database named:

```text
aniverse_nexus
```

You can do that with `psql`:

```powershell
psql -U postgres
CREATE DATABASE aniverse_nexus;
\q
```

If your Postgres username is not `postgres`, replace it with your actual username.

## 3. Create your local env file

In the project root, create:

```text
.env.local
```

You can copy the values from [.env.example](/C:/Users/reyna/gacha/.env.example).

Minimum required values for database-backed features:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS=
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aniverse_nexus
SESSION_SECRET=replace-this-with-a-long-random-string
```

Update `DATABASE_URL` so it matches your real Postgres credentials.

Examples:

```env
DATABASE_URL=postgresql://postgres:myPassword@localhost:5432/aniverse_nexus
```

```env
DATABASE_URL=postgresql://myuser:myPassword@localhost:5432/aniverse_nexus
```

## 4. Install project dependencies

From the repo root, run:

```powershell
npm install
```

This project already includes the Prisma packages in [package.json](/C:/Users/reyna/gacha/package.json):

- `prisma`
- `@prisma/client`

## 5. Generate the Prisma client

Run:

```powershell
npm run prisma:generate
```

This reads [schema.prisma](/C:/Users/reyna/gacha/prisma/schema.prisma) and generates the Prisma client.

## 6. Run the first migration

This repo currently has a schema file but may not yet have a committed `prisma/migrations` folder in your local checkout. Create the first migration with:

```powershell
npm run prisma:migrate -- --name init
```

What this does:

- creates the SQL migration files under `prisma/migrations`
- applies the schema to your local Postgres database
- updates Prisma migration history

If you later change the schema, create a new migration the same way:

```powershell
npm run prisma:migrate -- --name describe_your_change
```

## 7. Seed the card catalog

After the migration succeeds, seed the database:

```powershell
npm run prisma:seed
```

This runs [seed.ts](/C:/Users/reyna/gacha/prisma/seed.ts), which loads card data into the database.

## 8. Start the app

Run:

```powershell
npm run dev
```

At this point:

- inventory API can read backend-owned cards
- legacy import can move local cards into Postgres
- marketplace listing fetches can use Prisma safely

## 9. Confirm Prisma is working

Use these checks.

Check migration status:

```powershell
npx prisma migrate status
```

Open Prisma Studio:

```powershell
npx prisma studio
```

You should be able to inspect tables such as:

- `User`
- `CardCatalog`
- `CardInstance`
- `MarketplaceListing`
- `MarketplacePurchase`
- `OwnershipHistory`

## 10. Common errors and fixes

### Error: `Environment variable not found: DATABASE_URL`

Fix:

- make sure `.env.local` exists
- make sure `DATABASE_URL=...` is present
- restart `npm run dev` after editing env files

### Error: authentication failed for Postgres user

Fix:

- verify the username and password inside `DATABASE_URL`
- verify Postgres is running
- verify the database actually exists

### Error: database does not exist

Fix:

- create `aniverse_nexus`
- confirm the database name in `DATABASE_URL`

### Marketplace loads but says it is offline

Fix:

- this app now intentionally disables live marketplace access when `DATABASE_URL` is not configured
- add the database env var and restart the dev server

### Sell modal shows local/demo copies but not backend-listable copies

Fix:

- import your legacy collection into backend inventory first
- only backend-tracked `CardInstance` records can be listed

## 11. Useful commands

Generate Prisma client:

```powershell
npm run prisma:generate
```

Create and apply a migration:

```powershell
npm run prisma:migrate -- --name init
```

Seed the database:

```powershell
npm run prisma:seed
```

Open Prisma Studio:

```powershell
npx prisma studio
```

Check migration status:

```powershell
npx prisma migrate status
```

## 12. Recommended first-time flow

Run these in order:

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

If you want, the next step can be a second doc for Docker-based Postgres setup so you can avoid installing Postgres directly on Windows.
