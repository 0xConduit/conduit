// Chain service interfaces — each chain stub implements the relevant interface

export interface EscrowService {
  lockFunds(params: { taskId: string; payerAgentId: string; amount: number }): Promise<{ txHash: string }>;
  releaseFunds(params: { escrowId: string; payeeAgentId: string; amount: number }): Promise<{ txHash: string }>;
  refundFunds(params: { escrowId: string; payerAgentId: string; amount: number }): Promise<{ txHash: string }>;
}

export interface AttestationService {
  recordAttestation(params: {
    agentId: string;
    attesterId: string;
    score: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ txHash: string; topicId?: string }>;
}

export interface ScheduleService {
  scheduleRecurring(params: {
    taskId: string;
    intervalSeconds: number;
    payload: Record<string, unknown>;
  }): Promise<{ scheduleId: string }>;
}

export interface PaymentGateway {
  processPayment(params: {
    from: string;
    to: string;
    amount: number;
    memo?: string;
  }): Promise<{ txHash: string; paymentId: string }>;
}

export interface IdentityService {
  verifyIdentity(params: { agentId: string }): Promise<{ verified: boolean; did?: string }>;
}

export interface RevenueService {
  settleRevenue(params: {
    agentId: string;
    amount: number;
    builderCode?: string;
  }): Promise<{ txHash: string }>;
}

export interface AnalyticsService {
  recordAnalytics(params: {
    agentId: string;
    eventType: string;
    data: Record<string, unknown>;
    builderCode?: string;
  }): Promise<{ recorded: boolean }>;
}

export interface NFTService {
  mintAgentNFT(params: {
    agentId: string;
    metadata: Record<string, unknown>;
  }): Promise<{ tokenId: string; txHash: string }>;
}

export interface InferenceService {
  rankAgents(params: {
    agentIds: string[];
    criteria: string;
  }): Promise<{ rankings: Array<{ agentId: string; score: number }> }>;
}
