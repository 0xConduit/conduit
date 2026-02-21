/**
 * 0G Chain — real on-chain INFT minting
 *
 * Calls AgentNFT.mint() on the deployed contract on 0G testnet (Newton, chainId 16602).
 *
 * Required env vars (set in backend/.env):
 *   ZEROG_RPC_URL          = https://evmrpc-testnet.0g.ai
 *   ZEROG_PRIVATE_KEY      = 0x<private key with testnet 0G tokens>
 *   AGENT_NFT_ADDRESS      = 0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958
 *
 * Falls back to stub if any env var is missing so the app still works locally
 * without a wallet configured.
 */

import { ethers } from "ethers";
import type { NFTService, InferenceService } from "./types.js";

const AGENT_NFT_ABI = [
  "function mint(address to) external returns (uint256 tokenId)",
  "function totalSupply() external view returns (uint256)",
  "event AgentMinted(address indexed agentAddress, uint256 indexed tokenId)",
];

const ZEROG_RPC   = process.env.ZEROG_RPC_URL     ?? "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.ZEROG_PRIVATE_KEY ?? "";
const NFT_ADDRESS = process.env.AGENT_NFT_ADDRESS ?? "";

const isConfigured = PRIVATE_KEY.length > 0 && NFT_ADDRESS.length > 0;

if (isConfigured) {
  console.log("[0g] Real on-chain minting enabled");
  console.log("[0g] AgentNFT contract:", NFT_ADDRESS);
} else {
  console.warn("[0g] ZEROG_PRIVATE_KEY or AGENT_NFT_ADDRESS not set — using stub mode");
}

// ── Stub helpers (used when not configured) ───────────────────────────────────
let _stubCounter = 1;
const fakeTxHash = () => "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── NFT Service ───────────────────────────────────────────────────────────────
export const zerogNFT: NFTService = {
  async mintAgentNFT(params) {
    if (!isConfigured) {
      await delay(180 + Math.random() * 120);
      const tokenId = String(_stubCounter++);
      const txHash  = fakeTxHash();
      console.log(`[0g-stub] AgentNFT minted — agent=${params.agentId} tokenId=${tokenId} tx=${txHash}`);
      return { tokenId, txHash };
    }

    try {
      console.log(`[0g] Minting AgentNFT on 0G testnet for agent: ${params.agentId}`);

      const provider = new ethers.JsonRpcProvider(ZEROG_RPC);
      const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(NFT_ADDRESS, AGENT_NFT_ABI, wallet);

      const tx = await contract.mint(wallet.address);
      console.log(`[0g] mint tx sent: ${tx.hash}`);

      const receipt = await tx.wait();

      // Parse AgentMinted event to get the real tokenId
      const mintedEvent = receipt?.logs
        .map((log: ethers.Log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "AgentMinted");

      const tokenId = mintedEvent
        ? mintedEvent.args.tokenId.toString()
        : receipt?.blockNumber?.toString() ?? "unknown";

      console.log(`[0g] AgentNFT minted: tokenId=${tokenId} tx=${receipt?.hash} block=${receipt?.blockNumber}`);

      return {
        tokenId: `inft-${tokenId}`,
        txHash: receipt?.hash ?? tx.hash,
      };
    } catch (err) {
      console.error(`[0g] mintAgentNFT failed, falling back to stub:`, err);
      const tokenId = String(_stubCounter++);
      return { tokenId: `inft-err-${tokenId}`, txHash: "0x0" };
    }
  },
};

// ── Inference Service ─────────────────────────────────────────────────────────
export const zerogInference: InferenceService = {
  async rankAgents(params) {
    await delay(80);
    const rankings = params.agentIds.map((agentId, i) => ({
      agentId,
      score: Math.round((1 - i * 0.1) * 100) / 100,
    }));
    return { rankings };
  },
};
