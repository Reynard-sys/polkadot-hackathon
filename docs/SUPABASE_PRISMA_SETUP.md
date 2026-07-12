# Supabase + Prisma Setup

This project already uses Prisma. Switching to Supabase means changing the Postgres provider, not rewriting the app.

The important part is:

- keep Prisma
- use Supabase for the hosted Postgres database
- set `DATABASE_URL` from your Supabase project
- run Prisma migrations and seed against Supabase

## What changes in this repo

You do not need to replace Prisma code.

The existing Prisma setup in [schema.prisma](/C:/Users/reyna/gacha/prisma/schema.prisma) already works with Supabase because Supabase is PostgreSQL.

The only required app-level change is configuring:

```env
DATABASE_URL=...
```

## 1. Create a Supabase project

1. Go to the Supabase dashboard.
2. Create a new project.
3. Choose your organization, project name, database password, and region.
4. Wait for the database to finish provisioning.

Use the official setup and connection docs:

- Supabase Prisma guide: https://supabase.com/docs/guides/database/prisma
- Supabase connection strings guide: https://supabase.com/docs/guides/database/connecting-to-postgres

## 2. Get your database connection string

In Supabase:

1. Open your project.
2. Click `Connect`.
3. Copy the `Direct connection` string.

For this repo, start with the direct connection string for local development and migrations.

It will look similar to:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Why direct connection first:

- this repo runs a normal Next.js server during local development
- Prisma Migrate and Prisma Studio behave best with a direct connection

## 3. Create `.env.local`

In the project root, create:

```text
.env.local
```

You can start from [.env.example](/C:/Users/reyna/gacha/.env.example).

Minimum values:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_PLATFORM_STELLAR_ADDRESS=
NEXT_PUBLIC_USDC_ASSET_CODE=USDC
NEXT_PUBLIC_USDC_ISSUER=
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=replace-this-with-a-long-random-string
```

After editing `.env.local`, restart the dev server.

## 4. Optional but recommended: create a dedicated Prisma DB user

Supabase’s Prisma guide recommends using a dedicated role for Prisma instead of always using the default `postgres` role.

In the Supabase SQL Editor, run SQL like this:

```sql
create user "prisma" with password 'strong_password_here' bypassrls createdb;
grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Then your connection string can use the `prisma` user instead of `postgres`.

This recommendation is based on Supabase’s official Prisma guide.

## 5. Install dependencies

From the repo root:

```powershell
npm install
```

## 6. Generate the Prisma client

Run:

```powershell
npm run prisma:generate
```

## 7. Run Prisma migrations against Supabase

This repo has a Prisma schema but your Supabase database still needs the tables created.

Run:

```powershell
npm run prisma:migrate -- --name init
```

This will:

- create migration files under `prisma/migrations`
- apply the schema to Supabase
- create all required tables for inventory, purchases, listings, and ownership history

## 8. Seed the card catalog into Supabase

Run:

```powershell
npm run prisma:seed
```

This loads the card catalog from [seed.ts](/C:/Users/reyna/gacha/prisma/seed.ts).

## 9. Start the app

Run:

```powershell
npm run dev
```

Once that is done:

- `/api/inventory` can use Supabase-backed `CardInstance` records
- marketplace listing queries stop failing from missing `DATABASE_URL`
- legacy local inventory can be imported into backend inventory

## 10. Verify the database

Check migration status:

```powershell
npx prisma migrate status
```

Open Prisma Studio:

```powershell
npx prisma studio
```

You should see tables such as:

- `User`
- `CardCatalog`
- `CardDrop`
- `CardInstance`
- `PackPurchase`
- `MarketplaceListing`
- `MarketplacePurchase`
- `OwnershipHistory`

You can also verify tables in the Supabase Table Editor.

## 11. If you later use a pooled Supabase connection

Supabase’s docs note that transaction poolers do not support prepared statements.

If you switch Prisma to a transaction-pooler URL later, add:

```text
?pgbouncer=true
```

Example:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

That guidance comes from Supabase’s Prisma troubleshooting docs.

For this repo today, I recommend staying on the direct connection first.

## 12. Common errors

### `Environment variable not found: DATABASE_URL`

Fix:

- create `.env.local`
- add `DATABASE_URL`
- restart `npm run dev`

### `Can't reach database server`

Fix:

- verify the Supabase project is active
- verify the password is correct
- verify you copied the right connection string from `Connect`
- if needed, add `?connect_timeout=30`

### `prepared statement already exists`

Fix:

- you are likely using a transaction pooler URL with Prisma
- append `?pgbouncer=true`

### Marketplace still says offline

Fix:

- confirm the running app sees `DATABASE_URL`
- fully restart the dev server after updating env files

## 13. Recommended first-time command flow

Run these in order:

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

## 14. Repo files that matter for the Supabase switch

- [.env.example](/C:/Users/reyna/gacha/.env.example)
- [schema.prisma](/C:/Users/reyna/gacha/prisma/schema.prisma)
- [seed.ts](/C:/Users/reyna/gacha/prisma/seed.ts)
- [prisma.ts](/C:/Users/reyna/gacha/src/lib/prisma.ts)

## Notes

I intentionally did not switch this repo to Supabase Auth or the Supabase JS client.

Current assumption:

- Supabase is only replacing the Postgres host
- Prisma remains the server-side database layer
- Freighter wallet auth and the app’s signed session flow stay as-is
