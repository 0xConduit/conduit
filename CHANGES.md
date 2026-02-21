# Conduit — Implementation Changes

All changes made during the ETHDenver 2026 build session on `backend_implementation` branch.

---

## Smart Contracts

### `contracts/conduit/src/AgentNFT.sol` *(new)*
Lightweight ERC-721-compatible NFT contract representing an AI agent's on-chain identity.

- One token minted per registered agent
- Only the Conduit registry contract can mint (enforced via `minter` role)
- Stores `ownerOf`, `balanceOf`, `agentAddress` (tokenId → wallet), `tokenOfAgent` (wallet → tokenId)
- Emits `Transfer` and `AgentMinted` events
- `totalSupply()` for supply tracking

### `contracts/conduit/src/Conduit.sol` *(updated)*
Added on top of the existing `Ability` bitmap + `Agent` struct:

- **Import:** `AgentNFT.sol`
- **`AgentNFT public agentNFT`** — deployed in constructor, Conduit is the sole minter
- **`Task` struct** — `id`, `requester`, `assignee`, `payment`, `completed`
- **`tasks` mapping + `taskCounter`**
- **Events:** `AgentRegistered`, `TaskCreated`, `TaskCompleted`
- **`registerAgent(name, chain, price, abilitiesMask)`** — registers caller as agent, mints INFT
- **`createTask(assignee, payment) payable`** — locks ETH in escrow, both parties must be registered
- **`completeTask(taskId, reputationDelta)`** — marks done, increments reputation, transfers ETH to assignee
- All existing `Ability` enum (269 values) and bitmap helpers (`_bit`, `_hasAbility`, etc.) preserved

### `contracts/conduit/test/Conduit.t.sol` *(updated)*
Replaced skeleton with 7 Foundry tests:

1. `test_RegisterAgent` — registers alice, asserts `exists`, `name`, `price`
2. `test_RegisterAgent_Duplicate_Reverts` — second register reverts
3. `test_CreateTask_And_CompleteTask` — full lifecycle, ETH transfer, reputation increment
4. `test_CreateTask_PaymentMismatch_Reverts` — `msg.value != payment` reverts
5. `test_CompleteTask_OnlyRequester_Reverts` — non-requester cannot complete
6. `test_AbilityBitmap` — bitmask round-trip
7. `test_INFTMintedOnRegister` — verifies AgentNFT mints on registration

### `contracts/conduit/script/Conduit.s.sol` *(updated)*
Deploy script now logs both contract addresses after broadcast:
```
Conduit:   0x...
AgentNFT:  0x...
AGENT_NFT_ADDRESS= 0x...
```

### `contracts/conduit/foundry.toml` *(updated)*
Added 0G testnet RPC and explorer config:
```toml
[rpc_endpoints]
zerog = "https://evmrpc-testnet.0g.ai"

[etherscan]
zerog = { key = "verifytoken", url = "https://chainscan-newton.0g.ai/api" }
```

### Deployed to 0G Testnet (Newton, chain ID 16602)
- **Conduit:** `0x403b041783B90d628416A4abe11f280f85049097`
- **AgentNFT:** `0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958`
- Deploy tx: `0xae245680f48414bcbcc95eeb6822b3f2d1f8008233214f443a31ef1c11d0e8a1`
- Explorer: https://chainscan-newton.0g.ai/address/0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958

#### Deploy session transcript

