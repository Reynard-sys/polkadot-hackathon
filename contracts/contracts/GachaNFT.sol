// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GachaNFT
 * @notice ERC-1155 contract for Anime Gacha TCG cards.
 *         Token IDs 1–48 map to the 48 unique cards in cards.json.
 *
 *  Supply caps (enforced per token ID):
 *    Common    (IDs 1–10, 17–26, 33–42) → 10,000 each
 *    Rare      (IDs 11–13, 27–29, 43–45) → 3,000 each
 *    Legendary (IDs 14–15, 30–31, 46–47) → 500 each
 *    Mythic    (IDs 16, 32, 48)           → 30 each
 *
 *  Only authorised minters (GachaPack contract) can mint.
 *  Owner can add/remove minters.
 */
contract GachaNFT is ERC1155, Ownable {
    using Strings for uint256;

    // ---------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------

    uint256 public constant TOTAL_CARDS = 48;

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------

    /// @notice Supply cap for each token ID
    mapping(uint256 => uint256) public maxSupply;

    /// @notice Amount minted so far for each token ID
    mapping(uint256 => uint256) public totalMinted;

    /// @notice Authorised minter addresses (GachaPack contract)
    mapping(address => bool) public minters;

    // ---------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------

    event CardMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event MinterUpdated(address indexed minter, bool authorised);

    // ---------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------

    error NotMinter();
    error SupplyCapExceeded(uint256 tokenId, uint256 requested, uint256 remaining);
    error InvalidTokenId(uint256 tokenId);
    error ZeroAmount();

    // ---------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------

    /**
     * @param _baseUri  Base URI for metadata, e.g. "https://ipfs.io/ipfs/CID/"
     *                  Token URI will be baseUri + tokenId + ".json"
     * @param _supplyCaps Array of 48 supply caps indexed 0–47 (maps to token IDs 1–48)
     */
    constructor(
        string memory _baseUri,
        uint256[48] memory _supplyCaps
    ) ERC1155(_baseUri) Ownable(msg.sender) {
        for (uint256 i = 0; i < 48; i++) {
            maxSupply[i + 1] = _supplyCaps[i];
        }
    }

    // ---------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotMinter();
        _;
    }

    // ---------------------------------------------------------------
    // Owner: access control
    // ---------------------------------------------------------------

    function setMinter(address _minter, bool _authorised) external onlyOwner {
        minters[_minter] = _authorised;
        emit MinterUpdated(_minter, _authorised);
    }

    // ---------------------------------------------------------------
    // Mint functions (called by GachaPack)
    // ---------------------------------------------------------------

    /**
     * @notice Mint a single card to an address.
     * @param to      Recipient
     * @param tokenId Card token ID (1–48)
     * @param amount  Amount to mint (almost always 1 for this game)
     */
    function mintCard(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyMinter {
        _validateMint(tokenId, amount);
        totalMinted[tokenId] += amount;
        _mint(to, tokenId, amount, "");
        emit CardMinted(to, tokenId, amount);
    }

    /**
     * @notice Mint multiple different cards to an address in one tx (gas-efficient pack opening).
     * @param to       Recipient
     * @param tokenIds Array of card token IDs
     * @param amounts  Corresponding amounts (all 1 for a pack)
     */
    function mintCardBatch(
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external onlyMinter {
        require(tokenIds.length == amounts.length, "GachaNFT: length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _validateMint(tokenIds[i], amounts[i]);
            totalMinted[tokenIds[i]] += amounts[i];
        }
        _mintBatch(to, tokenIds, amounts, "");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            emit CardMinted(to, tokenIds[i], amounts[i]);
        }
    }

    // ---------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------

    /**
     * @notice Remaining mintable supply for a token ID.
     */
    function remainingSupply(uint256 tokenId) public view returns (uint256) {
        if (tokenId == 0 || tokenId > TOTAL_CARDS) return 0;
        return maxSupply[tokenId] - totalMinted[tokenId];
    }

    /**
     * @notice Returns true if a token ID is sold out.
     */
    function isSoldOut(uint256 tokenId) external view returns (bool) {
        return remainingSupply(tokenId) == 0;
    }

    /**
     * @notice ERC-1155 token URI. Returns baseURI + tokenId + ".json"
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(super.uri(tokenId), tokenId.toString(), ".json"));
    }

    /**
     * @notice Update base URI (owner only, for IPFS CID changes).
     */
    function setBaseUri(string calldata _newUri) external onlyOwner {
        _setURI(_newUri);
    }

    // ---------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------

    function _validateMint(uint256 tokenId, uint256 amount) internal view {
        if (tokenId == 0 || tokenId > TOTAL_CARDS) revert InvalidTokenId(tokenId);
        if (amount == 0) revert ZeroAmount();
        uint256 rem = remainingSupply(tokenId);
        if (rem < amount) revert SupplyCapExceeded(tokenId, amount, rem);
    }
}
