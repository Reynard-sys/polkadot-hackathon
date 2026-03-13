// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GachaNFT.sol";
import "./CardRegistry.sol";

/**
 * @title GachaPack
 * @notice Gacha / pack-opening contract for Anime Gacha TCG.
 *
 * Key design decisions for Westend AssetHub (Frontier EVM):
 *  - Rarity pools are cached ONCE per pack (4 external calls total).
 *    Each slot draw is then a pure memory operation — no per-slot external calls.
 *    This is critical: without caching, x20/x30 packs exceed the gas budget.
 *  - Series filter is applied once on the cached arrays (inline scan).
 *  - Duplicates are ALLOWED — ERC-1155 balances accumulate.
 *
 * Series:
 *   series=0 (Naruto)   — token IDs 1–16
 *   series=1 (OnePiece) — token IDs 17–32
 *
 * Prices (testnet WND):
 *   Standard x10  → 0.001  WND
 *   Premium  x20  → 0.0018 WND
 *   Ultra    x30  → 0.0025 WND
 */
contract GachaPack is Ownable, ReentrancyGuard {

    // ── Types ──────────────────────────────────────────────────────────────
    enum PackType { Standard, Premium, Ultra }

    struct PackConfig {
        uint256 price;
        uint8   size;
        uint8   minRare;
        bool    minLegendary;
    }

    // ── Constants ──────────────────────────────────────────────────────────
    uint16 private constant WEIGHT_COMMON    = 8200;
    uint16 private constant WEIGHT_RARE      = 9600;
    uint16 private constant WEIGHT_LEGENDARY = 9980;

    uint256 private constant PITY_THRESHOLD  = 50;
    uint256 private constant PITY_STEP       = 20;

    uint256 private constant NARUTO_MIN   = 1;
    uint256 private constant NARUTO_MAX   = 16;
    uint256 private constant ONEPIECE_MIN = 17;
    uint256 private constant ONEPIECE_MAX = 32;

    // ── State ──────────────────────────────────────────────────────────────
    GachaNFT     public immutable nft;
    CardRegistry public immutable registry;

    mapping(PackType => PackConfig) public packConfigs;
    mapping(address => uint256)     public packsWithoutMythic;

    // ── Events ────────────────────────────────────────────────────────────
    event PackOpened(address indexed player, PackType packType, uint8 series, uint256[] tokenIds);
    event CardMinted(address indexed player, uint256 indexed tokenId, CardRegistry.Rarity rarity);
    event PackPriceUpdated(PackType packType, uint256 newPrice);

    // ── Errors ────────────────────────────────────────────────────────────
    error InsufficientPayment(uint256 sent, uint256 required);
    error InvalidSeries(uint8 series);

    // ── Constructor ───────────────────────────────────────────────────────
    constructor(address _nft, address _registry) Ownable(msg.sender) {
        nft      = GachaNFT(_nft);
        registry = CardRegistry(_registry);

        packConfigs[PackType.Standard] = PackConfig({ price: 0.001  ether, size: 10, minRare: 1, minLegendary: false });
        packConfigs[PackType.Premium]  = PackConfig({ price: 0.0018 ether, size: 20, minRare: 2, minLegendary: false });
        packConfigs[PackType.Ultra]    = PackConfig({ price: 0.0025 ether, size: 30, minRare: 3, minLegendary: true  });
    }

    // ── Public ────────────────────────────────────────────────────────────
    function openStandardPack(uint8 series) external payable nonReentrant { _openPack(PackType.Standard, series); }
    function openPremiumPack (uint8 series) external payable nonReentrant { _openPack(PackType.Premium,  series); }
    function openUltraPack   (uint8 series) external payable nonReentrant { _openPack(PackType.Ultra,    series); }

    // ── Core logic ────────────────────────────────────────────────────────

    function _openPack(PackType packType, uint8 series) internal {
        if (series > 1) revert InvalidSeries(series);
        PackConfig memory cfg = packConfigs[packType];
        if (msg.value < cfg.price) revert InsufficientPayment(msg.value, cfg.price);

        // ── Cache pools ONCE ── (4 external calls total, not N per slot)
        uint256[] memory commonPool   = _seriesPool(CardRegistry.Rarity.Common,    series);
        uint256[] memory rarePool     = _seriesPool(CardRegistry.Rarity.Rare,      series);
        uint256[] memory legendPool   = _seriesPool(CardRegistry.Rarity.Legendary, series);
        uint256[] memory mythicPool   = _seriesPool(CardRegistry.Rarity.Mythic,    series);

        // Supply-downgrade fallbacks (pure memory, no external calls)
        if (mythicPool.length  == 0) mythicPool  = legendPool;
        if (legendPool.length  == 0) legendPool  = rarePool;
        if (rarePool.length    == 0) rarePool    = commonPool;

        // ── Seed ──────────────────────────────────────────────────────────
        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            msg.sender,
            block.timestamp,
            block.prevrandao,
            packsWithoutMythic[msg.sender]
        )));

        uint256 pityBonus = _getPityBonus(msg.sender);
        uint256[] memory tokenIds = new uint256[](cfg.size);
        bool gotMythic = false;
        uint256 slot = 0;

        // Guaranteed Rare+ slots
        for (uint256 g = 0; g < cfg.minRare; g++) {
            uint256 roll = uint256(keccak256(abi.encodePacked(seed, slot, "g"))) % 10000;
            uint256[] memory pool = rarePool;
            if      (roll >= WEIGHT_LEGENDARY) pool = mythicPool;
            else if (roll >= WEIGHT_RARE)      pool = legendPool;
            tokenIds[slot] = _drawFromPool(pool, seed, slot);
            if (pool.length == mythicPool.length && roll >= WEIGHT_LEGENDARY) gotMythic = true;
            slot++;
        }

        // Guaranteed Legendary+ slot (Ultra only)
        if (cfg.minLegendary) {
            uint256 roll = uint256(keccak256(abi.encodePacked(seed, slot, "g"))) % 10000;
            uint256[] memory pool = roll >= WEIGHT_LEGENDARY ? mythicPool : legendPool;
            tokenIds[slot] = _drawFromPool(pool, seed, slot);
            if (roll >= WEIGHT_LEGENDARY) gotMythic = true;
            slot++;
        }

        // Random slots (duplicates allowed)
        for (uint256 i = slot; i < cfg.size; i++) {
            uint256 roll = uint256(keccak256(abi.encodePacked(seed, i, "rarity"))) % 10000;
            uint256 mythicThreshold = pityBonus >= (10000 - WEIGHT_LEGENDARY)
                ? WEIGHT_LEGENDARY
                : WEIGHT_LEGENDARY - pityBonus;

            uint256[] memory pool;
            if      (roll < WEIGHT_COMMON)    pool = commonPool;
            else if (roll < WEIGHT_RARE)      pool = rarePool;
            else if (roll < mythicThreshold)  pool = legendPool;
            else                              { pool = mythicPool; gotMythic = true; }

            tokenIds[i] = _drawFromPool(pool, seed, i);
        }

        // Pity update
        packsWithoutMythic[msg.sender] = gotMythic ? 0 : packsWithoutMythic[msg.sender] + 1;

        // Mint all cards (duplicates accumulate in ERC-1155 balance)
        uint256[] memory amounts = new uint256[](cfg.size);
        for (uint256 i = 0; i < cfg.size; i++) {
            amounts[i] = 1;
            emit CardMinted(msg.sender, tokenIds[i], registry.getRarity(tokenIds[i]));
        }
        nft.mintCardBatch(msg.sender, tokenIds, amounts);
        emit PackOpened(msg.sender, packType, series, tokenIds);

        // Refund excess
        uint256 excess = msg.value - cfg.price;
        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}("");
            require(ok, "GachaPack: refund failed");
        }
    }

    // ── Pool helpers (pure memory after initial fetch) ────────────────────

    /**
     * @dev Fetch a rarity pool from the registry and filter to the series ID range.
     *      Called ONCE per rarity at the start of _openPack — result is cached in memory.
     */
    function _seriesPool(
        CardRegistry.Rarity rarity,
        uint8 series
    ) internal view returns (uint256[] memory) {
        uint256[] memory full = registry.getCardsByRarity(rarity);
        uint256 minId = series == 0 ? NARUTO_MIN : ONEPIECE_MIN;
        uint256 maxId = series == 0 ? NARUTO_MAX : ONEPIECE_MAX;

        uint256 count = 0;
        for (uint256 i = 0; i < full.length; i++) {
            if (full[i] >= minId && full[i] <= maxId) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < full.length; i++) {
            if (full[i] >= minId && full[i] <= maxId) result[idx++] = full[i];
        }
        return result;
    }

    /**
     * @dev Pick a random element from a pre-built in-memory pool.
     *      Pure memory — no external calls.
     *      Duplicates are allowed; pool size does not need to exceeds pack size.
     */
    function _drawFromPool(
        uint256[] memory pool,
        uint256 seed,
        uint256 nonce
    ) internal pure returns (uint256) {
        require(pool.length > 0, "GachaPack: empty pool");
        return pool[uint256(keccak256(abi.encodePacked(seed, nonce, "draw"))) % pool.length];
    }

    function _getPityBonus(address player) internal view returns (uint256) {
        uint256 count = packsWithoutMythic[player];
        if (count <= PITY_THRESHOLD) return 0;
        return (count - PITY_THRESHOLD) * PITY_STEP;
    }

    // ── Owner ─────────────────────────────────────────────────────────────
    function setPackPrice(PackType packType, uint256 newPrice) external onlyOwner {
        packConfigs[packType].price = newPrice;
        emit PackPriceUpdated(packType, newPrice);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "GachaPack: nothing to withdraw");
        (bool ok,) = owner().call{value: bal}("");
        require(ok, "GachaPack: withdraw failed");
    }

    function getPityCount(address player) external view returns (uint256) {
        return packsWithoutMythic[player];
    }

    receive() external payable {}
}
