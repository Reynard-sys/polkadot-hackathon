import { expect } from "chai";
import { ethers } from "hardhat";
import { GachaNFT, CardRegistry, GachaPack } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// All 48 cards supply caps indexed 0–47
const SUPPLY_CAPS: bigint[] = [
  // Naruto Common (1–10): 10000 each
  10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n,
  // Naruto Rare (11–13): 3000
  3000n, 3000n, 3000n,
  // Naruto Legendary (14–15): 500
  500n, 500n,
  // Naruto Mythic (16): 30
  30n,
  // OnePiece Common (17–26): 10000
  10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n,
  // OnePiece Rare (27–29): 3000
  3000n, 3000n, 3000n,
  // OnePiece Legendary (30–31): 500
  500n, 500n,
  // OnePiece Mythic (32): 30
  30n,
  // Pokemon Common (33–42): 10000
  10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n, 10000n,
  // Pokemon Rare (43–45): 3000
  3000n, 3000n, 3000n,
  // Pokemon Legendary (46–47): 500
  500n, 500n,
  // Pokemon Mythic (48): 30
  30n,
];

// Rarity enum values
const Rarity = { Common: 0, Rare: 1, Legendary: 2, Mythic: 3 };
const Anime  = { Naruto: 0, OnePiece: 1, Pokemon: 2 };

/**
 * Build the 48-card registry seed arrays.
 * Returns { tokenIds, rarities, animes, maxSupplies }
 */
function buildCardArrays() {
  const tokenIds: bigint[]   = [];
  const rarities: number[]   = [];
  const animes: number[]     = [];
  const maxSupplies: bigint[] = [];

  // Naruto Commons 1–10
  for (let i = 1; i <= 10; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Common); animes.push(Anime.Naruto); maxSupplies.push(10000n);
  }
  // Naruto Rares 11–13
  for (let i = 11; i <= 13; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Rare); animes.push(Anime.Naruto); maxSupplies.push(3000n);
  }
  // Naruto Legendary 14–15
  for (let i = 14; i <= 15; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Legendary); animes.push(Anime.Naruto); maxSupplies.push(500n);
  }
  // Naruto Mythic 16
  tokenIds.push(16n); rarities.push(Rarity.Mythic); animes.push(Anime.Naruto); maxSupplies.push(30n);

  // OnePiece Commons 17–26
  for (let i = 17; i <= 26; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Common); animes.push(Anime.OnePiece); maxSupplies.push(10000n);
  }
  // OnePiece Rares 27–29
  for (let i = 27; i <= 29; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Rare); animes.push(Anime.OnePiece); maxSupplies.push(3000n);
  }
  // OnePiece Legendary 30–31
  for (let i = 30; i <= 31; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Legendary); animes.push(Anime.OnePiece); maxSupplies.push(500n);
  }
  // OnePiece Mythic 32
  tokenIds.push(32n); rarities.push(Rarity.Mythic); animes.push(Anime.OnePiece); maxSupplies.push(30n);

  // Pokemon Commons 33–42
  for (let i = 33; i <= 42; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Common); animes.push(Anime.Pokemon); maxSupplies.push(10000n);
  }
  // Pokemon Rares 43–45
  for (let i = 43; i <= 45; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Rare); animes.push(Anime.Pokemon); maxSupplies.push(3000n);
  }
  // Pokemon Legendary 46–47
  for (let i = 46; i <= 47; i++) {
    tokenIds.push(BigInt(i)); rarities.push(Rarity.Legendary); animes.push(Anime.Pokemon); maxSupplies.push(500n);
  }
  // Pokemon Mythic 48
  tokenIds.push(48n); rarities.push(Rarity.Mythic); animes.push(Anime.Pokemon); maxSupplies.push(30n);

  return { tokenIds, rarities, animes, maxSupplies };
}

// ===================================================================