```
$ cd /Users/ryanpark/Personal/ethdenver2026/contracts/conduit

$ forge script script/Conduit.s.sol \
    --rpc-url zerog \
    --broadcast \
    --private-key 0x<redacted> \
    --gas-price 2000000000 \
    --priority-gas-price 2000000000

[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  ===========================================
  Conduit:   0x403b041783B90d628416A4abe11f280f85049097
  AgentNFT:  0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958
  ===========================================
  Add to backend/.env:
  AGENT_NFT_ADDRESS= 0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958

Chain 16602
Estimated gas price: 4.000000014 gwei
Estimated total gas used for script: 1414049
Estimated amount required: 0.005656196019796686 ETH

[Pending] 0xae245680f48414bcbcc95eeb6822b3f2d1f8008233214f443a31ef1c11d0e8a1

# RPC returned null receipt (common on 0G testnet) — verified manually:

$ cast receipt 0xae245680f48414bcbcc95eeb6822b3f2d1f8008233214f443a31ef1c11d0e8a1 --rpc-url https://evmrpc-testnet.0g.ai

blockHash            0xdd0e953c55cbe813299099642bfbf287180eda92e948086500e3cf8b7c5121c3
blockNumber          21137783
contractAddress      0x403b041783B90d628416A4abe11f280f85049097
cumulativeGasUsed    1131239
effectiveGasPrice    4000000007
from                 0x395Fd8d8b0a432fb1E1d60C1Be819d17E10db0a7
gasUsed              1131239
status               1 (success)
transactionHash      0xae245680f48414bcbcc95eeb6822b3f2d1f8008233214f443a31ef1c11d0e8a1
type                 2
```

**Notes on the deploy:**
- The forge error `server returned a null response` was a 0G RPC quirk — the tx was already confirmed on-chain when cast checked it
- `--gas-price` and `--priority-gas-price` flags must be on the **same line** as the forge command (no line breaks between flags)
- `cast receipt` args must also be on one line — zsh treats a newline as end of command

---

## Backend

### `backend/src/shared/types.ts` *(updated)*
- Added `DeployedChain = "base" | "hedera" | "zerog" | "0g"`
- Added `deployedChain: DeployedChain` and `inftTokenId?: string` to `AgentEntity`
- `TaskStatus`, `Task` interface already existed — confirmed correct

### `backend/src/db/schema.ts` *(updated)*
- Added `deployed_chain TEXT NOT NULL DEFAULT 'base'` column to `agents` table
- Added `inft_token_id TEXT` column to `agents` table

### `backend/src/db/seed.ts` *(updated)*
- Seed INSERT now includes `deployed_chain` for each agent
- Seed agents assigned realistic chains: base, hedera, zerog, 0g

### `backend/src/services/agent.service.ts` *(updated)*
- `registerAgent` is now `async`
- Accepts `deployedChain?: DeployedChain` param
- After DB insert, calls `zerogNFT.mintAgentNFT()` for **every chain** (not just 0g)
- Stores returned `tokenId` back into `inft_token_id` column
- `rowToAgent` maps `deployed_chain` and `inft_token_id` fields

### `backend/src/chains/zerog.stub.ts` *(updated — real ethers.js integration)*
- Imports `ethers` from `ethers` package (installed via `bun add ethers`)
- Reads `ZEROG_RPC_URL`, `ZEROG_PRIVATE_KEY`, `AGENT_NFT_ADDRESS` from env
- **If env vars are set:** calls real `AgentNFT.mint()` on 0G testnet via `ethers.JsonRpcProvider`
- **If not configured:** falls back to stub (simulated 200ms delay, fake hex tx hash, sequential token IDs)
- Parses `AgentMinted` event from receipt to get real `tokenId`
- Gracefully falls back on any error so agent registration never fails

### `backend/src/rest/handlers.ts` *(updated)*
Added 4 POST endpoints:

- **`POST /api/agents`** — validates role, checks duplicate id, accepts `deployedChain`, calls `registerAgent`, returns 201
- **`POST /api/tasks`** — validates title + requesterAgentId, balance pre-check for escrow, calls `createTask`, returns 201
- **`POST /api/tasks/:id/dispatch`** — validates `agentId`, calls `dispatchTask`, returns 200
- **`POST /api/tasks/:id/complete`** — validates `attestationScore` range 0–1, calls `completeTask`, returns 200

### `backend/.env.example` *(new)*
Template for environment variables:
```
ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai
ZEROG_PRIVATE_KEY=0x...
AGENT_NFT_ADDRESS=0x...
```

