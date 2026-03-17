// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GachaNFT.sol";
import "./CardRegistry.sol";

/**
 * @title GachaPack
 * @notice Gacha / pack-opening contract for Aniverse Nexus.
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
        uint8   maxCopies;
    }

    struct PoolSet {
        uint256[] common;
        uint256[] rare;
        uint256[] legendary;
        uint256[] mythic;
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
    uint256 private constant POKEMON_MIN  = 33;
    uint256 private constant POKEMON_MAX  = 48;

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

        packConfigs[PackType.Standard] = PackConfig({ price: 0.001 ether,  size: 10, minRare: 1, minLegendary: false, maxCopies: 1 });
        packConfigs[PackType.Premium]  = PackConfig({ price: 0.0018 ether, size: 20, minRare: 2, minLegendary: false, maxCopies: 2 });
        packConfigs[PackType.Ultra]    = PackConfig({ price: 0.0025 ether, size: 30, minRare: 3, minLegendary: true,  maxCopies: 3 });
    }

    // ── Public ────────────────────────────────────────────────────────────
    function openStandardPack(uint8 series) external payable nonReentrant { _openPack(PackType.Standard, series); }
    function openPremiumPack (uint8 series) external payable nonReentrant { _openPack(PackType.Premium,  series); }
    function openUltraPack   (uint8 series) external payable nonReentrant { _openPack(PackType.Ultra,    series); }

    // ── Core logic ────────────────────────────────────────────────────────

    function _openPack(PackType packType, uint8 series) internal {
        if (series > 2) revert InvalidSeries(series);
        PackConfig storage cfg = packConfigs[packType];
        uint256 packPrice = cfg.price;
        uint8 packSize = cfg.size;
        uint8 minRare = cfg.minRare;
        bool minLegendary = cfg.minLegendary;
        uint8 maxCopies = cfg.maxCopies;
        if (msg.value < packPrice) revert InsufficientPayment(msg.value, packPrice);

        // ── Cache pools ONCE ── (4 external calls total, not N per slot)

        // ── Seed ──────────────────────────────────────────────────────────
        uint256 seed = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            msg.sender,
            block.timestamp,
            block.prevrandao,
            packsWithoutMythic[msg.sender]
        )));

        uint256 pityBonus = _getPityBonus(msg.sender);
        (uint256[] memory tokenIds, bool gotMythic) = _buildPack(
            series,
            packSize,
            minRare,
            minLegendary,
            maxCopies,
            seed,
            pityBonus
        );

        // Pity update
        packsWithoutMythic[msg.sender] = gotMythic ? 0 : packsWithoutMythic[msg.sender] + 1;

        // Mint all cards (duplicates accumulate in ERC-1155 balance)
        uint256[] memory amounts = new uint256[](packSize);
        for (uint256 i = 0; i < packSize; i++) {
            amounts[i] = 1;
            emit CardMinted(msg.sender, tokenIds[i], registry.getRarity(tokenIds[i]));
        }
        nft.mintCardBatch(msg.sender, tokenIds, amounts);
        emit PackOpened(msg.sender, packType, series, tokenIds);

        // Refund excess
        uint256 excess = msg.value - packPrice;
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
        uint256 minId;
        uint256 maxId;

        if (series == 0) {
            minId = NARUTO_MIN;
            maxId = NARUTO_MAX;
        } else if (series == 1) {
            minId = ONEPIECE_MIN;
            maxId = ONEPIECE_MAX;
        } else {
            minId = POKEMON_MIN;
            maxId = POKEMON_MAX;
        }

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

    function _buildPack(
        uint8 series,
        uint8 packSize,
        uint8 minRare,
        bool minLegendary,
        uint8 maxCopies,
        uint256 seed,
        uint256 pityBonus
    ) internal view returns (uint256[] memory tokenIds, bool gotMythic) {
        PoolSet memory pools = PoolSet({
            common: _seriesPool(CardRegistry.Rarity.Common, series),
            rare: _seriesPool(CardRegistry.Rarity.Rare, series),
            legendary: _seriesPool(CardRegistry.Rarity.Legendary, series),
            mythic: _seriesPool(CardRegistry.Rarity.Mythic, series)
        });

        tokenIds = new uint256[](packSize);
        uint256 slot = 0;

        for (uint256 g = 0; g < minRare; g++) {
            (uint256 drawnTokenId, bool drewMythic) = _drawGuaranteedRareSlot(
                pools,
                tokenIds,
                slot,
                seed,
                maxCopies
            );
            tokenIds[slot] = drawnTokenId;
            if (drewMythic) gotMythic = true;
            slot++;
        }

        if (minLegendary) {
            (uint256 drawnTokenId, bool drewMythic) = _drawGuaranteedLegendarySlot(
                pools,
                tokenIds,
                slot,
                seed,
                maxCopies
            );
            tokenIds[slot] = drawnTokenId;
            if (drewMythic) gotMythic = true;
            slot++;
        }

        for (uint256 i = slot; i < packSize; i++) {
            (uint256 drawnTokenId, bool drewMythic) = _drawRandomSlot(
                pools,
                tokenIds,
                i,
                seed,
                pityBonus,
                maxCopies
            );
            tokenIds[i] = drawnTokenId;
            if (drewMythic) gotMythic = true;
        }
    }

    function _drawGuaranteedRareSlot(
        PoolSet memory pools,
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 seed,
        uint8 maxCopies
    ) internal pure returns (uint256 tokenId, bool drewMythic) {
        uint256 roll = uint256(keccak256(abi.encodePacked(seed, drawnCount, "g"))) % 10000;
        CardRegistry.Rarity targetRarity = CardRegistry.Rarity.Rare;
        if (roll >= WEIGHT_LEGENDARY) {
            targetRarity = CardRegistry.Rarity.Mythic;
        } else if (roll >= WEIGHT_RARE) {
            targetRarity = CardRegistry.Rarity.Legendary;
        }

        CardRegistry.Rarity actualRarity;
        (tokenId, actualRarity) = _drawForRarity(
            targetRarity,
            pools,
            tokenIds,
            drawnCount,
            seed,
            drawnCount,
            maxCopies
        );
        return (tokenId, actualRarity == CardRegistry.Rarity.Mythic);
    }

    function _drawGuaranteedLegendarySlot(
        PoolSet memory pools,
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 seed,
        uint8 maxCopies
    ) internal pure returns (uint256 tokenId, bool drewMythic) {
        uint256 roll = uint256(keccak256(abi.encodePacked(seed, drawnCount, "g"))) % 10000;
        CardRegistry.Rarity targetRarity = roll >= WEIGHT_LEGENDARY
            ? CardRegistry.Rarity.Mythic
            : CardRegistry.Rarity.Legendary;

        CardRegistry.Rarity actualRarity;
        (tokenId, actualRarity) = _drawForRarity(
            targetRarity,
            pools,
            tokenIds,
            drawnCount,
            seed,
            drawnCount,
            maxCopies
        );
        return (tokenId, actualRarity == CardRegistry.Rarity.Mythic);
    }

    function _drawRandomSlot(
        PoolSet memory pools,
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 seed,
        uint256 pityBonus,
        uint8 maxCopies
    ) internal pure returns (uint256 tokenId, bool drewMythic) {
        uint256 roll = uint256(keccak256(abi.encodePacked(seed, drawnCount, "rarity"))) % 10000;
        uint256 mythicThreshold = pityBonus >= (10000 - WEIGHT_LEGENDARY)
            ? WEIGHT_LEGENDARY
            : WEIGHT_LEGENDARY - pityBonus;

        CardRegistry.Rarity targetRarity;
        if (roll < WEIGHT_COMMON) {
            targetRarity = CardRegistry.Rarity.Common;
        } else if (roll < WEIGHT_RARE) {
            targetRarity = CardRegistry.Rarity.Rare;
        } else if (roll < mythicThreshold) {
            targetRarity = CardRegistry.Rarity.Legendary;
        } else {
            targetRarity = CardRegistry.Rarity.Mythic;
        }

        CardRegistry.Rarity actualRarity;
        (tokenId, actualRarity) = _drawForRarity(
            targetRarity,
            pools,
            tokenIds,
            drawnCount,
            seed,
            drawnCount,
            maxCopies
        );
        return (tokenId, actualRarity == CardRegistry.Rarity.Mythic);
    }

    /**
     * @dev Pick a random element from a pre-built in-memory pool.
     *      Pure memory — no external calls.
     *      Duplicates are allowed; pool size does not need to exceeds pack size.
     */
    function _drawForRarity(
        CardRegistry.Rarity targetRarity,
        PoolSet memory pools,
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 seed,
        uint256 nonce,
        uint8 maxCopies
    ) internal pure returns (uint256 tokenId, CardRegistry.Rarity actualRarity) {
        bool found;

        if (targetRarity == CardRegistry.Rarity.Mythic) {
            (found, tokenId) = _drawFromPoolWithCap(pools.mythic, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Mythic);
            (found, tokenId) = _drawFromPoolWithCap(pools.legendary, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Legendary);
            (found, tokenId) = _drawFromPoolWithCap(pools.rare, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Rare);
            (found, tokenId) = _drawFromPoolWithCap(pools.common, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Common);
        } else if (targetRarity == CardRegistry.Rarity.Legendary) {
            (found, tokenId) = _drawFromPoolWithCap(pools.legendary, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Legendary);
            (found, tokenId) = _drawFromPoolWithCap(pools.rare, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Rare);
            (found, tokenId) = _drawFromPoolWithCap(pools.common, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Common);
        } else if (targetRarity == CardRegistry.Rarity.Rare) {
            (found, tokenId) = _drawFromPoolWithCap(pools.rare, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Rare);
            (found, tokenId) = _drawFromPoolWithCap(pools.legendary, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Legendary);
            (found, tokenId) = _drawFromPoolWithCap(pools.common, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Common);
        } else {
            (found, tokenId) = _drawFromPoolWithCap(pools.common, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Common);
            (found, tokenId) = _drawFromPoolWithCap(pools.legendary, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Legendary);
            (found, tokenId) = _drawFromPoolWithCap(pools.rare, tokenIds, drawnCount, seed, nonce, maxCopies);
            if (found) return (tokenId, CardRegistry.Rarity.Rare);
        }

        revert("GachaPack: no available card");
    }

    function _drawFromPoolWithCap(
        uint256[] memory pool,
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 seed,
        uint256 nonce,
        uint8 maxCopies
    ) internal pure returns (bool found, uint256 tokenId) {
        uint256 available;
        for (uint256 i = 0; i < pool.length; i++) {
            if (_isBelowCopyCap(tokenIds, drawnCount, pool[i], maxCopies)) {
                available++;
            }
        }

        if (available == 0) {
            return (false, 0);
        }

        uint256 pickIndex = uint256(
            keccak256(abi.encodePacked(seed, nonce, "draw-cap", pool.length, available))
        ) % available;
        uint256 cursor = 0;

        for (uint256 i = 0; i < pool.length; i++) {
            uint256 candidate = pool[i];
            if (!_isBelowCopyCap(tokenIds, drawnCount, candidate, maxCopies)) {
                continue;
            }
            if (cursor == pickIndex) {
                return (true, candidate);
            }
            cursor++;
        }

        revert("GachaPack: draw failed");
    }

    function _isBelowCopyCap(
        uint256[] memory tokenIds,
        uint256 drawnCount,
        uint256 candidate,
        uint8 maxCopies
    ) internal pure returns (bool) {
        uint8 copies = 0;
        for (uint256 i = 0; i < drawnCount; i++) {
            if (tokenIds[i] != candidate) continue;
            copies++;
            if (copies >= maxCopies) {
                return false;
            }
        }
        return true;
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

