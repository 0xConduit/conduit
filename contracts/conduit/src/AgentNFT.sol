// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.13;

/// @title AgentNFT
/// @notice Lightweight ERC-721-compatible NFT that represents an AI agent identity on-chain.
///         One token is minted per registered Conduit agent. Only the Conduit registry
///         contract may mint (enforced via the `minter` role set at deploy time).
contract AgentNFT {
    // ── Metadata ────────────────────────────────────────────────────────────
    string public name = "Conduit Agent";
    string public symbol = "CAGT";

    // ── Storage ─────────────────────────────────────────────────────────────
    address public minter;
    uint256 private _nextTokenId;

    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    /// @notice Maps token ID → the agent's registered wallet/address.
    mapping(uint256 => address) public agentAddress;

    /// @notice Maps agent address → token ID (reverse lookup).
    mapping(address => uint256) public tokenOfAgent;

    // ── Events ───────────────────────────────────────────────────────────────
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event AgentMinted(address indexed agentAddress, uint256 indexed tokenId);

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _minter) {
        minter = _minter;
    }

    // ── Mint ─────────────────────────────────────────────────────────────────
    /// @notice Mint a new agent identity NFT. Only callable by the Conduit registry.
    /// @param to        Owner of the new token (the registering agent address).
    /// @return tokenId  The newly minted token ID.
    function mint(address to) external returns (uint256 tokenId) {
        require(msg.sender == minter, "AgentNFT: only minter");
        require(tokenOfAgent[to] == 0 && ownerOf[0] != to, "AgentNFT: already minted");

        tokenId = _nextTokenId++;
        ownerOf[tokenId] = to;
        balanceOf[to]++;
        agentAddress[tokenId] = to;
        tokenOfAgent[to] = tokenId;

        emit Transfer(address(0), to, tokenId);
        emit AgentMinted(to, tokenId);
    }

    /// @notice Total supply of minted agent NFTs.
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
