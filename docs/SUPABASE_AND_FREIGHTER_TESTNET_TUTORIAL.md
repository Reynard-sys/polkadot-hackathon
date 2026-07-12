# Supabase Fix + Freighter Testnet Tutorial

This guide covers the two things that usually block local testing in this repo:

1. Prisma cannot connect to Supabase
2. Freighter is on the wrong network for local Stellar testing

It is written for this project specifically, not as a generic Supabase or Stellar setup guide.

## Part 1: Fix Supabase in this repo

### The exact issue we hit

The login flow reached Prisma successfully, but Prisma failed when it tried to run `user.upsert()`.

The runtime error was:

```text
Can't reach database server at `db....supabase.co:5432`
```

In this repo, that usually means one of these:

- `.env.local` is overriding `DATABASE_URL` with the wrong value
- you have both `.env` and `.env.local` defining different `DATABASE_URL` values
- you are using a Supabase host your machine cannot currently reach
- Next.js is still running with old env values because the dev server was not restarted

### How env precedence works here

If `DATABASE_URL` exists in `.env.local`, that value overrides `.env`.

So if:

- `.env` has a working connection string
- `.env.local` has an older broken one

the app will still fail, because Next will use `.env.local`.

### Recommended fix

Use only one active `DATABASE_URL` during local development.

For this repo, the safest pattern is:

- keep your working `DATABASE_URL` in `.env`
- remove `DATABASE_URL` from `.env.local`
- restart the dev server

Your `.env.local` can still keep the frontend Stellar values such as:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
SESSION_SECRET=change-me-before-production
```

### What to check

Open:

- [.env](/C:/Users/reyna/gacha/.env)
- [.env.local](/C:/Users/reyna/gacha/.env.local)

Make sure you do **not** have two competing `DATABASE_URL` values.

### Which Supabase connection to use

If the direct database host keeps timing out on your machine, use the Supabase pooler connection instead of the direct `db...supabase.co:5432` host.

For Prisma with a pooler, Supabase commonly requires:

```text
?pgbouncer=true
```

If you are using a transaction pooler URL.

If your current connection already works with Prisma commands, keep that one and do not switch unnecessarily.

### Quick repair steps

1. Stop the dev server.
2. Open `.env.local`.
3. Remove the `DATABASE_URL=` line from `.env.local` if your working value already lives in `.env`.
4. Confirm `.env` still has the working `DATABASE_URL`.
5. Start the app again with:

```powershell
npm run dev
```

### Verify Supabase before testing login

From the project root, test Prisma connectivity:

```powershell
"SELECT 1;" | npx prisma db execute --stdin --schema prisma/schema.prisma
```

Then verify a real app table:

```powershell
'SELECT COUNT(*) FROM "User";' | npx prisma db execute --stdin --schema prisma/schema.prisma
```

If both commands work, Prisma can reach Supabase.

### If Prisma still fails

Check these next:

- your Supabase project is not paused
- the password in `DATABASE_URL` is correct
- you restarted `npm run dev` after editing env files
- you are not mixing a direct connection in one file and a pooled connection in another

### Why login depends on this

The Freighter signature can succeed and login can still fail afterward, because the app stores or updates the user record in Prisma during auth.

That means:

- wallet popup success does not prove database success
- if Prisma is offline, login still breaks

## Part 2: Switch Freighter to Testnet

This app is configured for Testnet when:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

That matches the app logic in:

- [server-env.ts](/C:/Users/reyna/gacha/src/lib/server-env.ts)

When `NEXT_PUBLIC_STELLAR_NETWORK` is not `public`, this repo uses the Testnet passphrase.

### Freighter steps

Based on the current Stellar developer docs for Freighter:

1. Open the Freighter browser extension.
2. Open the network selector in the wallet UI.
3. Choose `Testnet`.
4. If the account does not exist on Testnet yet, fund it with Friendbot.
5. Return to the app and reconnect the wallet.

Official references:

- https://developers.stellar.org/docs/build/guides/freighter/connect-testnet
- https://docs.freighter.app/extension-freighter-api/reading-data

### If your Testnet wallet has no balance

Freighter test accounts usually need Friendbot funding before they can sign and pay on Testnet.

Use:

- https://friendbot.stellar.org/

You will need the public Stellar address from Freighter.

### If the app still acts like Freighter is on the wrong network

Do this reset sequence:

1. Make sure Freighter itself says `Testnet`.
2. Refresh the app tab.
3. Disconnect and reconnect the wallet.
4. Retry the login signature prompt.

The app reads the wallet address and network during the connect/auth flow, so reconnecting clears stale wallet state.

## Part 3: Local testing checklist

Use this exact order:

1. Confirm `.env` has the working `DATABASE_URL`
2. Confirm `.env.local` does not override it with an older one
3. Confirm `.env.local` has `NEXT_PUBLIC_STELLAR_NETWORK=testnet`
4. Restart the dev server with `npm run dev`
5. Run the Prisma connectivity checks
6. Put Freighter on `Testnet`
7. Fund the test wallet if needed
8. Retry login
9. Test marketplace actions after login

## Part 4: If Freighter still will not connect locally

Stellar's current dapp docs note that Freighter often expects HTTPS when interacting with a local app.

Reference:

- https://developers.stellar.org/docs/build/guides/dapps/frontend-guide

If wallet access is blocked on plain localhost, try running Next.js with HTTPS:

```powershell
npx next dev --experimental-https
```

If that fixes the issue consistently, you can later update the `dev` script in [package.json](/C:/Users/reyna/gacha/package.json).

## Files in this repo that matter most

- [.env](/C:/Users/reyna/gacha/.env)
- [.env.local](/C:/Users/reyna/gacha/.env.local)
- [schema.prisma](/C:/Users/reyna/gacha/prisma/schema.prisma)
- [prisma.ts](/C:/Users/reyna/gacha/src/lib/prisma.ts)
- [server-env.ts](/C:/Users/reyna/gacha/src/lib/server-env.ts)
- [route.ts](/C:/Users/reyna/gacha/src/app/api/auth/verify/route.ts)

## Short version

If you only want the fastest fix:

1. Remove the bad `DATABASE_URL` from `.env.local`
2. Keep only the working Supabase connection string
3. Restart `npm run dev`
4. Switch Freighter to `Testnet`
5. Fund the wallet on Friendbot if needed
6. Retry login