---

## Frontend

### `frontend/next.config.ts` *(updated)*
Added API proxy so `fetch('/api/*')` routes to the backend on port 3001:
```ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://localhost:3001/api/:path*" }]
}
```
**Requires frontend restart to take effect.**

### `frontend/store/useEconomyStore.ts` *(updated)*
Major additions on top of existing pulse/connection logic:

- **New types:** `DeployedChain`, `TaskStatus`, `Task`
- **`AgentEntity`** — added `deployedChain?`, `inftTokenId?`, `createdAt?`, `updatedAt?`
- **New state:** `tasks: Record<string, Task>`, `actionPanelOpen: boolean`, `backendAvailable: boolean`, `lastActivityTimestamp: number`
- **`initializeNetwork`** — now async, fetches from backend (`/api/agents`, `/api/connections`, `/api/vitals`, `/api/activity`, `/api/tasks`), falls back to hardcoded data if backend unavailable
- **`networkTick`** — now async, polls all 5 endpoints every 500ms, updates tasks state, fires visual pulses on new activity events
- **`emitPulse`** — timeout raised from 1500ms → 2600ms to match animation duration
- **`postJson<T>`** — new helper for POST requests
- **New actions:** `setActionPanelOpen`, `registerAgent`, `createTask`, `dispatchTask`, `completeTask`
- All actions merge results into state immediately (optimistic update)

### `frontend/components/edges/TopologyEdge.tsx` *(updated)*
Fixed pulse animation — packets were flying to wrong coordinates:

- **Root cause:** `<animateMotion path={edgePath}>` treats path as relative offsets from element position, not absolute SVG coordinates
- **Fix:** Added hidden `<path id="motion-path-{edgeId}">` with same geometry as the visible edge. `<mpath href="#motion-path-{edgeId}">` makes the animation follow the actual rendered line
- Animation duration: 1.5s → 2.5s
- `calcMode`: `spline` → `linear` (constant speed, no deceleration that looked like stopping short)
- `fill`: `freeze` → `remove` (packet disappears at destination instead of freezing in place)

### `frontend/components/canvas/LivingCanvas.tsx` *(updated)*
Fixed nodes jumping and overlapping on every poll tick:

- **Root cause:** `useMemo` was recomputing positions every 500ms, using `Math.random()` for unknown agents — new random position every render
- **Fix:** Nodes now managed in `useState` (`rfNodes`). `onNodesChange` + `applyNodeChanges` feeds ReactFlow drag events back into state so user drags persist
- `useEffect` syncs agent data into `rfNodes` without touching positions of existing nodes — only new agents get a position assigned
- `positionCache` ref ensures each agent ID gets exactly one position, never reassigned
- 12 predefined `DYNAMIC_SLOTS` around the perimeter for dynamically registered agents

### `frontend/components/hud/ActionPanel.tsx` *(new)*
Control Panel — slide-in panel (bottom-left) with 3 tabs:

**Register tab:**
- Agent ID (optional), Role selector, Capabilities (comma-separated)
- **Chain selector** — 4 options with color coding:
  - Base (blue) — Coinbase L2
  - Hedera (purple) — Hashgraph
  - 0G (emerald) — 0G Chain, mints INFT
  - 0G AI (light emerald) — 0G AI compute + INFT
- Submit calls `registerAgent` action, shows receipt with INFT token ID on success
- Note: INFT minted on 0G Chain for all chains

**Tasks tab (3 numbered steps):**
1. **Create Task** — title, requester dropdown, optional escrow amount
2. **Dispatch Task** — pending task dropdown (auto-advances after dispatch), agent dropdown
3. **Complete + Attest** — dispatched task dropdown (auto-advances after complete), attestation score slider 0–1
- **Demo Loop button** — `setInterval` at 3000ms, uses `useEconomyStore.getState()` to avoid stale closures. Cycles: complete dispatched → dispatch pending → create new task
- Dropdowns auto-sync via `useEffect` watching task list changes — selected task clears when it moves to next status

