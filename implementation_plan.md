# NFT Minting & Pack Opening Smart Contracts

This plan covers building the full EVM-compatible (Solidity) smart contract backend for the Anime Gacha TCG. The frontend stays untouched — we wire up everything in `contracts/` using Hardhat for the Polkadot EVM-compatible chain.

---

## Proposed Changes

### Hardhat Project Setup

#### [NEW] `contracts/` (root-level directory)
New Hardhat project initialized inside `c:\Users\reyna\gacha\contracts\` (already has a [package.json](file:///c:/Users/reyna/gacha/package.json) and `hardhat.config.ts` referenced in open editor tabs, so the scaffold may already exist — we will populate it).

---

### Smart Contracts

#### [NEW] [GachaNFT.sol](file:///c:/Users/reyna/gacha/contracts/contracts/GachaNFT.sol)

ERC-1155 multi-token contract. Each of the **48 cards** maps to a unique token ID (matching `nftTokenId` in [cards.json](file:///c:/Users/reyna/gacha/src/data/cards.json), IDs 1–48).

Key responsibilities:
- Supply caps enforced per token ID:
  - Common (IDs 1–10, 17–26, 33–42): max **10,000**
  - Rare (IDs 11–13, 27–29, 43–45): max **3,000**
  - Legendary (IDs 14–15, 30–31, 46–47): max **500**
  - Mythic (IDs 16, 32, 48): max **30**
- `mintCard(address to, uint256 tokenId, uint256 amount)` — called only by the Pack contract or owner
- `mintCardBatch(address to, uint256[] tokenIds, uint256[] amounts)` — batch version for pack opens
- `totalMinted(uint256 tokenId)` returns current total minted for supply-cap checks
- `uri(uint256 tokenId)` returns IPFS metadata URL (BaseURI + tokenId)
- Events: `CardMinted(address indexed player, uint256 tokenId)`

#### [NEW] [CardRegistry.sol](file:///c:/Users/reyna/gacha/contracts/contracts/CardRegistry.sol)

On-chain card metadata registry. Stores the rarity and anime of each token ID so the pack contract can build rarity pools without off-chain input at open time.

Key responsibilities:
- `enum Rarity { Common, Rare, Legendary, Mythic }`
- `enum Anime { Naruto, OnePiece, Pokemon }`
- `struct CardInfo { Rarity rarity; Anime anime; uint256 maxSupply; }`
- `mapping(uint256 => CardInfo) public cards` — populated via `registerCards()` owner call
- `uint256[] public cardsByRarity[4]` — pools of token IDs per rarity tier for randomized draws
- `isRarityAvailable(Rarity r)` — returns false if all cards of that rarity are minted out (supply downgrade check)
- `getRandomCardOfRarity(Rarity r, uint256 seed, uint256 nonce)` — picks a random card from the pool using on-chain seed

#### [NEW] [GachaPack.sol](file:///c:/Users/reyna/gacha/contracts/contracts/GachaPack.sol)

The core gacha/pack-opening contract. Accepts payment, performs pseudo-random pulls (with VRF hook), mints NFTs to the caller.

Key responsibilities:

**Pack Types**
| Pack | Cards | Price (ETH/native) | Guarantees |
|------|-------|--------------------|------------|
| Standard | 10 | 0.01 | ≥1 Rare |
| Premium | 20 | 0.018 | ≥2 Rare, higher Legendary chance |
| Ultra | 30 | 0.025 | ≥3 Rare + ≥1 Legendary |

**Rarity Weights (out of 10000)**
```
0–8199    → Common    (82%)
8200–9599 → Rare      (14%)
9600–9979 → Legendary (3.8%)
9980–9999 → Mythic    (0.2%)
```

**Guarantee Enforcement**
```
Standard x10:  slot[0] forced ≥ Rare; slots[1-9] normal
Premium  x20:  slots[0-1] forced ≥ Rare; slots[2-19] normal
Ultra    x30:  slots[0-2] forced ≥ Rare; slot[3] forced ≥ Legendary; slots[4-29] normal
```

**Supply Downgrade Cascade**
```
Mythic sold out    → downgrade to Legendary
Legendary sold out → downgrade to Rare
Rare sold out      → downgrade to Common
```

**Duplicate Prevention Per Pack**
Uses a `usedInThisPack` bitmap per pack-open transaction to prevent getting the same card twice in one pack.

**Pity System**
- `mapping(address => uint256) public packsWithoutMythic`
- Every 50 packs without a Mythic, Mythic effective range expands by +20 basis points (0.2% extra)
- Resets after a Mythic pull

**Randomness (Mock VRF for demo/testing)**
- For hackathon: uses `keccak256(blockhash + sender + nonce)` per slot as mock randomness
- Has an `IVRFConsumer` interface hook so Chainlink VRF can be plugged in later without changing the pack logic

**Key Functions**
- `openStandardPack()` payable
- `openPremiumPack()` payable
- `openUltraPack()` payable
- `withdraw()` owner only

**Events**
```solidity
event PackOpened(address indexed player, uint8 packType, uint256[] tokenIds);
event CardMinted(address indexed player, uint256 tokenId, string rarity);
```

---

### Scripts

#### [NEW] [scripts/deploy.ts](file:///c:/Users/reyna/gacha/contracts/scripts/deploy.ts)
Deploys `CardRegistry` → `GachaNFT` → `GachaPack`. Sets `GachaPack` as an authorized minter on `GachaNFT`. Logs all deployed addresses.

#### [NEW] [scripts/seedCards.ts](file:///c:/Users/reyna/gacha/contracts/scripts/seedCards.ts)
Calls `CardRegistry.registerCards()` with all 48 token IDs, their rarity and anime enums — derived directly from [src/data/cards.json](file:///c:/Users/reyna/gacha/src/data/cards.json).

#### [NEW] [scripts/openPackDemo.ts](file:///c:/Users/reyna/gacha/contracts/scripts/openPackDemo.ts)
Demo script: opens one Standard, one Premium, one Ultra pack, logs results.

---

### Tests

#### [NEW] [test/GachaNFT.test.ts](file:///c:/Users/reyna/gacha/contracts/test/GachaNFT.test.ts)
- Mint single card, check balance
- Enforce supply cap (should revert on over-mint)
- Batch mint (pack simulation)
- Non-minter cannot mint (access control)

#### [NEW] [test/CardRegistry.test.ts](file:///c:/Users/reyna/gacha/contracts/test/CardRegistry.test.ts)
- Register cards, check pools by rarity
- `isRarityAvailable` returns false when all minted
- `getRandomCardOfRarity` returns valid token IDs

#### [NEW] [test/GachaPack.test.ts](file:///c:/Users/reyna/gacha/contracts/test/GachaPack.test.ts)
- Open Standard pack: verify 10 cards minted, ≥1 Rare
- Open Premium pack: verify 20 cards, ≥2 Rare
- Open Ultra pack: verify 30 cards, ≥3 Rare + ≥1 Legendary
- No duplicate cards within a single pack
- Pity counter increments and resets
- Supply downgrade: mock all Mythics minted out, verify Mythic slot becomes Legendary

---

### Documentation

#### [NEW] [contracts/README.md](file:///c:/Users/reyna/gacha/contracts/README.md)
Architecture diagram, contract addresses (placeholder), ABI integration guide for the frontend.

#### [NEW] [CODEBASE_ANALYSIS.md](file:///c:/Users/reyna/gacha/CODEBASE_ANALYSIS.md)
Full codebase analysis document as requested.

---

## Verification Plan

### Automated Tests (Hardhat)

Run from `c:\Users\reyna\gacha\contracts\`:

```bash
npx hardhat test
```

This will run all three test files and print pass/fail per test case with gas usage.

To run a specific file:
```bash
npx hardhat test test/GachaPack.test.ts
```

### Manual Smoke Check (Local Node)

1. Start local node:
   ```bash
   npx hardhat node
   ```
2. Deploy in another terminal:
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   npx hardhat run scripts/seedCards.ts --network localhost
   ```
3. Open demo packs:
   ```bash
   npx hardhat run scripts/openPackDemo.ts --network localhost
   ```
4. Verify token balances printed to console match expected pack size (10, 20, 30 cards).

> [!NOTE]
> Chainlink VRF is stubbed with a mock randomness function for the hackathon demo. The `IVRFConsumer` interface is left in place so a real VRF callback can be wired in before mainnet, as recommended in the game bible.

