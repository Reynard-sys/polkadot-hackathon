# NFT Minting — Pack Opening Implementation Tasks

> **Project:** Anime Gacha TCG · Polkadot Hackathon  
> **Analyzed:** 2026-03-12  
> **Scope:** What needs to be done to implement NFT minting for opening packs, end-to-end.

---

## Current State of the Codebase

### ✅ Already Written (Smart Contracts Layer)

All three Solidity contracts exist in `contracts/contracts/`:

| File | Status | Notes |
|------|--------|-------|
| `GachaNFT.sol` | ✅ Written | ERC-1155, supply caps, `mintCard` / `mintCardBatch`, minter access control |
| `CardRegistry.sol` | ✅ Written | Rarity pools, `registerCards`, `getRandomCardOfRarity`, `getRarity` |
| `GachaPack.sol` | ✅ Written | Pack logic, rarity weights, pity system, supply downgrade, duplicate prevention |

All deployment scripts exist in `contracts/scripts/`:

| File | Status | Notes |
|------|--------|-------|
| `deploy.ts` | ✅ Written | Deploys all 3 contracts in order, wires minter auth |
| `seedCards.ts` | ✅ Written (verify below) | Registers all 48 cards from `cards.json` |
| `openPackDemo.ts` | ✅ Written | Opens one of each pack type and logs results |

A combined test file exists at `contracts/test/GachaTCG.test.ts` with tests for all three contracts.

### ❌ Not Yet Done

The contracts have **never been compiled or run** — no `artifacts/`, no `typechain-types/`, no test results. Additionally, the frontend has zero integration with the contracts.

---

## Tasks To Complete

### Phase 1 — Compile & Verify Contracts *(Do First)*

- [ ] **1.1** — Run `npx hardhat compile` inside `contracts/` and fix any compilation errors.
  - Known risk: `GachaPack.sol` uses `_tempUsed()` with assembly to get a persistent mapping storage slot. This is a pattern that works but may trigger Solidity warnings — verify it compiles cleanly.
  - Known risk: `deploy.ts` imports `cards.json` via `../../src/data/cards.json` — verify the relative path resolves correctly from `contracts/` and that `cards.json` contains a `maxSupply` field on each entry; if not, the supply cap array will be all zeros.

- [ ] **1.2** — Run `npx hardhat test` inside `contracts/` and confirm all tests pass.
  - The test file at `contracts/test/GachaTCG.test.ts` covers:
    - `GachaNFT`: supply caps, mint single, batch mint, non-minter reverts, supply cap exceeded revert, token URI
    - `CardRegistry`: 48-card registration, rarity pool sizes, `getRandomCardOfRarity`, double-register revert, non-owner revert, `getRarity` correctness
    - `GachaPack`: payment validation, excess refund, Standard/Premium/Ultra pack sizes, no duplicate cards per pack, pity counter tracking, owner withdraw

- [ ] **1.3** — Fix any test failures. Likely edge cases to watch:
  - The `_tempUsed()` storage bitmap is **not cleared between packs**. In real use each tx starts fresh (different tx context), but in a Hardhat test multiple packs called sequentially in the same test may share state if tests are not isolated. Verify this doesn't break the "no duplicate cards" test.
  - `seedCards.ts` — double-check it reads correctly from `src/data/cards.json`.

---

### Phase 2 — Check & Fix `cards.json` Data *(Required for Deploy Scripts)*

- [ ] **2.1** — Open `src/data/cards.json` and confirm every card object has:
  - `"nftTokenId"`: a string `"1"` through `"48"` (no gaps, ordered correctly per anime group)
  - `"maxSupply"`: a number (`10000` for Common, `3000` for Rare, `500` for Legendary, `30` for Mythic)
  - `"rarity"`: one of `"Common"` | `"Rare"` | `"Legendary"` | `"Mythic"`
  - `"anime"`: one of `"Naruto"` | `"OnePiece"` | `"Pokemon"`

- [ ] **2.2** — If `maxSupply` is missing from `cards.json`, **add it** to every card entry based on rarity:
  - Common → `10000`, Rare → `3000`, Legendary → `500`, Mythic → `30`

- [ ] **2.3** — Confirm token ID grouping matches what the contracts expect:
  ```
  Naruto  Common:    IDs 1–10
  Naruto  Rare:      IDs 11–13
  Naruto  Legendary: IDs 14–15
  Naruto  Mythic:    ID 16
  OnePiece Common:   IDs 17–26
  OnePiece Rare:     IDs 27–29
  OnePiece Legendary:IDs 30–31
  OnePiece Mythic:   ID 32
  Pokemon  Common:   IDs 33–42
  Pokemon  Rare:     IDs 43–45
  Pokemon  Legendary:IDs 46–47
  Pokemon  Mythic:   ID 48
  ```

