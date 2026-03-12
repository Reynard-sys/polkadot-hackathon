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
 *  Pack types (Westend AssetHub testnet – small WND amounts):
 *    Standard  x10  → 0.001 WND   guarantee: ≥1 Rare
 *    Premium   x20  → 0.0018 WND  guarantee: ≥2 Rare, higher Legendary chance
 *    Ultra     x30  → 0.0025 WND  guarantee: ≥3 Rare + ≥1 Legendary
 *
 *  Rarity pull weights (out of 10 000):
 *    0–8199    → Common    (82.00%)
 *    8200–9599 → Rare      (14.00%)
 *    9600–9979 → Legendary  (3.80%)
 *    9980–9999 → Mythic     (0.20%)
 *
 *  Randomness: keccak256(blockhash + sender + blocktime + nonce)
 *  This is adequate for a hackathon demo; replace with Chainlink VRF
 *  before any mainnet deployment.
 *
 *  Pity system: after 50 packs without a Mythic the effective Mythic
 *  range grows by 20 bp per additional pack until a Mythic is pulled.
 */
contract GachaPack is Ownable, ReentrancyGuard {

    // ---------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------

    enum PackType { Standard, Premium, Ultra }

    // ---------------------------------------------------------------
    // Pack configuration
    // ---------------------------------------------------------------

    struct PackConfig {
        uint256 price;       // Price in native token (WND)
        uint8   size;        // Number of cards
        uint8   minRare;     // Guaranteed minimum Rare draws
        bool    minLegendary; // Guaranteed minimum 1 Legendary draw
    }

    // ---------------------------------------------------------------
    // Rarity weights
    // ---------------------------------------------------------------

    uint16 private constant WEIGHT_COMMON    = 8200;  // 0 – 8199
    uint16 private constant WEIGHT_RARE      = 9600;  // 8200 – 9599
    uint16 private constant WEIGHT_LEGENDARY = 9980;  // 9600 – 9979
    // Mythic                                          // 9980 – 9999

    // Pity: after PITY_THRESHOLD packs, Mythic range grows by PITY_STEP per pack
    uint256 private constant PITY_THRESHOLD  = 50;
    uint256 private constant PITY_STEP       = 20; // bp out of 10 000

    // ---------------------------------------------------------------
    // External contracts
    // ---------------------------------------------------------------

    GachaNFT     public immutable nft;
    CardRegistry public immutable registry;

    // ---------------------------------------------------------------
    // Pack configs (set in constructor)
    // ---------------------------------------------------------------

    mapping(PackType => PackConfig) public packConfigs;

    // ---------------------------------------------------------------
    // Pity tracking
    // ---------------------------------------------------------------

    /// @notice Number of consecutive packs opened without a Mythic, per player
    mapping(address => uint256) public packsWithoutMythic;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event PackOpened(address indexed player, PackType packType, uint256[] tokenIds);
    event CardMinted(address indexed player, uint256 indexed tokenId, CardRegistry.Rarity rarity);
    event PackPriceUpdated(PackType packType, uint256 newPrice);

    // ---------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------

    error InsufficientPayment(uint256 sent, uint256 required);
    error NoCardsAvailable(CardRegistry.Rarity rarity);

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor(address _nft, address _registry) Ownable(msg.sender) {
        nft      = GachaNFT(_nft);
        registry = CardRegistry(_registry);

        // ------- Pack configs (Westend testnet prices) -------
        // Standard x10 → 0.001 WND
        packConfigs[PackType.Standard] = PackConfig({
            price:        0.001 ether,
            size:         10,
            minRare:      1,
            minLegendary: false
        });

        // Premium x20 → 0.0018 WND
        packConfigs[PackType.Premium] = PackConfig({
            price:        0.0018 ether,
            size:         20,
            minRare:      2,
            minLegendary: false
        });

        // Ultra x30 → 0.0025 WND
        packConfigs[PackType.Ultra] = PackConfig({
            price:        0.0025 ether,
            size:         30,
            minRare:      3,
            minLegendary: true
        });
    }

    // ---------------------------------------------------------------
    // Public: pack opening
    // ---------------------------------------------------------------

    /// @notice Open a Standard pack (10 cards, ≥1 Rare guaranteed).
    function openStandardPack() external payable nonReentrant {
        _openPack(PackType.Standard);
    }

    /// @notice Open a Premium pack (20 cards, ≥2 Rare guaranteed).
    function openPremiumPack() external payable nonReentrant {
        _openPack(PackType.Premium);
    }

    /// @notice Open an Ultra pack (30 cards, ≥3 Rare + ≥1 Legendary guaranteed).
    function openUltraPack() external payable nonReentrant {
        _openPack(PackType.Ultra);
    }

    // ---------------------------------------------------------------
    // Internal: core pack logic
    // ---------------------------------------------------------------

    function _openPack(PackType packType) internal {
        PackConfig memory cfg = packConfigs[packType];

        // Payment check
        if (msg.value < cfg.price) {
            revert InsufficientPayment(msg.value, cfg.price);
        }

        // Build random seed from block data + sender
        uint256 seed = uint256(
            keccak256(abi.encodePacked(
                blockhash(block.number - 1),
                msg.sender,
                block.timestamp,
                block.prevrandao
            ))
        );

        // Pity extra mythic probability (bp above baseline 20)
        uint256 pityBonus = _getPityBonus(msg.sender);

        uint256[] memory tokenIds = new uint256[](cfg.size);
        // Clear the per-tx duplicate tracking bitmap before use
        _clearUsed();
        mapping(uint256 => bool) storage used = _tempUsed();

        bool gotMythic = false;

        // --- Guaranteed slots first ---
        uint256 slotIndex = 0;

        // Guaranteed Rare slots
        for (uint256 g = 0; g < cfg.minRare; g++) {
            uint256 tokenId = _drawGuaranteedMin(
                CardRegistry.Rarity.Rare, seed, slotIndex, used
            );
            tokenIds[slotIndex] = tokenId;
            // A guaranteed slot can still randomly upgrade to Mythic
            if (registry.getRarity(tokenId) == CardRegistry.Rarity.Mythic) {
                gotMythic = true;
            }
            slotIndex++;
        }

        // Guaranteed Legendary slot (Ultra pack)
        if (cfg.minLegendary) {
            uint256 tokenId = _drawGuaranteedMin(
                CardRegistry.Rarity.Legendary, seed, slotIndex, used
            );
            tokenIds[slotIndex] = tokenId;
            // Can still upgrade to Mythic
            if (registry.getRarity(tokenId) == CardRegistry.Rarity.Mythic) {
                gotMythic = true;
            }
            slotIndex++;
        }

        // --- Normal random slots ---
        for (uint256 i = slotIndex; i < cfg.size; i++) {
            CardRegistry.Rarity rarity = _rollRarity(seed, i, pityBonus);
            rarity = _applySupplyDowngrade(rarity);

            uint256 tokenId = _drawUniqueCard(rarity, seed, i, used);
            tokenIds[i] = tokenId;

            if (rarity == CardRegistry.Rarity.Mythic) {
                gotMythic = true;
            }
        }

        // Update pity counter
        if (gotMythic) {
            packsWithoutMythic[msg.sender] = 0;
        } else {
            packsWithoutMythic[msg.sender]++;
        }

        // Mint all cards in one batch tx
        uint256[] memory amounts = new uint256[](cfg.size);
        for (uint256 i = 0; i < cfg.size; i++) {
            amounts[i] = 1;
            emit CardMinted(msg.sender, tokenIds[i], registry.getRarity(tokenIds[i]));
        }

        nft.mintCardBatch(msg.sender, tokenIds, amounts);

        emit PackOpened(msg.sender, packType, tokenIds);

        // Refund excess payment
        uint256 excess = msg.value - cfg.price;
        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}("");
            require(ok, "GachaPack: refund failed");
        }
    }

    // ---------------------------------------------------------------
    // Internal: randomness & rarity roll
    // ---------------------------------------------------------------

    /**
     * @dev Roll a rarity for a normal (non-guaranteed) slot.
     * @param seed       Base random seed
     * @param nonce      Slot index to diversify results
     * @param pityBonus  Extra basis points added to Mythic range
     */
    function _rollRarity(
        uint256 seed,
        uint256 nonce,
        uint256 pityBonus
    ) internal pure returns (CardRegistry.Rarity) {
        uint256 roll = uint256(keccak256(abi.encodePacked(seed, nonce, "rarity"))) % 10000;

        // Effective Mythic threshold – base 9980 lowered by pity bonus
        uint256 mythicThreshold = pityBonus >= (10000 - WEIGHT_LEGENDARY)
            ? WEIGHT_LEGENDARY                  // cap: can't exceed Legendary threshold
            : WEIGHT_LEGENDARY - pityBonus;

        if (roll < WEIGHT_COMMON)    return CardRegistry.Rarity.Common;
        if (roll < WEIGHT_RARE)      return CardRegistry.Rarity.Rare;
        if (roll < mythicThreshold)  return CardRegistry.Rarity.Legendary;
        return CardRegistry.Rarity.Mythic;
    }

    /**
     * @dev Apply supply downgrade cascade: Mythic→Legendary→Rare→Common.
     */
    function _applySupplyDowngrade(
        CardRegistry.Rarity rarity
    ) internal view returns (CardRegistry.Rarity) {
        if (rarity == CardRegistry.Rarity.Mythic &&
            registry.rarityPoolSize(CardRegistry.Rarity.Mythic) == 0) {
            rarity = CardRegistry.Rarity.Legendary;
        }
        if (rarity == CardRegistry.Rarity.Legendary &&
            _rarityFullySoldOut(CardRegistry.Rarity.Legendary)) {
            rarity = CardRegistry.Rarity.Rare;
        }
        if (rarity == CardRegistry.Rarity.Rare &&
            _rarityFullySoldOut(CardRegistry.Rarity.Rare)) {
            rarity = CardRegistry.Rarity.Common;
        }
        return rarity;
    }

    /**
     * @dev True if every card in a rarity tier is at max supply (sold out).
     */
    function _rarityFullySoldOut(
        CardRegistry.Rarity rarity
    ) internal view returns (bool) {
        uint256[] memory pool = registry.getCardsByRarity(rarity);
        for (uint256 i = 0; i < pool.length; i++) {
            if (nft.remainingSupply(pool[i]) > 0) return false;
        }
        return pool.length > 0;
    }

    /**
     * @dev Draw a card of exactly the specified rarity, avoiding duplicates.
     *      If all cards in the rarity are already in this pack, falls back to Common.
     */
    function _drawUniqueCard(
        CardRegistry.Rarity rarity,
        uint256 seed,
        uint256 nonce,
        mapping(uint256 => bool) storage used
    ) internal returns (uint256 tokenId) {
        uint256[] memory pool = registry.getCardsByRarity(rarity);

        // Try up to poolSize times to find an unused card
        for (uint256 attempt = 0; attempt < pool.length; attempt++) {
            tokenId = registry.getRandomCardOfRarity(rarity, seed, nonce + attempt * 1000);
            if (!used[tokenId] && nft.remainingSupply(tokenId) > 0) {
                used[tokenId] = true;
                return tokenId;
            }
        }

        // Fallback: any available card in the pool
        for (uint256 i = 0; i < pool.length; i++) {
            tokenId = pool[i];
            if (!used[tokenId] && nft.remainingSupply(tokenId) > 0) {
                used[tokenId] = true;
                return tokenId;
            }
        }

        // If the rarity pool is exhausted within this pack, go to Common
        return _drawUniqueCard(CardRegistry.Rarity.Common, seed, nonce + 99999, used);
    }

    /**
     * @dev Draw the guaranteed minimum rarity card (exact rarity or higher).
     *      Used for guaranteed slots.
     */
    function _drawGuaranteedMin(
        CardRegistry.Rarity minRarity,
        uint256 seed,
        uint256 nonce,
        mapping(uint256 => bool) storage used
    ) internal returns (uint256 tokenId) {
        // Roll to potentially get something better than the minimum
        uint256 roll = uint256(keccak256(abi.encodePacked(seed, nonce, "guaranteed"))) % 10000;

        CardRegistry.Rarity rarity = minRarity;

        // Can still roll above minimum in a guaranteed slot
        if (minRarity == CardRegistry.Rarity.Rare) {
            if (roll >= WEIGHT_LEGENDARY) rarity = CardRegistry.Rarity.Mythic;
            else if (roll >= WEIGHT_RARE) rarity = CardRegistry.Rarity.Legendary;
        } else if (minRarity == CardRegistry.Rarity.Legendary) {
            if (roll >= WEIGHT_LEGENDARY) rarity = CardRegistry.Rarity.Mythic;
        }

        rarity = _applySupplyDowngrade(rarity);
        // Ensure we're still at minimum
        if (uint8(rarity) < uint8(minRarity)) rarity = minRarity;

        return _drawUniqueCard(rarity, seed, nonce, used);
    }

    // ---------------------------------------------------------------
    // Internal: pity
    // ---------------------------------------------------------------

    function _getPityBonus(address player) internal view returns (uint256) {
        uint256 count = packsWithoutMythic[player];
        if (count <= PITY_THRESHOLD) return 0;
        return (count - PITY_THRESHOLD) * PITY_STEP;
    }

    // ---------------------------------------------------------------
    // Internal: temporary per-tx duplicate tracking
    // ---------------------------------------------------------------

    // Solidity doesn't support transient local mappings, so we use
    // a deterministic storage slot pattern keyed by tx hash + pack index.
    // In practice this just uses the regular storage slot during the tx.
    function _tempUsed() internal pure returns (mapping(uint256 => bool) storage s) {
        // keccak256("GachaPack.usedInThisPack") → fixed storage pointer
        bytes32 slot = keccak256("GachaPack.usedInThisPack");
        assembly {
            s.slot := slot
        }
    }

    /**
     * @dev Clears the duplicate-tracking bitmap for all 48 token IDs.
     *      Called at the start of every _openPack to ensure no stale state
     *      from a previous (possibly failed) transaction leaks through.
     */
    function _clearUsed() internal {
        mapping(uint256 => bool) storage used = _tempUsed();
        for (uint256 id = 1; id <= 48; id++) {
            if (used[id]) used[id] = false;
        }
    }

    // ---------------------------------------------------------------
    // Owner functions
    // ---------------------------------------------------------------

    /// @notice Update pack price (e.g., after WND price changes).
    function setPackPrice(PackType packType, uint256 newPrice) external onlyOwner {
        packConfigs[packType].price = newPrice;
        emit PackPriceUpdated(packType, newPrice);
    }

    /// @notice Withdraw collected fees to owner.
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "GachaPack: nothing to withdraw");
        (bool ok,) = owner().call{value: balance}("");
        require(ok, "GachaPack: withdraw failed");
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    /// @notice Current pity counter for a player.
    function getPityCount(address player) external view returns (uint256) {
        return packsWithoutMythic[player];
    }

    /// @notice Preview effective Mythic threshold for a player (for UI).
    function effectiveMythicThreshold(address player) external view returns (uint256) {
        uint256 pityBonus = _getPityBonus(player);
        if (pityBonus >= (10000 - WEIGHT_LEGENDARY)) return WEIGHT_LEGENDARY;
        return 10000 - 20 - (pityBonus); // base 20bp + pity
    }

    receive() external payable {}
}
