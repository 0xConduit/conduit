import { getDb } from "../db/connection.js";
import type { Vitals } from "../shared/types.js";

export function computeVitals(): Vitals {
  const db = getDb();

  // TVL = sum of all agent balances + locked escrow amounts
  const balanceResult = db
    .prepare("SELECT COALESCE(SUM(settlement_balance), 0) as total FROM agents")
    .get() as { total: number };

  const escrowResult = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM escrows WHERE status = 'locked'")
    .get() as { total: number };

  const totalValueLocked = balanceResult.total + escrowResult.total;

  // System attestation = average of all agent attestation scores
  const attestationResult = db
    .prepare("SELECT COALESCE(AVG(attestation_score), 0) as avg FROM agents")
    .get() as { avg: number };

  const systemAttestation = Math.round(attestationResult.avg * 100) / 100;

  // Active processes = count of dispatched tasks
  const processResult = db
    .prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'dispatched'")
    .get() as { cnt: number };

  return {
    totalValueLocked,
    systemAttestation,
    activeProcesses: processResult.cnt,
  };
}
