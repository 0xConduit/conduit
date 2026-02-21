/**
 * 0G Chain — simulated INFT minting
 *
 * Generates realistic-looking on-chain responses without hitting any network.
 * When the 0G testnet is stable, swap mintAgentNFT for the real ethers.js call.
 */

import type { NFTService, InferenceService } from "./types.js";

let _tokenCounter = 1;

function fakeAddress(): string {
  return "0x" + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function fakeTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export const zerogNFT: NFTService = {
  async mintAgentNFT(params) {
    // Simulate network round-trip
    await delay(180 + Math.random() * 120);

    const tokenId = _tokenCounter++;
    const txHash  = fakeTxHash();
    const owner   = fakeAddress();

    console.log(
      `[0g] AgentNFT minted (simulated) — ` +
      `agent=${params.agentId} tokenId=${tokenId} owner=${owner} tx=${txHash}`
    );

    return { tokenId: String(tokenId), txHash };
  },
};

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
