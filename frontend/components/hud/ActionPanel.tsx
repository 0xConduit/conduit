'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEconomyStore, type DeployedChain, type AgentRole, type Task, type AgentEntity, type OnChainJob, type ContractEvent } from '../../store/useEconomyStore';

// ── Chain metadata ─────────────────────────────────────────────────────────────
const CHAINS: { value: DeployedChain; label: string; description: string; color: string; dot: string }[] = [
    { value: 'base',   label: 'Base',   description: 'Coinbase L2 — EVM-compatible',  color: 'text-blue-400',    dot: 'bg-blue-400' },
    { value: 'hedera', label: 'Hedera', description: 'Hashgraph — fast finality',      color: 'text-purple-400',  dot: 'bg-purple-400' },
    { value: 'zerog',  label: '0G',     description: '0G Chain — INFT identity token', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    { value: '0g',     label: '0G AI',  description: '0G AI — inference + INFT',       color: 'text-emerald-300', dot: 'bg-emerald-300' },
];
const CHAIN_MAP = Object.fromEntries(CHAINS.map(c => [c.value, c]));

const DEMO_TITLES = ['Analyze market data', 'Execute DeFi swap', 'Generate report', 'Verify attestation', 'Route payment'];

const STATUS_COLOR: Record<Task['status'], string> = {
    pending:    'text-yellow-400  border-yellow-400/40  bg-yellow-400/10',
    dispatched: 'text-blue-400    border-blue-400/40    bg-blue-400/10',
    completed:  'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    failed:     'text-red-400     border-red-400/40     bg-red-400/10',
};

// ── Shared style constants ─────────────────────────────────────────────────────
const inputCls  = "w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/30";
const selectCls = "w-full bg-[#0a0a0c] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-white/30";
const labelCls  = "block text-[10px] text-white/40 uppercase tracking-widest mb-1";
const sectionCls = "border border-white/10 rounded-md p-3 space-y-2.5 bg-white/[0.02]";

const stateBtn = (s: 'idle'|'loading'|'ok'|'err', label: string) =>
    s === 'loading' ? 'loading…' : s === 'ok' ? '✓ done' : s === 'err' ? '✗ failed' : label;

const actionBtnCls = (s: 'idle'|'loading'|'ok'|'err') =>
    `w-full py-1.5 rounded text-xs font-semibold border transition-all disabled:opacity-40 ${
        s === 'ok'  ? 'text-emerald-400 border-emerald-400/30' :
        s === 'err' ? 'text-red-400 border-red-400/30' :
        'border-white/20 text-white/70 hover:bg-white/10'
    }`;

function truncateAddr(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ── TxToast — shows tx hash result ──────────────────────────────────────────────
function TxToast({ txHash, onDismiss }: { txHash: string; onDismiss: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 6000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="text-[10px] px-2 py-1.5 rounded border text-emerald-400 border-emerald-400/20 bg-emerald-400/5 space-y-1">
            <p>✓ Transaction sent</p>
            <p className="font-mono text-[9px] text-emerald-400/70 break-all select-all">{txHash}</p>
        </div>
    );
}

// ── ChainSelector ──────────────────────────────────────────────────────────────
function ChainSelector({ value, onChange }: { value: DeployedChain; onChange: (c: DeployedChain) => void }) {
    return (
        <div>
            <label className={labelCls}>Chain</label>
            <div className="grid grid-cols-2 gap-1">
                {CHAINS.map(c => (
                    <button
                        key={c.value}
                        type="button"
                        onClick={() => onChange(c.value)}
                        className={`flex items-start gap-2 px-2.5 py-2 rounded border text-left transition-all ${
                            value === c.value
                                ? `border-white/30 bg-white/10 ${c.color}`
                                : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70'
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${c.dot}`} />
                        <div>
                            <div className="text-xs font-semibold leading-tight">{c.label}</div>
                            <div className="text-[9px] leading-tight opacity-60 mt-0.5">{c.description}</div>
                        </div>
                    </button>
                ))}
            </div>
            <p className="mt-1.5 text-[9px] text-white/30 border border-white/10 rounded px-2 py-1 bg-white/[0.02]">
                An INFT identity token will be minted on 0G Chain at registration.
            </p>
        </div>
    );
}

// ── Register Agent Form ────────────────────────────────────────────────────────
function RegisterAgentForm() {
    const { registerAgent } = useEconomyStore();
    const [id, setId]       = useState('');
    const [role, setRole]   = useState<AgentRole>('executor');
    const [caps, setCaps]   = useState('');
    const [chain, setChain] = useState<DeployedChain>('base');
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg]     = useState('');
    const [walletAddr, setWalletAddr] = useState('');

    // Optional Conduit registration fields
    const [conduitName, setConduitName]       = useState('');
    const [conduitPrice, setConduitPrice]     = useState('');
    const [conduitAbilities, setConduitAbilities] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState('loading');
        const capabilities = caps.split(',').map(s => s.trim()).filter(Boolean);
        const agent = await registerAgent({
            id: id.trim() || undefined,
            role,
            capabilities,
            deployedChain: chain,
            conduitName: conduitName.trim() || undefined,
            conduitPrice: conduitPrice.trim() || undefined,
            conduitAbilities: conduitAbilities.trim() || undefined,
        });
        if (agent) {
            setState('success');
            const tokenPart = agent.inftTokenId ? ` · INFT #${agent.inftTokenId}` : '';
            setMsg(`${agent.id}${tokenPart} · ${CHAIN_MAP[chain].label}`);
            setWalletAddr(agent.walletAddress ?? '');
            setId(''); setCaps(''); setConduitName(''); setConduitPrice(''); setConduitAbilities('');
            setTimeout(() => setState('idle'), 6000);
        } else {
            setState('error');
            setMsg('Registration failed — is the backend running?');
            setTimeout(() => setState('idle'), 3000);
        }
    }

    const chainInfo = CHAIN_MAP[chain];

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className={labelCls}>Agent ID (optional)</label>
                <input value={id} onChange={e => setId(e.target.value)} placeholder="auto-generated" className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Role</label>
                <select value={role} onChange={e => setRole(e.target.value as AgentRole)} className={selectCls}>
                    <option value="router">router</option>
                    <option value="executor">executor</option>
                    <option value="settler">settler</option>
                </select>
            </div>
            <div>
                <label className={labelCls}>Capabilities</label>
                <input value={caps} onChange={e => setCaps(e.target.value)} placeholder="defi, routing, inference" className={inputCls} />
                <p className="text-[9px] text-white/30 mt-0.5">comma-separated</p>
            </div>
            <ChainSelector value={chain} onChange={setChain} />

            {/* Optional Conduit on-chain registration */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Conduit Contract (optional)</p>
                <p className="text-[9px] text-white/25">Register on-chain at creation. Leave blank to skip.</p>
                <div>
                    <label className={labelCls}>Conduit Name (max 31 chars)</label>
                    <input value={conduitName} onChange={e => setConduitName(e.target.value.slice(0, 31))} placeholder="my-agent" className={inputCls} maxLength={31} />
                </div>
                <div>
                    <label className={labelCls}>Price per Minute (ETH)</label>
                    <input value={conduitPrice} onChange={e => setConduitPrice(e.target.value)} placeholder="0.001" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Abilities Mask</label>
                    <input value={conduitAbilities} onChange={e => setConduitAbilities(e.target.value)} placeholder="0" className={inputCls} />
                    <p className="text-[9px] text-white/25 mt-0.5">decimal bitmask</p>
                </div>
            </div>

            <button
                type="submit"
                disabled={state === 'loading'}
                className={`w-full py-2 rounded text-xs font-semibold transition-all border ${
                    state === 'loading'
                        ? 'border-white/10 text-white/30 bg-white/5 cursor-wait'
                        : `${chainInfo.color} bg-white/5 hover:bg-white/10 border-white/20`
                }`}
            >
                {state === 'loading' ? 'Registering…' : `Register on ${chainInfo.label}`}
            </button>
            {state === 'success' && (
                <div className="text-[10px] px-2 py-1.5 rounded border text-emerald-400 border-emerald-400/20 bg-emerald-400/5 space-y-1">
                    <p>✓ Agent registered on-chain</p>
                    <p className="font-mono text-[9px] text-emerald-400/70 break-all">{msg}</p>
                    {walletAddr && (
                        <p className="font-mono text-[9px] text-emerald-400/60 break-all select-all">Wallet: {walletAddr}</p>
                    )}
                    <p className="text-[9px] text-emerald-400/50">INFT minted · 0G Chain (Newton)</p>
                </div>
            )}
            {state === 'error' && (
                <p className="text-[10px] px-2 py-1.5 rounded border text-red-400 border-red-400/20 bg-red-400/5">{msg}</p>
            )}
        </form>
    );
}

