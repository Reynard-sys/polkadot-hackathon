# Setup and Deployment

This document explains how to run Aniverse Nexus locally, configure the environment, deploy the Solidity contracts, and troubleshoot common issues.

## 1. Prerequisites

### Required

- Node.js 20 or newer
- npm 10 or newer
- Git

### Recommended for full-chain testing

- MetaMask
- a Westend AssetHub EVM account with enough WND for testing
- access to an IPFS-hosted metadata directory for card metadata

## 2. Frontend Setup

### Install dependencies

From the project root:

```bash
npm install
```

### Create `.env.local`

Copy the example file:

```bash
copy .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_GACHA_NFT_ADDRESS=0x...
NEXT_PUBLIC_GACHA_PACK_ADDRESS=0x...
```

### What these values do

| Variable                         | Purpose                       |
| -------------------------------- | ----------------------------- |
| `NEXT_PUBLIC_GACHA_NFT_ADDRESS`  | ERC-1155 contract address     |
| `NEXT_PUBLIC_GACHA_PACK_ADDRESS` | pack-opening contract address |

### Simulation mode

If these values are blank or zero-address values, the app will use client-side simulation for pack opening.

This is useful when:

- you want to demo the UX without a live contract deployment
- you want to iterate on the frontend quickly
- you do not want to spend testnet funds yet

### Run the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 3. Wallet and Network

The current UI is designed around MetaMask.

### Network used by the app

- Chain name: `Westend AssetHub`
- Chain ID: `420420421`
- Hex chain ID: `0x190f1b45`
- RPC URL: `https://westend-asset-hub-eth-rpc.polkadot.io`
- Explorer: `https://assethub-westend.subscan.io`
- Native currency: `WND`

When the user opens a pack, the app attempts to switch MetaMask to this network through `wallet_switchEthereumChain`, and if needed, `wallet_addEthereumChain`.

## 4. Contract Workspace Setup

The contract workspace lives in `contracts/`.

### Install dependencies

```bash
cd contracts
npm install
```

### Create `contracts/.env`

Copy:

```bash
copy .env.example .env
```

Then fill in:

```env
PRIVATE_KEY=<your-private-key-without-0x>
WESTEND_RPC_URL=https://westend-asset-hub-eth-rpc.polkadot.io
BASE_URI=https://ipfs.io/ipfs/<your-cid>/
CARD_REGISTRY_ADDRESS=
NEXT_PUBLIC_GACHA_NFT_ADDRESS=
NEXT_PUBLIC_GACHA_PACK_ADDRESS=
```

### Environment variable reference

| Variable                         | Purpose                                     |
| -------------------------------- | ------------------------------------------- |
| `PRIVATE_KEY`                    | deployer key for Hardhat                    |
| `WESTEND_RPC_URL`                | Frontier-compatible RPC endpoint            |
| `BASE_URI`                       | base metadata URI for the ERC-1155 contract |
| `CARD_REGISTRY_ADDRESS`          | set after deployment                        |
| `NEXT_PUBLIC_GACHA_NFT_ADDRESS`  | set after deployment                        |
| `NEXT_PUBLIC_GACHA_PACK_ADDRESS` | set after deployment                        |

## 5. Contract Commands

From `contracts/`:

### Compile

```bash
npm run compile
```

### Run tests

```bash
npm run test
```

### Deploy locally

```bash
npm run deploy:local
```

### Deploy to Westend AssetHub EVM

```bash
npm run deploy:westend
```

### Seed locally

```bash
npm run seed:local
```

### Seed Westend

```bash
npm run seed:westend
```

### Local demo node

```bash
npm run node
```

## 6. Recommended Deployment Sequence

### A. Compile the contracts

```bash
cd contracts
npm run compile
```

### B. Deploy

```bash
npm run deploy:westend
```

Capture the output addresses for:

- `CARD_REGISTRY_ADDRESS`
- `NEXT_PUBLIC_GACHA_NFT_ADDRESS`
- `NEXT_PUBLIC_GACHA_PACK_ADDRESS`

### C. Seed the registry

```bash
npm run seed:westend
```

### D. Update env files

You have two options:

#### Option 1: copy manually

Write the deployed addresses into:

- `contracts/.env`
- root `.env.local`

#### Option 2: use the helper script

```bash
npx hardhat run scripts/createEnv.ts --network westend_assethub
```

### E. Set or update metadata URI if needed

```bash
npx hardhat run scripts/setBaseUri.ts --network westend_assethub
```

### F. Run the frontend

Back in the root:

```bash
npm run dev
```

## 7. Metadata Hosting

The ERC-1155 contract expects a base URI that resolves as:

```text
<BASE_URI><tokenId>.json
```

Example:

```text
https://ipfs.io/ipfs/<cid>/1.json
https://ipfs.io/ipfs/<cid>/48.json
```

When you update metadata:

1. upload the metadata folder to IPFS
2. update `BASE_URI` in `contracts/.env`
3. call `setBaseUri.ts` if the NFT contract is already deployed

## 8. Demo-Friendly Setup Recommendation

For the cleanest hackathon demo:

1. use deployed Westend contract addresses in `.env.local`
2. keep metadata on IPFS
3. run the frontend locally with `npm run dev`
4. connect MetaMask to Westend AssetHub EVM
5. make sure the demo wallet has WND

## 9. Troubleshooting

### Problem: `Could not get provider.`

Likely causes:

- MetaMask is not installed
- MetaMask is locked
- the browser does not expose `window.ethereum`

Fix:

- install MetaMask
- unlock MetaMask
- reload the page

### Problem: `Connect MetaMask to open packs.`

Cause:

- no wallet connected in the app

Fix:

- use the shared wallet connect flow and connect MetaMask first

### Problem: a pack transaction is pending forever or is rejected by the tx pool

Cause:

- Westend AssetHub EVM can be sensitive to pending nonces and replacement behavior

Fix:

- wait for the pending tx to settle
- clear the pending wallet activity if needed
- avoid spamming open-pack requests

### Problem: metadata does not show correctly

Cause:

- `BASE_URI` is wrong
- IPFS JSON files are missing or named incorrectly
- the wallet or explorer is caching old metadata

Fix:

- verify the URI for `1.json` and `48.json`
- update the base URI on the NFT contract if needed
- hard-refresh the app and wallet views

### Problem: `Metadata error` or Frontier view/read quirks

Cause:

- Frontier-based nodes can be strict or inconsistent around gas estimation or some view patterns

Fix:

- prefer the provided scripts that already use explicit gas values
- avoid assuming that every direct RPC read behaves like a local Hardhat node

## 10. Production and Hosting Notes

### Frontend hosting

Recommended:

- Vercel for the Next.js frontend

Before hosting:

- set the public contract addresses in the deployment environment
- confirm the app still points to Westend AssetHub EVM
- verify wallet prompts and pack-opening behavior in the hosted domain

### Contract hosting model

Contracts are deployed to the EVM network itself. There is no separate contract hosting platform beyond the chain and your deployment workflow.

## 11. Files to Review During Setup

- `README.md`
- `.env.example`
- `contracts/.env.example`
- `contracts/hardhat.config.ts`
- `src/lib/contracts.ts`
- `src/lib/switchToWestend.ts`