---

### Phase 3 — Local Node Smoke Test *(Verify End-to-End Before Testnet)*

- [ ] **3.1** — Start a local Hardhat node:
  ```bash
  cd contracts
  npx hardhat node
  ```

- [ ] **3.2** — In a second terminal, run the full deploy + seed sequence:
  ```bash
  cd contracts
  npx hardhat run scripts/deploy.ts --network localhost
  npx hardhat run scripts/seedCards.ts --network localhost
  ```
  Copy the printed addresses (`CARD_REGISTRY_ADDRESS`, `GACHA_NFT_ADDRESS`, `GACHA_PACK_ADDRESS`) into `contracts/.env`.

- [ ] **3.3** — Run the demo pack opener:
  ```bash
  npx hardhat run scripts/openPackDemo.ts --network localhost
  ```
  **Expected output:** Three pack results logged — 10 cards (Standard), 20 cards (Premium), 30 cards (Ultra). All token IDs should be between 1–48, no duplicates within a pack.

- [ ] **3.4** — Verify NFT balances on-chain using a quick Hardhat console snippet:
  ```bash
  npx hardhat console --network localhost
  # Then in the REPL:
  const nft = await ethers.getContractAt("GachaNFT", "<GACHA_NFT_ADDRESS>")
  await nft.balanceOf("<PLAYER_ADDRESS>", 1)   // should be 0 or 1
  await nft.totalMinted(1)                      // should reflect mints
  ```

---

### Phase 4 — Westend AssetHub Testnet Deployment *(Polkadot EVM)*

- [ ] **4.1** — Set up `contracts/.env` from `contracts/.env.example`:
  ```
  PRIVATE_KEY=<your-deployer-private-key>
  WESTEND_RPC_URL=https://westend-asset-hub-eth-rpc.polkadot.io
  BASE_URI=https://ipfs.io/ipfs/PLACEHOLDER_CID/
  ```

- [ ] **4.2** — Fund the deployer wallet with **WND testnet tokens** from the Westend faucet (need ~0.1 WND minimum for deployment gas).
  - Faucet: https://faucet.polkadot.io/ (select Westend AssetHub)

- [ ] **4.3** — Deploy to Westend AssetHub:
  ```bash
  cd contracts
  npx hardhat run scripts/deploy.ts --network westend_assethub
  npx hardhat run scripts/seedCards.ts --network westend_assethub
  ```

- [ ] **4.4** — Record the deployed contract addresses and update `contracts/.env` and any frontend environment files.

- [ ] **4.5** — Run the demo on testnet to confirm minting works on Polkadot EVM:
  ```bash
  npx hardhat run scripts/openPackDemo.ts --network westend_assethub
  ```

---

### Phase 5 — IPFS Metadata Upload *(for `uri()` to return real data)*

- [ ] **5.1** — Create 48 JSON metadata files (one per card), named `1.json` through `48.json`. Each file should follow the ERC-1155 metadata standard:
  ```json
  {
    "name": "Naruto Uzumaki — Shadow Clone Rookie",
    "description": "On Summon: A Shadow Clone (1/1) is created in any empty Frontline slot.",
    "image": "ipfs://<CID>/images/1.png",
    "attributes": [
      { "trait_type": "Anime",   "value": "Naruto" },
      { "trait_type": "Rarity",  "value": "Common" },
      { "trait_type": "Mana",    "value": 2 },
      { "trait_type": "Power",   "value": 3 },
      { "trait_type": "HP",      "value": 3 },
      { "trait_type": "Element", "value": "Air" },
      { "trait_type": "Zone",    "value": "Frontline" }
    ]
  }
  ```

- [ ] **5.2** — Upload card images and metadata JSON files to IPFS (Pinata or nft.storage recommended).

- [ ] **5.3** — After uploading, call `GachaNFT.setBaseUri("<new-ipfs-CID-folder-uri>")` on the deployed contract (owner only).

---

### Phase 6 — Frontend Integration *(Wire the Gacha Page to the Contracts)*

- [ ] **6.1** — Create the missing `/gacha` route in `src/app/gacha/page.tsx`.

