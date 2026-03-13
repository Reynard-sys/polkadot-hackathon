// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CardRegistry
 * @notice On-chain registry of all 48 Anime Gacha TCG cards.
 *         Stores each card's rarity and anime so GachaPack can build
 *         randomised rarity pools without off-chain input at open time.
 */
contract CardRegistry is Ownable {

    // ---------------------------------------------------------------
    // Enums
    // ---------------------------------------------------------------

    enum Rarity { Common, Rare, Legendary, Mythic }
    enum Anime  { Naruto, OnePiece, Pokemon }

    // ---------------------------------------------------------------
    // Structs
    // ---------------------------------------------------------------

    struct CardInfo {
        Rarity   rarity;
        Anime    anime;
        uint256  maxSupply;
        bool     registered;
    }

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------

    /// @notice Maps ERC-1155 token ID → card metadata
    mapping(uint256 => CardInfo) public cards;

    /// @notice Per-rarity list of token IDs (used for random draws)
    mapping(uint256 => uint256[]) private _cardsByRarity; // Rarity enum → token IDs

    /// @notice Total cards registered
    uint256 public totalCards;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    /// @notice Emitted once per registerCards call with the count of newly registered cards.
    event CardsBatchRegistered(uint256 count);

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    constructor() Ownable(msg.sender) {}

    // ---------------------------------------------------------------
    // Owner: registration
    // ---------------------------------------------------------------

    /**
     * @notice Register a batch of cards. Call once during deployment.
     * @param tokenIds   ERC-1155 token IDs (1–48)
     * @param rarities   Corresponding rarities
     * @param animes     Corresponding anime
     * @param maxSupplies Corresponding max supply caps
     */
    function registerCards(
        uint256[] calldata tokenIds,
        Rarity[]  calldata rarities,
        Anime[]   calldata animes,
        uint256[] calldata maxSupplies
    ) external onlyOwner {
        require(
            tokenIds.length == rarities.length &&
            rarities.length == animes.length   &&
            animes.length   == maxSupplies.length,
            "CardRegistry: array length mismatch"
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(!cards[id].registered, "CardRegistry: already registered");

            cards[id] = CardInfo({
                rarity:     rarities[i],
                anime:      animes[i],
                maxSupply:  maxSupplies[i],
                registered: true
            });

            _cardsByRarity[uint256(rarities[i])].push(id);
            totalCards++;
        }

        // Single event per batch — O(1) gas cost instead of O(n)
        emit CardsBatchRegistered(tokenIds.length);
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    /**
     * @notice Returns all token IDs belonging to a rarity tier.
     */
    function getCardsByRarity(Rarity rarity) external view returns (uint256[] memory) {
        return _cardsByRarity[uint256(rarity)];
    }

    /**
     * @notice Returns count of cards in a rarity tier.
     */
    function rarityPoolSize(Rarity rarity) external view returns (uint256) {
        return _cardsByRarity[uint256(rarity)].length;
    }

    /**
     * @notice Pick a pseudo-random card from a rarity pool.
     * @param rarity  Target rarity
     * @param seed    Random seed (from GachaPack randomness)
     * @param nonce   Slot nonce to generate different results per slot
     * @return tokenId The selected card token ID
     */
    function getRandomCardOfRarity(
        Rarity  rarity,
        uint256 seed,
        uint256 nonce
    ) external view returns (uint256 tokenId) {
        uint256[] storage pool = _cardsByRarity[uint256(rarity)];
        require(pool.length > 0, "CardRegistry: empty rarity pool");

        uint256 index = uint256(keccak256(abi.encodePacked(seed, nonce))) % pool.length;
        tokenId = pool[index];
    }

    /**
     * @notice Check if a card token ID is registered.
     */
    function isRegistered(uint256 tokenId) external view returns (bool) {
        return cards[tokenId].registered;
    }

    /**
     * @notice Get rarity of a token ID.
     */
    function getRarity(uint256 tokenId) external view returns (Rarity) {
        require(cards[tokenId].registered, "CardRegistry: not registered");
        return cards[tokenId].rarity;
    }
}