**Log tab:**
- Last 20 tasks sorted newest first
- Color-coded status badges: yellow=pending, blue=dispatched, green=completed, red=failed
- Shows requester→assignee flow, task ID, escrow amount, chain label

**Panel header:** live/offline badge reflecting `backendAvailable` state

### `frontend/app/page.tsx` *(updated)*
In `viewMode === 'explore'` block:
- Added `import ActionPanel from '../components/hud/ActionPanel'`
- Added `<ActivityStrip />` (was only shown in landing mode)
- Added `<ActionPanel />`

---

## How to Run

### Backend
```bash
cd /Users/ryanpark/Personal/ethdenver2026/backend

# First time only — create .env
cp .env.example .env
# then edit .env and fill in:
#   ZEROG_PRIVATE_KEY=0x<your key>
#   AGENT_NFT_ADDRESS=0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958

# Install dependencies (first time only)
bun install

# Start the backend (port 3001)
bun run src/rest-entry.ts

# If port 3001 is already in use, kill it first:
lsof -ti :3001 | xargs kill -9
```

### Frontend
```bash
cd /Users/ryanpark/Personal/ethdenver2026/frontend

# Install dependencies (first time only)
npm install

# Start dev server (port 3000)
npm run dev

# NOTE: must restart frontend after any next.config.ts changes
# (the API proxy to localhost:3001 only loads on startup)
```

### Verify everything is working
```bash
# Check backend is up
curl http://localhost:3001/api/agents

# Check frontend proxy is forwarding to backend
# Open in browser: http://localhost:3000/api/agents
# Should return same JSON as above

# Open the app
open http://localhost:3000
# Click "Observe Economy" → ⊕ Control Panel (bottom-left)
```

### Deploy contracts to 0G testnet (already done — for reference)
```bash
cd /Users/ryanpark/Personal/ethdenver2026/contracts/conduit

# Install forge-std (first time only)
forge install foundry-rs/forge-std

# Deploy (all on one line — no line breaks between flags)
forge script script/Conduit.s.sol --rpc-url zerog --broadcast --private-key 0x<your key> --gas-price 2000000000 --priority-gas-price 2000000000

# Verify tx confirmed
cast receipt <tx hash> --rpc-url https://evmrpc-testnet.0g.ai
```

---

## Where to See Minted INFTs

When an agent is registered via the Control Panel (or `POST /api/agents`), an INFT is minted on 0G Chain. You can verify it in three places:

**1. 0G Testnet Explorer — AgentNFT contract**
```
https://chainscan-newton.0g.ai/address/0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958
```
Click the **Transactions** tab — each `mint()` call appears as a tx. Click any tx to see the token ID, owner address, and `AgentMinted` event in the logs.

**2. Query on-chain directly**
```bash
# How many INFTs have been minted total
cast call 0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958 "totalSupply()(uint256)" --rpc-url https://evmrpc-testnet.0g.ai

# Who owns token ID 1
cast call 0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958 "ownerOf(uint256)(address)" 1 --rpc-url https://evmrpc-testnet.0g.ai
```

**3. Backend logs** — when a real mint fires:
```
[0g] Minting AgentNFT on 0G testnet for agent: agent-abc123
[0g] mint tx sent: 0x...
[0g] AgentNFT minted: tokenId=1 tx=0x... block=21137800
[conduit] INFT minted for agent-abc123: tokenId=inft-1 txHash=0x...
```
The `txHash` links directly to the transaction on the explorer.

---

## Environment Variables (`backend/.env`)

```
ZEROG_RPC_URL=https://evmrpc-testnet.0g.ai
ZEROG_PRIVATE_KEY=0x<your key>
AGENT_NFT_ADDRESS=0x0e1e003d92bF1c98855d3cBa9635Dc7274b4e958
```