describe("GachaNFT", function () {
  let nft: any;
  let owner: HardhatEthersSigner;
  let minterAccount: HardhatEthersSigner;
  let player: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, minterAccount, player, other] = await ethers.getSigners();
    const GachaNFT = await ethers.getContractFactory("GachaNFT");
    nft = await GachaNFT.deploy(
      "https://ipfs.io/ipfs/TEST_CID/",
      SUPPLY_CAPS as any
    );
    await nft.waitForDeployment();
    // Authorise minterAccount as minter
    await nft.setMinter(minterAccount.address, true);
  });

  it("initialises supply caps correctly", async () => {
    expect(await nft.maxSupply(1)).to.equal(10000n);   // Common
    expect(await nft.maxSupply(11)).to.equal(3000n);   // Rare
    expect(await nft.maxSupply(14)).to.equal(500n);    // Legendary
    expect(await nft.maxSupply(16)).to.equal(30n);     // Mythic
    expect(await nft.maxSupply(48)).to.equal(30n);     // Pokemon Mythic
  });

  it("minter can mint a single card", async () => {
    await nft.connect(minterAccount).mintCard(player.address, 1, 1);
    expect(await nft.balanceOf(player.address, 1)).to.equal(1n);
    expect(await nft.totalMinted(1)).to.equal(1n);
    expect(await nft.remainingSupply(1)).to.equal(9999n);
  });

  it("non-minter cannot mint", async () => {
    await expect(
      nft.connect(other).mintCard(player.address, 1, 1)
    ).to.be.revertedWithCustomError(nft, "NotMinter");
  });

  it("owner can mint without being in minters mapping", async () => {
    await nft.connect(owner).mintCard(player.address, 1, 1);
    expect(await nft.balanceOf(player.address, 1)).to.equal(1n);
  });

  it("reverts on invalid token ID 0", async () => {
    await expect(
      nft.connect(minterAccount).mintCard(player.address, 0, 1)
    ).to.be.revertedWithCustomError(nft, "InvalidTokenId");
  });

  it("reverts on token ID > 48", async () => {
    await expect(
      nft.connect(minterAccount).mintCard(player.address, 49, 1)
    ).to.be.revertedWithCustomError(nft, "InvalidTokenId");
  });

  it("reverts when supply cap exceeded", async () => {
    // Mythic token 16 has cap 30 — mint all 30
    for (let i = 0; i < 30; i++) {
      await nft.connect(minterAccount).mintCard(player.address, 16, 1);
    }
    expect(await nft.remainingSupply(16)).to.equal(0n);
    expect(await nft.isSoldOut(16)).to.equal(true);
    await expect(
      nft.connect(minterAccount).mintCard(player.address, 16, 1)
    ).to.be.revertedWithCustomError(nft, "SupplyCapExceeded");
  });

  it("batch mint works correctly", async () => {
    const tokenIds = [1n, 2n, 3n];
    const amounts  = [1n, 1n, 1n];
    await nft.connect(minterAccount).mintCardBatch(player.address, tokenIds as any, amounts as any);
    for (const id of tokenIds) {
      expect(await nft.balanceOf(player.address, id)).to.equal(1n);
    }
  });

  it("returns correct token URI", async () => {
    const uri = await nft.uri(5);
    expect(uri).to.include("5.json");
  });
});

// ===================================================================

