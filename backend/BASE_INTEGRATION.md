# Base Mainnet Integration — Self-Sustaining Autonomous Agents

This document describes the Base mainnet integration that enables autonomous, self-sustaining agent operations with ERC-8021 builder code attribution.

## Overview

The backend has been updated to:
1. **Transact on Base mainnet** — All revenue settlements occur on Base mainnet
2. **Integrate ERC-8021 builder codes** — Every transaction includes attribution for analytics and rewards
3. **Self-sustaining operation** — Automatic gas management and wallet funding
4. **Autonomous operation** — Retry logic and error handling with minimal human intervention

## Key Features

### 1. Base Mainnet Transactions

All revenue settlements are executed on Base mainnet using ethers.js. The system:
- Connects to Base mainnet via RPC endpoint
- Uses agent wallets for transaction signing
- Records all transactions in the database for tracking

### 2. ERC-8021 Builder Code Integration

Every transaction includes ERC-8021 attribution:
- Builder codes are appended as data suffixes to transaction calldata
- Enables analytics tracking on base.dev
- Eligible for builder rewards and attribution-based programs
- Minimal gas cost (~16 gas per non-zero byte)

**To get your builder code:**
1. Register at https://base.dev
2. Navigate to Settings → Builder Code
3. Copy your unique builder code
4. Set it in `BASE_BUILDER_CODE` environment variable

### 3. Self-Sustaining Gas Management

The gas monitor service automatically:
- Checks agent wallet balances every 5 minutes (configurable)
- Detects when balances fall below threshold (default: 0.001 ETH)
- Automatically funds agents from the server wallet
- Includes ERC-8021 attribution in funding transactions
- Logs all funding events for audit

### 4. Autonomous Operation

The system includes:
- **Retry logic** — Transactions automatically retry up to 3 times on failure
- **Error handling** — Graceful degradation if Base is unavailable
- **Balance monitoring** — Proactive funding before transactions fail
- **Transaction logging** — All on-chain activity is recorded

## Configuration

### Required Environment Variables

```bash
# Base mainnet RPC endpoint
BASE_RPC_URL=https://mainnet.base.org

# Server wallet for auto-funding (must hold ETH on Base)
BASE_PRIVATE_KEY=0x...

# ERC-8021 builder code from base.dev
BASE_BUILDER_CODE=YOUR-CODE-HERE

# Wallet encryption key (for agent private keys)
WALLET_ENCRYPTION_KEY=...
```

### Optional Configuration

```bash
# Minimum balance before auto-funding (default: 0.001 ETH)
MIN_BALANCE_ETH=0.001

# Amount to fund when balance is low (default: 0.01 ETH)
FUNDING_AMOUNT_ETH=0.01

# Gas monitor check interval in ms (default: 300000 = 5 minutes)
GAS_MONITOR_INTERVAL_MS=300000
```

## Architecture

### Revenue Settlement Flow

1. **Task Completion** → `completeTask()` is called
2. **Escrow Release** → `releaseEscrow()` is called
3. **Base Settlement** → `baseRevenue.settleRevenue()` executes on Base mainnet
4. **ERC-8021 Attribution** → Builder code is appended to transaction
5. **Transaction Confirmation** → Receipt is stored in database

### Gas Monitoring Flow

1. **Periodic Check** → Gas monitor runs every 5 minutes
2. **Balance Check** → Each Base agent's balance is checked
3. **Low Balance Detection** → If below threshold, funding is triggered
4. **Auto-Funding** → Server wallet sends ETH to agent wallet
5. **Logging** → Funding transaction is recorded

## Files Modified

### Core Integration
- `backend/src/chains/base.stub.ts` → Replaced with real Base mainnet integration
- `backend/src/services/payment.service.ts` → Integrated Base revenue settlement
- `backend/src/services/task.service.ts` → Updated to await async revenue settlement

### Self-Sustaining Features
- `backend/src/services/gas-monitor.service.ts` → New service for gas monitoring
- `backend/src/rest-entry.ts` → Starts gas monitor on server startup
- `backend/src/mcp-entry.ts` → Starts gas monitor on MCP server startup

### Configuration
- `backend/.env.example` → Updated with Base mainnet configuration

## Usage

### Starting the Server

The gas monitor automatically starts when the server starts:

```bash
bun run src/rest-entry.ts
```

### Manual Gas Check

You can manually trigger a gas check:

```typescript
import { triggerGasCheck } from "./services/gas-monitor.service.js";
await triggerGasCheck();
```

### Monitoring Logs

Watch for these log messages:
- `[base-mainnet] Revenue settled: ...` — Revenue settlement successful
- `[gas-monitor] Low balance detected for ...` — Agent needs funding
- `[gas-monitor] Agent ... funded successfully` — Auto-funding completed

## Testing

### Test Revenue Settlement

1. Create a task with escrow
2. Dispatch the task to an agent
3. Complete the task
4. Check logs for Base transaction hash
5. Verify transaction on Basescan with builder code attribution

### Test Gas Monitoring

1. Set `MIN_BALANCE_ETH` to a high value (e.g., 0.1)
2. Ensure agent balance is below threshold
3. Wait for monitoring cycle (or trigger manually)
4. Verify agent receives funding transaction

## Security Considerations

1. **Private Keys** — Agent private keys are encrypted at rest
2. **Server Wallet** — Keep `BASE_PRIVATE_KEY` secure and well-funded
3. **RPC Endpoint** — Use a reliable RPC provider (consider rate limits)
4. **Builder Code** — Keep builder code private (it's your attribution)

## Troubleshooting

### Transactions Failing

- Check agent wallet has sufficient balance
- Verify `BASE_RPC_URL` is correct and accessible
- Ensure `BASE_PRIVATE_KEY` has ETH for gas
- Check network connectivity

### Builder Code Not Working

- Verify `BASE_BUILDER_CODE` is set correctly
- Check transaction on Basescan — look for data suffix
- Ensure builder code is registered on base.dev

### Gas Monitor Not Running

- Check `BASE_RPC_URL` is set (not testnet/localhost)
- Verify server logs for startup messages
- Check `GAS_MONITOR_INTERVAL_MS` is reasonable

## Next Steps

1. **Register on base.dev** — Get your builder code
2. **Fund server wallet** — Add ETH to `BASE_PRIVATE_KEY` wallet
3. **Configure RPC** — Set up reliable Base mainnet RPC endpoint
4. **Monitor transactions** — Watch Basescan for your builder code attribution
5. **Track analytics** — View transaction metrics on base.dev dashboard

## References

- [Base Builder Codes Documentation](https://docs.base.org/base-chain/builder-codes/builder-codes)
- [ERC-8021 Specification](https://www.erc8021.com/docs)
- [Base.dev Registration](https://base.dev)
- [Basescan Explorer](https://basescan.org)