// ── Tasks Panel ────────────────────────────────────────────────────────────────
function TasksPanel() {
    const { agents, tasks, createTask, dispatchTask, completeTask } = useEconomyStore();
    const agentIds     = Object.keys(agents);
    const taskList     = Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt);
    const pendingTasks    = taskList.filter(t => t.status === 'pending');
    const dispatchedTasks = taskList.filter(t => t.status === 'dispatched');

    // Create
    const [title, setTitle]           = useState('');
    const [reqId, setReqId]           = useState(agentIds[0] || '');
    const [escrow, setEscrow]         = useState('');
    const [createState, setCreateState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    // Dispatch
    const [dispTaskId, setDispTaskId]   = useState('');
    const [dispAgentId, setDispAgentId] = useState(agentIds[0] || '');
    const [dispState, setDispState]     = useState<'idle'|'loading'|'ok'|'err'>('idle');

    // Complete
    const [compTaskId, setCompTaskId] = useState('');
    const [compScore, setCompScore]   = useState(0.9);
    const [compState, setCompState]   = useState<'idle'|'loading'|'ok'|'err'>('idle');

    // Demo loop
    const [demoRunning, setDemoRunning] = useState(false);
    const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep agent dropdowns valid when agent list changes
    useEffect(() => {
        if (agentIds.length > 0 && !agentIds.includes(reqId))     setReqId(agentIds[0]);
        if (agentIds.length > 0 && !agentIds.includes(dispAgentId)) setDispAgentId(agentIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentIds.join(',')]);

    // When a task leaves the pending list (got dispatched), auto-advance the dropdown
    useEffect(() => {
        const stillPending = pendingTasks.some(t => t.id === dispTaskId);
        if (!stillPending) setDispTaskId(pendingTasks[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingTasks.map(t => t.id).join(',')]);

    // When a task leaves dispatched (got completed), auto-advance the dropdown
    useEffect(() => {
        const stillDispatched = dispatchedTasks.some(t => t.id === compTaskId);
        if (!stillDispatched) setCompTaskId(dispatchedTasks[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatchedTasks.map(t => t.id).join(',')]);

    function toggleDemo() {
        if (demoRunning) {
            if (demoRef.current) clearInterval(demoRef.current);
            setDemoRunning(false);
            return;
        }
        setDemoRunning(true);
        demoRef.current = setInterval(async () => {
            const s   = useEconomyStore.getState();
            const ids = Object.keys(s.agents);
            if (ids.length === 0) return;
            const tList      = Object.values(s.tasks);
            const dispatched = tList.filter(t => t.status === 'dispatched');
            const pending    = tList.filter(t => t.status === 'pending');

            if (dispatched.length > 0) {
                const t = dispatched[Math.floor(Math.random() * dispatched.length)];
                await s.completeTask(t.id, 'auto-completed', 0.7 + Math.random() * 0.3);
            } else if (pending.length > 0) {
                const t     = pending[Math.floor(Math.random() * pending.length)];
                const agent = ids[Math.floor(Math.random() * ids.length)];
                await s.dispatchTask(t.id, agent);
            } else {
                const rId   = ids[Math.floor(Math.random() * ids.length)];
                const title = DEMO_TITLES[Math.floor(Math.random() * DEMO_TITLES.length)];
                await s.createTask({ title, requirements: [], requesterAgentId: rId });
            }
        }, 3000);
    }
    useEffect(() => () => { if (demoRef.current) clearInterval(demoRef.current); }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !reqId) return;
        setCreateState('loading');
        const task = await createTask({ title, requirements: [], requesterAgentId: reqId, escrowAmount: escrow ? parseFloat(escrow) : undefined });
        setCreateState(task ? 'ok' : 'err');
        if (task) { setTitle(''); setEscrow(''); }
        setTimeout(() => setCreateState('idle'), 2000);
    }

    async function handleDispatch(e: React.FormEvent) {
        e.preventDefault();
        if (!dispTaskId || !dispAgentId) return;
        setDispState('loading');
        const t = await dispatchTask(dispTaskId, dispAgentId);
        setDispState(t ? 'ok' : 'err');
        setTimeout(() => setDispState('idle'), 2000);
    }

    async function handleComplete(e: React.FormEvent) {
        e.preventDefault();
        if (!compTaskId) return;
        setCompState('loading');
        const t = await completeTask(compTaskId, undefined, compScore);
        setCompState(t ? 'ok' : 'err');
        setTimeout(() => setCompState('idle'), 2000);
    }

    return (
        <div className="space-y-3">
            {/* Demo loop */}
            <button
                onClick={toggleDemo}
                className={`w-full py-2 rounded text-xs font-semibold border transition-all ${
                    demoRunning
                        ? 'border-red-400/40 text-red-400 bg-red-400/5 hover:bg-red-400/10'
                        : 'border-emerald-400/40 text-emerald-400 bg-emerald-400/5 hover:bg-emerald-400/10'
                }`}
            >
                {demoRunning ? '⏹ Stop Demo Loop' : '▶ Start Demo Loop'}
            </button>

            {/* 1 — Create */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">1 · Create Task</p>
                <p className="text-[9px] text-white/25">Creates a pending task. Then go to step 2 to dispatch it.</p>
                <form onSubmit={handleCreate} className="space-y-2">
                    <div>
                        <label className={labelCls}>Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Analyze market data" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Requester</label>
                        <select value={reqId} onChange={e => setReqId(e.target.value)} className={selectCls}>
                            {agentIds.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Escrow (USDC, optional)</label>
                        <input type="number" value={escrow} onChange={e => setEscrow(e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                    <button
                        type="submit"
                        disabled={createState === 'loading'}
                        className={actionBtnCls(createState)}
                    >
                        {stateBtn(createState, 'Create Task')}
                    </button>
                </form>
            </div>

            {/* 2 — Dispatch */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">2 · Dispatch Task</p>
                <p className="text-[9px] text-white/25">Assign a pending task to an agent. Fires a routing pulse on the graph.</p>
                <form onSubmit={handleDispatch} className="space-y-2">
                    <div>
                        <label className={labelCls}>Pending Task {pendingTasks.length === 0 && <span className="text-white/20 normal-case">(none yet)</span>}</label>
                        <select value={dispTaskId} onChange={e => setDispTaskId(e.target.value)} className={selectCls}>
                            <option value="">— select pending task —</option>
                            {pendingTasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title.slice(0, 26)} · {t.id.slice(-5)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Assign To</label>
                        <select value={dispAgentId} onChange={e => setDispAgentId(e.target.value)} className={selectCls}>
                            {agentIds.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={dispState === 'loading' || !dispTaskId}
                        className={actionBtnCls(dispState)}
                    >
                        {stateBtn(dispState, 'Dispatch')}
                    </button>
                </form>
            </div>

            {/* 3 — Complete */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">3 · Complete + Attest</p>
                <p className="text-[9px] text-white/25">Mark dispatched task done. Releases escrow and records attestation.</p>
                <form onSubmit={handleComplete} className="space-y-2">
                    <div>
                        <label className={labelCls}>Dispatched Task {dispatchedTasks.length === 0 && <span className="text-white/20 normal-case">(none yet)</span>}</label>
                        <select value={compTaskId} onChange={e => setCompTaskId(e.target.value)} className={selectCls}>
                            <option value="">— select dispatched task —</option>
                            {dispatchedTasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title.slice(0, 26)} · {t.id.slice(-5)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Attestation Score: {compScore.toFixed(2)}</label>
                        <input type="range" min={0} max={1} step={0.01} value={compScore} onChange={e => setCompScore(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
                    </div>
                    <button
                        type="submit"
                        disabled={compState === 'loading' || !compTaskId}
                        className={actionBtnCls(compState)}
                    >
                        {stateBtn(compState, 'Complete + Attest')}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ── Task Log ───────────────────────────────────────────────────────────────────
function TaskLog() {
    const tasks = useEconomyStore(s => s.tasks);
    const agents = useEconomyStore(s => s.agents);
    const taskList = Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

    if (taskList.length === 0) {
        return <p className="text-[10px] text-white/30 text-center py-6">No tasks yet — create one in the Tasks tab.</p>;
    }

    return (
        <div className="space-y-1.5">
            {taskList.map(t => {
                const assigneeChain = t.assignedAgentId ? agents[t.assignedAgentId]?.deployedChain : undefined;
                const chainInfo = assigneeChain ? CHAIN_MAP[assigneeChain] : null;
                return (
                    <div key={t.id} className="border border-white/10 rounded px-2.5 py-2 bg-white/[0.02] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/60 truncate flex-1">{t.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                        </div>
                        <div className="text-[9px] text-white/30 font-mono truncate">
                            {t.requesterAgentId}{t.assignedAgentId && ` → ${t.assignedAgentId}`}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] text-white/20 font-mono">{t.id.slice(-8)}</span>
                            {t.escrowAmount ? <span className="text-[9px] text-yellow-400/60">{t.escrowAmount} USDC</span> : null}
                            {chainInfo ? <span className={`text-[9px] ${chainInfo.color}`}>{chainInfo.label}</span> : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Contract Panel ─────────────────────────────────────────────────────────────
type ContractSubTab = 'register' | 'update' | 'jobs' | 'read';

function ContractPanel() {
    const store = useEconomyStore();
    const agents = store.agents;
    const agentList = Object.values(agents);
    const agentIds = Object.keys(agents);

    const [selectedAgentId, setSelectedAgentId] = useState(agentIds[0] || '');
    const [subTab, setSubTab] = useState<ContractSubTab>('register');
    const [txResult, setTxResult] = useState<string | null>(null);

    // Keep selection valid
    useEffect(() => {
        if (agentIds.length > 0 && !agentIds.includes(selectedAgentId)) setSelectedAgentId(agentIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentIds.join(',')]);

    const agent = agents[selectedAgentId] as AgentEntity | undefined;

    if (agentList.length === 0) {
        return <p className="text-[10px] text-white/30 text-center py-6">No agents yet — register one first.</p>;
    }

    const subTabs: { id: ContractSubTab; label: string }[] = [
        { id: 'register', label: 'Register' },
        { id: 'update',   label: 'Update' },
        { id: 'jobs',     label: 'Jobs' },
        { id: 'read',     label: 'Read' },
    ];

    return (
        <div className="space-y-3">
            {/* Agent selector */}
            <div>
                <label className={labelCls}>Agent</label>
                <select value={selectedAgentId} onChange={e => setSelectedAgentId(e.target.value)} className={selectCls}>
                    {agentList.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.id}{a.walletAddress ? ` (${truncateAddr(a.walletAddress)})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Wallet info */}
            {agent && (
                <div className="border border-white/10 rounded px-2.5 py-2 bg-white/[0.02] space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest">Wallet</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                            agent.conduitRegistered
                                ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
                                : 'text-white/30 border-white/10 bg-white/5'
                        }`}>
                            {agent.conduitRegistered ? 'Registered' : 'Not Registered'}
                        </span>
                    </div>
                    {agent.walletAddress ? (
                        <p className="font-mono text-[9px] text-white/50 break-all select-all">{agent.walletAddress}</p>
                    ) : (
                        <p className="text-[9px] text-white/25">No wallet generated</p>
                    )}
                </div>
            )}

            {/* Sub-tabs */}
            <div className="flex gap-1">
                {subTabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex-1 py-1.5 text-[9px] uppercase tracking-widest font-semibold rounded border transition-colors ${
                            subTab === t.id
                                ? 'text-white border-white/30 bg-white/10'
                                : 'text-white/30 border-white/10 bg-white/[0.02] hover:text-white/60'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Sub-tab content */}
            {subTab === 'register' && <ContractRegisterSub agentId={selectedAgentId} onTx={setTxResult} />}
            {subTab === 'update' && <ContractUpdateSub agentId={selectedAgentId} onTx={setTxResult} />}
            {subTab === 'jobs' && <ContractJobsSub agentId={selectedAgentId} onTx={setTxResult} />}
            {subTab === 'read' && <ContractReadSub agentId={selectedAgentId} />}

            {/* Tx result toast */}
            {txResult && <TxToast txHash={txResult} onDismiss={() => setTxResult(null)} />}
        </div>
    );
}

// ── Contract > Register sub-tab ────────────────────────────────────────────────
function ContractRegisterSub({ agentId, onTx }: { agentId: string; onTx: (hash: string) => void }) {
    const store = useEconomyStore();
    const [name, setName] = useState('');
    const [chain, setChain] = useState('base');
    const [price, setPrice] = useState('0');
    const [abilities, setAbilities] = useState('0');
    const [regState, setRegState] = useState<'idle'|'loading'|'ok'|'err'>('idle');
    const [fundState, setFundState] = useState<'idle'|'loading'|'ok'|'err'>('idle');
    const [deregState, setDeregState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    async function handleFund() {
        setFundState('loading');
        const result = await store.fundAgent(agentId);
        setFundState(result ? 'ok' : 'err');
        if (result) onTx(result.txHash);
        setTimeout(() => setFundState('idle'), 2000);
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        if (!name) return;
        setRegState('loading');
        const result = await store.contractRegister(agentId, { name, chain, pricePerMinute: price, abilitiesMask: abilities });
        setRegState(result ? 'ok' : 'err');
        if (result) onTx(result.txHash);
        setTimeout(() => setRegState('idle'), 2000);
    }

    async function handleDeregister() {
        setDeregState('loading');
        const result = await store.contractDeregister(agentId);
        setDeregState(result ? 'ok' : 'err');
        if (result) onTx(result.txHash);
        setTimeout(() => setDeregState('idle'), 2000);
    }

    return (
        <div className="space-y-3">
            <button
                onClick={handleFund}
                disabled={fundState === 'loading'}
                className={actionBtnCls(fundState)}
            >
                {stateBtn(fundState, 'Fund Gas (0.01 ETH)')}
            </button>

            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Register On-Chain</p>
                <form onSubmit={handleRegister} className="space-y-2">
                    <div>
                        <label className={labelCls}>Name (max 31 chars)</label>
                        <input value={name} onChange={e => setName(e.target.value.slice(0, 31))} placeholder="my-agent" className={inputCls} maxLength={31} />
                    </div>
                    <div>
                        <label className={labelCls}>Chain</label>
                        <select value={chain} onChange={e => setChain(e.target.value)} className={selectCls}>
                            <option value="base">Base (0)</option>
                            <option value="hedera">Hedera (1)</option>
                            <option value="zerog">0G (2)</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Price per Minute (ETH)</label>
                        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="0.001" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Abilities Mask</label>
                        <input value={abilities} onChange={e => setAbilities(e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                    <button type="submit" disabled={regState === 'loading' || !name} className={actionBtnCls(regState)}>
                        {stateBtn(regState, 'Register On-Chain')}
                    </button>
                </form>
            </div>

            <button
                onClick={handleDeregister}
                disabled={deregState === 'loading'}
                className={`w-full py-1.5 rounded text-xs font-semibold border transition-all disabled:opacity-40 ${
                    deregState === 'ok'  ? 'text-emerald-400 border-emerald-400/30' :
                    deregState === 'err' ? 'text-red-400 border-red-400/30' :
                    'border-red-400/30 text-red-400/70 hover:bg-red-400/5'
                }`}
            >
                {stateBtn(deregState, 'Deregister')}
            </button>
        </div>
    );
}

// ── Contract > Update sub-tab ──────────────────────────────────────────────────
function ContractUpdateSub({ agentId, onTx }: { agentId: string; onTx: (hash: string) => void }) {
    const store = useEconomyStore();
    const [name, setName] = useState('');
    const [chain, setChain] = useState('');
    const [price, setPrice] = useState('');
    const [abilities, setAbilities] = useState('');
    const [state, setState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setState('loading');
        const params: Record<string, string> = {};
        if (name) params.name = name;
        if (chain) params.chain = chain;
        if (price) params.pricePerMinute = price;
        if (abilities) params.abilitiesMask = abilities;

        if (Object.keys(params).length === 0) {
            setState('err');
            setTimeout(() => setState('idle'), 2000);
            return;
        }

        const result = await store.contractUpdate(agentId, params);
        setState(result ? 'ok' : 'err');
        if (result && result.updates.length > 0) {
            onTx(result.updates[result.updates.length - 1].txHash);
        }
        setTimeout(() => setState('idle'), 2000);
    }

    return (
        <div className={sectionCls}>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Update On-Chain</p>
            <p className="text-[9px] text-white/25">Only fill fields you want to change.</p>
            <form onSubmit={handleUpdate} className="space-y-2">
                <div>
                    <label className={labelCls}>Name</label>
                    <input value={name} onChange={e => setName(e.target.value.slice(0, 31))} placeholder="" className={inputCls} maxLength={31} />
                </div>
                <div>
                    <label className={labelCls}>Chain</label>
                    <select value={chain} onChange={e => setChain(e.target.value)} className={selectCls}>
                        <option value="">— no change —</option>
                        <option value="base">Base (0)</option>
                        <option value="hedera">Hedera (1)</option>
                        <option value="zerog">0G (2)</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Price per Minute (ETH)</label>
                    <input value={price} onChange={e => setPrice(e.target.value)} placeholder="" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Abilities Mask</label>
                    <input value={abilities} onChange={e => setAbilities(e.target.value)} placeholder="" className={inputCls} />
                </div>
                <button type="submit" disabled={state === 'loading'} className={actionBtnCls(state)}>
                    {stateBtn(state, 'Update')}
                </button>
            </form>
        </div>
    );
}

// ── Contract > Jobs sub-tab ────────────────────────────────────────────────────
function ContractJobsSub({ agentId, onTx }: { agentId: string; onTx: (hash: string) => void }) {
    const store = useEconomyStore();
    const agents = store.agents;
    const agentIds = Object.keys(agents);

    // Rent
    const [targetId, setTargetId] = useState(agentIds[0] || '');
    const [mins, setMins] = useState('1');
    const [valueEth, setValueEth] = useState('0.01');
    const [rentState, setRentState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    // Job actions
    const [jobId, setJobId] = useState('');
    const [attestation, setAttestation] = useState('');
    const [acceptState, setAcceptState] = useState<'idle'|'loading'|'ok'|'err'>('idle');
    const [rejectState, setRejectState] = useState<'idle'|'loading'|'ok'|'err'>('idle');
    const [completeState, setCompleteState] = useState<'idle'|'loading'|'ok'|'err'>('idle');
    const [refundState, setRefundState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    useEffect(() => {
        if (agentIds.length > 0 && !agentIds.includes(targetId)) setTargetId(agentIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentIds.join(',')]);

    async function handleRent(e: React.FormEvent) {
        e.preventDefault();
        setRentState('loading');
        const result = await store.contractRentAgent(agentId, { targetAgentId: targetId, minutes: parseInt(mins), valueEth });
        setRentState(result ? 'ok' : 'err');
        if (result) onTx(result.txHash);
        setTimeout(() => setRentState('idle'), 2000);
    }

    async function handleJobAction(action: 'accept' | 'reject' | 'complete' | 'refund') {
        if (!jobId) return;
        const id = parseInt(jobId);
        const setters = { accept: setAcceptState, reject: setRejectState, complete: setCompleteState, refund: setRefundState };
        setters[action]('loading');
        let result: { txHash: string } | null = null;
        switch (action) {
            case 'accept': result = await store.contractAcceptJob(agentId, id); break;
            case 'reject': result = await store.contractRejectJob(agentId, id); break;
            case 'complete': result = await store.contractCompleteJob(agentId, id, attestation); break;
            case 'refund': result = await store.contractRefundJob(agentId, id); break;
        }
        setters[action](result ? 'ok' : 'err');
        if (result) onTx(result.txHash);
        setTimeout(() => setters[action]('idle'), 2000);
    }

    return (
        <div className="space-y-3">
            {/* Rent Agent */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Rent Agent</p>
                <form onSubmit={handleRent} className="space-y-2">
                    <div>
                        <label className={labelCls}>Target Agent</label>
                        <select value={targetId} onChange={e => setTargetId(e.target.value)} className={selectCls}>
                            {agentIds.filter(id => id !== agentId).map(id => (
                                <option key={id} value={id}>{id}{agents[id]?.walletAddress ? ` (${truncateAddr(agents[id].walletAddress!)})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Minutes</label>
                        <input type="number" value={mins} onChange={e => setMins(e.target.value)} min="1" className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Value (ETH)</label>
                        <input value={valueEth} onChange={e => setValueEth(e.target.value)} placeholder="0.01" className={inputCls} />
                    </div>
                    <button type="submit" disabled={rentState === 'loading'} className={actionBtnCls(rentState)}>
                        {stateBtn(rentState, 'Rent Agent')}
                    </button>
                </form>
            </div>

            {/* Job Actions */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Job Actions</p>
                <div>
                    <label className={labelCls}>Job ID</label>
                    <input value={jobId} onChange={e => setJobId(e.target.value)} placeholder="0" className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Attestation (for complete)</label>
                    <input value={attestation} onChange={e => setAttestation(e.target.value)} placeholder="task completed successfully" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => handleJobAction('accept')} disabled={acceptState === 'loading' || !jobId} className={actionBtnCls(acceptState)}>
                        {stateBtn(acceptState, 'Accept')}
                    </button>
                    <button onClick={() => handleJobAction('reject')} disabled={rejectState === 'loading' || !jobId} className={actionBtnCls(rejectState)}>
                        {stateBtn(rejectState, 'Reject')}
                    </button>
                    <button onClick={() => handleJobAction('complete')} disabled={completeState === 'loading' || !jobId} className={actionBtnCls(completeState)}>
                        {stateBtn(completeState, 'Complete')}
                    </button>
                    <button onClick={() => handleJobAction('refund')} disabled={refundState === 'loading' || !jobId} className={actionBtnCls(refundState)}>
                        {stateBtn(refundState, 'Refund')}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Contract > Read sub-tab ────────────────────────────────────────────────────
function ContractReadSub({ agentId }: { agentId: string }) {
    const store = useEconomyStore();
    const agent = store.agents[agentId];

    // On-chain profile
    const [onChainProfile, setOnChainProfile] = useState<Record<string, unknown> | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    // Agent ETH balance
    const [agentBalance, setAgentBalance] = useState<string | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Agent's on-chain jobs
    const [agentJobs, setAgentJobs] = useState<OnChainJob[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);

    // Job lookup by ID
    const [lookupJobId, setLookupJobId] = useState('');
    const [lookupJob, setLookupJob] = useState<OnChainJob | null>(null);
    const [lookupState, setLookupState] = useState<'idle'|'loading'|'ok'|'err'>('idle');

    // Contract balance
    const [contractBalance, setContractBalance] = useState<string | null>(null);
    const [contractBalLoading, setContractBalLoading] = useState(false);

    // Recent events
    const [events, setEvents] = useState<ContractEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(false);

    // Job count
    const [jobCount, setJobCount] = useState<number | null>(null);

    async function loadProfile() {
        setProfileLoading(true);
        const data = await store.contractGetOnChainState(agentId);
        setOnChainProfile(data);
        setProfileLoading(false);
    }

    async function loadBalance() {
        if (!agent?.walletAddress) return;
        setBalanceLoading(true);
        const data = await store.contractGetBalance(agent.walletAddress);
        setAgentBalance(data?.balance ?? null);
        setBalanceLoading(false);
    }

    async function loadAgentJobs() {
        setJobsLoading(true);
        const jobs = await store.contractGetAgentJobs(agentId);
        setAgentJobs(jobs);
        setJobsLoading(false);
    }

    async function handleLookupJob(e: React.FormEvent) {
        e.preventDefault();
        if (!lookupJobId) return;
        setLookupState('loading');
        const job = await store.contractGetJob(parseInt(lookupJobId));
        setLookupJob(job);
        setLookupState(job ? 'ok' : 'err');
        setTimeout(() => setLookupState('idle'), 3000);
    }

    async function loadContractBalance() {
        setContractBalLoading(true);
        const data = await store.contractGetContractBalance();
        setContractBalance(data?.balance ?? null);
        setContractBalLoading(false);
    }

    async function loadEvents() {
        setEventsLoading(true);
        const data = await store.contractQueryEvents({ limit: 20 });
        setEvents(data);
        setEventsLoading(false);
    }

    async function loadJobCount() {
        const data = await store.contractGetJobCount();
        setJobCount(data.count);
    }

    return (
        <div className="space-y-3">
            {/* Agent On-Chain Profile */}
            <div className={sectionCls}>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">On-Chain Profile</p>
                    <button onClick={loadProfile} disabled={profileLoading} className="text-[9px] text-white/40 hover:text-white/70">
                        {profileLoading ? 'loading...' : 'refresh'}
                    </button>
                </div>
                {onChainProfile ? (
                    <div className="space-y-0.5">
                        {Object.entries(onChainProfile).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[9px]">
                                <span className="text-white/30">{k}</span>
                                <span className="text-white/60 font-mono truncate ml-2 max-w-[60%] text-right">{String(v)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[9px] text-white/20">Click refresh to load</p>
                )}
            </div>

            {/* Agent ETH Balance */}
            <div className={sectionCls}>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Agent ETH Balance</p>
                    <button onClick={loadBalance} disabled={balanceLoading || !agent?.walletAddress} className="text-[9px] text-white/40 hover:text-white/70">
                        {balanceLoading ? 'loading...' : 'refresh'}
                    </button>
                </div>
                {agentBalance !== null ? (
                    <p className="text-xs text-emerald-400 font-mono">{agentBalance} ETH</p>
                ) : (
                    <p className="text-[9px] text-white/20">{agent?.walletAddress ? 'Click refresh to load' : 'No wallet'}</p>
                )}
            </div>

            {/* Agent On-Chain Jobs */}
            <div className={sectionCls}>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Agent Jobs</p>
                    <button onClick={loadAgentJobs} disabled={jobsLoading} className="text-[9px] text-white/40 hover:text-white/70">
                        {jobsLoading ? 'loading...' : 'refresh'}
                    </button>
                </div>
                {agentJobs.length > 0 ? (
                    <div className="space-y-1">
                        {agentJobs.map(j => (
                            <div key={j.jobId} className="border border-white/10 rounded px-2 py-1.5 bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-white/50 font-mono">Job #{j.jobId}</span>
                                    <span className={`text-[9px] px-1 py-0.5 rounded border font-semibold ${
                                        j.completed ? 'text-emerald-400 border-emerald-400/30' :
                                        j.rejected ? 'text-red-400 border-red-400/30' :
                                        j.accepted ? 'text-blue-400 border-blue-400/30' :
                                        'text-yellow-400 border-yellow-400/30'
                                    }`}>
                                        {j.completed ? 'completed' : j.rejected ? 'rejected' : j.accepted ? 'accepted' : 'pending'}
                                    </span>
                                </div>
                                <div className="text-[9px] text-white/30 font-mono truncate mt-0.5">{j.amount} ETH</div>
                                {j.prompt && <div className="text-[9px] text-white/20 truncate">{j.prompt}</div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[9px] text-white/20">Click refresh to load</p>
                )}
            </div>

            {/* Job Lookup */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Job Lookup</p>
                <form onSubmit={handleLookupJob} className="space-y-2">
                    <div>
                        <label className={labelCls}>Job ID</label>
                        <input value={lookupJobId} onChange={e => setLookupJobId(e.target.value)} placeholder="0" className={inputCls} />
                    </div>
                    <button type="submit" disabled={lookupState === 'loading' || !lookupJobId} className={actionBtnCls(lookupState)}>
                        {stateBtn(lookupState, 'Look Up')}
                    </button>
                </form>
                {lookupJob && (
                    <div className="space-y-0.5 mt-2">
                        <div className="flex justify-between text-[9px]"><span className="text-white/30">agent</span><span className="text-white/60 font-mono truncate ml-2 max-w-[60%] text-right">{truncateAddr(lookupJob.agent)}</span></div>
                        <div className="flex justify-between text-[9px]"><span className="text-white/30">renter</span><span className="text-white/60 font-mono truncate ml-2 max-w-[60%] text-right">{truncateAddr(lookupJob.renter)}</span></div>
                        <div className="flex justify-between text-[9px]"><span className="text-white/30">amount</span><span className="text-white/60 font-mono">{lookupJob.amount} ETH</span></div>
                        <div className="flex justify-between text-[9px]"><span className="text-white/30">status</span><span className="text-white/60">{lookupJob.completed ? 'completed' : lookupJob.rejected ? 'rejected' : lookupJob.accepted ? 'accepted' : 'pending'}</span></div>
                        {lookupJob.prompt && <div className="flex justify-between text-[9px]"><span className="text-white/30">prompt</span><span className="text-white/60 truncate ml-2 max-w-[60%] text-right">{lookupJob.prompt}</span></div>}
                        {lookupJob.attestation && lookupJob.attestation !== '\x00' && <div className="flex justify-between text-[9px]"><span className="text-white/30">attestation</span><span className="text-white/60 font-mono truncate ml-2 max-w-[60%] text-right">{lookupJob.attestation}</span></div>}
                    </div>
                )}
            </div>

            {/* Contract Balance + Job Count */}
            <div className={sectionCls}>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Contract Stats</p>
                    <button onClick={() => { loadContractBalance(); loadJobCount(); }} disabled={contractBalLoading} className="text-[9px] text-white/40 hover:text-white/70">
                        {contractBalLoading ? 'loading...' : 'refresh'}
                    </button>
                </div>
                <div className="space-y-0.5">
                    <div className="flex justify-between text-[9px]">
                        <span className="text-white/30">Escrowed ETH</span>
                        <span className="text-emerald-400 font-mono">{contractBalance ?? '—'}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                        <span className="text-white/30">Total Jobs</span>
                        <span className="text-white/60 font-mono">{jobCount ?? '—'}</span>
                    </div>
                </div>
            </div>

            {/* Recent Events */}
            <div className={sectionCls}>
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Recent Events</p>
                    <button onClick={loadEvents} disabled={eventsLoading} className="text-[9px] text-white/40 hover:text-white/70">
                        {eventsLoading ? 'loading...' : 'refresh'}
                    </button>
                </div>
                {events.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {events.map((ev, i) => (
                            <div key={i} className="border border-white/10 rounded px-2 py-1 bg-white/[0.02]">
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-white/50 font-semibold">{ev.eventName}</span>
                                    <span className="text-[8px] text-white/20 font-mono">#{ev.blockNumber}</span>
                                </div>
                                <div className="text-[8px] text-white/20 font-mono truncate">{ev.transactionHash}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[9px] text-white/20">Click refresh to load</p>
                )}
            </div>
        </div>
    );
}

// ── Main ActionPanel ───────────────────────────────────────────────────────────
type Tab = 'register' | 'tasks' | 'log' | 'contract';

export default function ActionPanel() {
    const { actionPanelOpen, setActionPanelOpen, backendAvailable } = useEconomyStore();
    const [tab, setTab] = useState<Tab>('register');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'register', label: 'Register' },
        { id: 'tasks',    label: 'Tasks' },
        { id: 'log',      label: 'Log' },
        { id: 'contract', label: 'Contract' },
    ];

    return (
        <>
            <button
                onClick={() => setActionPanelOpen(!actionPanelOpen)}
                className="fixed bottom-16 right-5 z-50 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-medium backdrop-blur-md hover:bg-white/20 hover:text-white transition-colors"
            >
                {actionPanelOpen ? '✕ Close' : '⊕ Control Panel'}
            </button>

            <AnimatePresence>
                {actionPanelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.18 }}
                        className="fixed bottom-28 right-5 z-40 w-80 max-h-[calc(100vh-10rem)] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 shrink-0">
                            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Conduit Control</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                backendAvailable
                                    ? 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10'
                                    : 'border-amber-400/40 text-amber-400 bg-amber-400/10'
                            }`}>
                                {backendAvailable ? 'live' : 'offline'}
                            </span>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 shrink-0">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                                        tab === t.id ? 'text-white border-b-2 border-white/60' : 'text-white/30 hover:text-white/60'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto flex-1 p-3">
                            {tab === 'register' && <RegisterAgentForm />}
                            {tab === 'tasks'    && <TasksPanel />}
                            {tab === 'log'      && <TaskLog />}
                            {tab === 'contract' && <ContractPanel />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