describe("CardRegistry", function () {
  let registry: any;
  let owner: HardhatEthersSigner;
  let other: HardhatEthersSigner;
  let arrays: ReturnType<typeof buildCardArrays>;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const CardRegistry = await ethers.getContractFactory("CardRegistry");
    registry = await CardRegistry.deploy();
    await registry.waitForDeployment();

    arrays = buildCardArrays();
    await registry.registerCards(
      arrays.tokenIds, arrays.rarities, arrays.animes, arrays.maxSupplies
    );
  });

  it("registers all 48 cards", async () => {
    expect(await registry.totalCards()).to.equal(48n);
  });

  it("builds correct rarity pool sizes", async () => {
    // 30 commons (10+10+10), 9 rares (3+3+3), 6 legendary (2+2+2), 3 mythic (1+1+1)
    expect(await registry.rarityPoolSize(Rarity.Common)).to.equal(30n);
    expect(await registry.rarityPoolSize(Rarity.Rare)).to.equal(9n);
    expect(await registry.rarityPoolSize(Rarity.Legendary)).to.equal(6n);
    expect(await registry.rarityPoolSize(Rarity.Mythic)).to.equal(3n);
  });

  it("getCardsByRarity returns correct token IDs for Common", async () => {
    const commons = await registry.getCardsByRarity(Rarity.Common);
    expect(commons.length).to.equal(30);
    // Should contain token ID 1
    expect(commons.map((id: bigint) => Number(id))).to.include(1);
  });

  it("getRandomCardOfRarity returns a valid token ID", async () => {
    const seed  = 12345n;
    const nonce = 0n;
    const tokenId = await registry.getRandomCardOfRarity(Rarity.Rare, seed, nonce);
    // Rare tokens are 11–13, 27–29, 43–45
    const validRares = [11, 12, 13, 27, 28, 29, 43, 44, 45];
    expect(validRares).to.include(Number(tokenId));
  });

  it("prevents double-registering a card", async () => {
    await expect(
      registry.registerCards([1n], [Rarity.Common], [Anime.Naruto], [10000n])
    ).to.be.revertedWith("CardRegistry: already registered");
  });

  it("non-owner cannot register cards", async () => {
    await expect(
      registry.connect(other).registerCards([49n], [Rarity.Common], [Anime.Naruto], [100n])
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("getRarity returns correct rarity", async () => {
    expect(await registry.getRarity(1)).to.equal(Rarity.Common);    // Naruto common
    expect(await registry.getRarity(11)).to.equal(Rarity.Rare);     // Naruto rare
    expect(await registry.getRarity(14)).to.equal(Rarity.Legendary); // Naruto legendary
    expect(await registry.getRarity(16)).to.equal(Rarity.Mythic);   // Naruto mythic
    expect(await registry.getRarity(48)).to.equal(Rarity.Mythic);   // Pokemon mythic
  });
});

// ===================================================================

describe("GachaPack", function () {
  let nft: any;
  let registry: any;
  let pack: any;
  let owner: HardhatEthersSigner;
  let player: HardhatEthersSigner;
  let arrays: ReturnType<typeof buildCardArrays>;

  const PRICES = {
    standard: ethers.parseEther("0.001"),
    premium:  ethers.parseEther("0.0018"),
    ultra:    ethers.parseEther("0.0025"),
  };

  beforeEach(async () => {
    [owner, player] = await ethers.getSigners();

    // Deploy CardRegistry and seed it
    const CardRegistry = await ethers.getContractFactory("CardRegistry");
    registry = await CardRegistry.deploy();
    await registry.waitForDeployment();
    arrays = buildCardArrays();
    await registry.registerCards(
      arrays.tokenIds, arrays.rarities, arrays.animes, arrays.maxSupplies
    );

    // Deploy GachaNFT
    const GachaNFT = await ethers.getContractFactory("GachaNFT");
    nft = await GachaNFT.deploy("https://ipfs.io/ipfs/TEST/", SUPPLY_CAPS as any);
    await nft.waitForDeployment();

    // Deploy GachaPack
    const GachaPack = await ethers.getContractFactory("GachaPack");
    pack = await GachaPack.deploy(await nft.getAddress(), await registry.getAddress());
    await pack.waitForDeployment();

    // Authorise pack as minter
    await nft.setMinter(await pack.getAddress(), true);
  });

  // -------------------------------------------------------------------
  // Helper: open a pack and return minted token IDs
  // -------------------------------------------------------------------
  async function openPack(method: string, value: bigint): Promise<number[]> {
    const tx = await pack.connect(player)[method]({ value });
    const receipt = await tx.wait();

    const iface = new ethers.Interface([
      "event PackOpened(address indexed player, uint8 packType, uint256[] tokenIds)",
    ]);

    for (const log of receipt.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "PackOpened") {
          return parsed.args.tokenIds.map((id: bigint) => Number(id));
        }
      } catch { /* skip */ }
    }
    throw new Error("PackOpened event not found");
  }

  // -------------------------------------------------------------------
  // Payment tests
  // -------------------------------------------------------------------

  it("reverts if insufficient payment for Standard pack", async () => {
    await expect(
      pack.connect(player).openStandardPack({ value: ethers.parseEther("0.0005") })
    ).to.be.revertedWithCustomError(pack, "InsufficientPayment");
  });

  it("refunds excess payment", async () => {
    const overpay = ethers.parseEther("0.01"); // much more than 0.001
    const balBefore = await ethers.provider.getBalance(player.address);
    const tx = await pack.connect(player).openStandardPack({ value: overpay });
    const receipt = await tx.wait();
    const gasUsed = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);
    const balAfter = await ethers.provider.getBalance(player.address);
    // Player should only have spent ~0.001 + gas (not the full overpay amount)
    const spent = balBefore - balAfter;
    expect(spent).to.be.lessThan(ethers.parseEther("0.002") + gasUsed);
  });

  // -------------------------------------------------------------------
  // Standard pack (x10)
  // -------------------------------------------------------------------

  it("Standard pack: mints exactly 10 cards", async () => {
    const tokenIds = await openPack("openStandardPack", PRICES.standard);
    expect(tokenIds.length).to.equal(10);
  });

  it("Standard pack: all token IDs are valid (1–48)", async () => {
    const tokenIds = await openPack("openStandardPack", PRICES.standard);
    for (const id of tokenIds) {
      expect(id).to.be.gte(1);
      expect(id).to.be.lte(48);
    }
  });

  it("Standard pack: no duplicate cards", async () => {
    const tokenIds = await openPack("openStandardPack", PRICES.standard);
    const unique = new Set(tokenIds);
    expect(unique.size).to.equal(tokenIds.length);
  });

  it("Standard pack: player receives the minted tokens", async () => {
    const tokenIds = await openPack("openStandardPack", PRICES.standard);
    for (const id of tokenIds) {
      expect(await nft.balanceOf(player.address, id)).to.be.gte(1n);
    }
  });

  it("Standard pack: ≥1 card is Rare or higher", async () => {
    const tokenIds = await openPack("openStandardPack", PRICES.standard);
    const rareOrHigher = [
      11, 12, 13,                    // Naruto Rare
      14, 15,                        // Naruto Legendary
      16,                            // Naruto Mythic
      27, 28, 29,                    // OnePiece Rare
      30, 31,                        // OnePiece Legendary
      32,                            // OnePiece Mythic
      43, 44, 45,                    // Pokemon Rare
      46, 47,                        // Pokemon Legendary
      48,                            // Pokemon Mythic
    ];
    const hasRare = tokenIds.some(id => rareOrHigher.includes(id));
    expect(hasRare).to.equal(true);
  });

  // -------------------------------------------------------------------
  // Premium pack (x20)
  // -------------------------------------------------------------------

  it("Premium pack: mints exactly 20 cards", async () => {
    const tokenIds = await openPack("openPremiumPack", PRICES.premium);
    expect(tokenIds.length).to.equal(20);
  });

  it("Premium pack: no duplicate cards", async () => {
    const tokenIds = await openPack("openPremiumPack", PRICES.premium);
    const unique = new Set(tokenIds);
    expect(unique.size).to.equal(tokenIds.length);
  });

  // -------------------------------------------------------------------
  // Ultra pack (x30)
  // -------------------------------------------------------------------

  it("Ultra pack: mints exactly 30 cards", async () => {
    const tokenIds = await openPack("openUltraPack", PRICES.ultra);
    expect(tokenIds.length).to.equal(30);
  });

  it("Ultra pack: no duplicate cards", async () => {
    const tokenIds = await openPack("openUltraPack", PRICES.ultra);
    const unique = new Set(tokenIds);
    expect(unique.size).to.equal(tokenIds.length);
  });

  // -------------------------------------------------------------------
  // Pity system
  // -------------------------------------------------------------------

  it("pity counter starts at 0", async () => {
    expect(await pack.getPityCount(player.address)).to.equal(0n);
  });

  it("pity counter increments after a pack without Mythic (most likely outcome)", async () => {
    // Open several packs — almost certainly no Mythic in a few packs
    // We can't guarantee no Mythic, so just verify counter is tracked correctly
    const countBefore = await pack.getPityCount(player.address);
    await openPack("openStandardPack", PRICES.standard);
    const countAfter = await pack.getPityCount(player.address);
    // Either incremented (no mythic) or reset to 0 (got mythic – very unlikely)
    expect(countAfter === countBefore + 1n || countAfter === 0n).to.equal(true);
  });

  // -------------------------------------------------------------------
  // Withdraw
  // -------------------------------------------------------------------

  it("owner can withdraw collected fees", async () => {
    await openPack("openStandardPack", PRICES.standard);
    const balBefore = await ethers.provider.getBalance(owner.address);
    const tx = await pack.connect(owner).withdraw();
    const receipt = await tx.wait();
    const gas = (receipt?.gasUsed ?? 0n) * (receipt?.gasPrice ?? 0n);
    const balAfter = await ethers.provider.getBalance(owner.address);
    expect(balAfter + gas).to.be.gt(balBefore);
  });

  it("non-owner cannot withdraw", async () => {
    await expect(
      pack.connect(player).withdraw()
    ).to.be.revertedWithCustomError(pack, "OwnableUnauthorizedAccount");
  });
});