- [ ] **6.2** — Add contract ABIs to the frontend. After compiling, copy the relevant ABI arrays from:
  - `contracts/artifacts/contracts/GachaPack.sol/GachaPack.json` → `src/lib/abi/GachaPack.json`
  - `contracts/artifacts/contracts/GachaNFT.sol/GachaNFT.json` → `src/lib/abi/GachaNFT.json`

- [ ] **6.3** — Create `src/lib/contracts.ts` exporting contract addresses and ABI references:
  ```ts
  export const GACHA_PACK_ADDRESS = process.env.NEXT_PUBLIC_GACHA_PACK_ADDRESS!;
  export const GACHA_NFT_ADDRESS  = process.env.NEXT_PUBLIC_GACHA_NFT_ADDRESS!;
  ```
  Add `NEXT_PUBLIC_GACHA_PACK_ADDRESS` and `NEXT_PUBLIC_GACHA_NFT_ADDRESS` to `.env.local`.

- [ ] **6.4** — Add a Web3 provider. Use `ethers.js` (already a dependency via Hardhat) or `wagmi` + `viem` for a React-friendly approach.
  - Recommended: use `ethers.BrowserProvider(window.ethereum)` directly since wallet (Polkadot extension) is already partially integrated.

- [ ] **6.5** — Implement a `usePackOpening` hook in `src/features/gacha/hooks/usePackOpening.ts` with:
  - `openStandardPack()`, `openPremiumPack()`, `openUltraPack()` functions
  - Loading / error / result state
  - Reads `PackOpened` event logs from the receipt to extract `tokenIds`

- [ ] **6.6** — Build the Gacha UI in `src/features/gacha/index.tsx`:
  - Pack selection (Standard / Premium / Ultra) with price display in WND
  - "Open Pack" button that calls the appropriate contract function
  - Card reveal animation after a pack is opened (show the returned `tokenIds` mapped to card data from `cards.json`)
  - Display player's pity counter (call `GachaPack.getPityCount(playerAddress)`)
  - Handle insufficient funds error gracefully

- [ ] **6.7** — After opening a pack, show the player their current NFT collection by querying `GachaNFT.balanceOf(address, tokenId)` for all 48 token IDs.

---

## Critical Bugs / Issues Found During Analysis

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `_tempUsed()` uses a fixed storage slot (`keccak256("GachaPack.usedInThisPack")`). This slot is **never cleared**. On the first pack open per tx it is empty (assumed), but consecutive packs in the same tx could share the bitmap. Since each `openXxxPack` call is a separate tx this works — but if the storage slot ever has leftover data from a bug/failed tx it won't reset. Consider clearing it at start of `_openPack`. | Medium | `GachaPack.sol:383–389` |
| 2 | `GachaPack.sol` pity tracking: guaranteed slots (Rare/Legendary) are filled first, then normal slots are checked for Mythic. A Mythic pulled in a guaranteed slot (which can happen — `_drawGuaranteedMin` can roll Mythic) also sets `gotMythic = true` correctly. But it only checks Mythic in **normal slots** (`gotMythic = true` inside the normal loop). Guaranteed slots don't set `gotMythic`. This means a Mythic won in a guaranteed slot doesn't reset the pity counter. **Fix:** set `gotMythic = true` in the guaranteed-slot loop as well if rarity returned is Mythic. | Medium | `GachaPack.sol:186–199` |
| 3 | `deploy.ts` reads `maxSupply` from `cards.json` — this field may not exist (the `cards.json` schema from the game bible shows `nftTokenId` as `string \| null`, but no `maxSupply`). If missing, all supply caps default to `0n`, making every mint revert. | High | `scripts/deploy.ts:17–24` |
| 4 | `contracts/test/GachaTCG.test.ts` imports `typechain-types` which don't exist yet (no compile has run). The import will fail until `npx hardhat compile` is run. | High | `test/GachaTCG.test.ts:3` |

---

## Quick-Start Checklist (Recommended Order)

```
1. cd contracts && npx hardhat compile         ← generates typechain-types
2. Verify cards.json has maxSupply field        ← fix if missing
3. npx hardhat test                            ← all tests should pass
4. Fix bugs #1 and #2 above if tests expose them
5. npx hardhat node  (terminal 1)
6. npx hardhat run scripts/deploy.ts --network localhost  (terminal 2)
7. npx hardhat run scripts/seedCards.ts --network localhost
8. npx hardhat run scripts/openPackDemo.ts --network localhost
9. Fund Westend wallet + deploy to westend_assethub
10. Upload IPFS metadata + call setBaseUri
11. Build /gacha frontend page + usePackOpening hook
```
