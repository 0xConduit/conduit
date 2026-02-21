'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEconomyStore, type DeployedChain, type AgentRole, type Task } from '../../store/useEconomyStore';

// ── Chain metadata ────────────────────────────────────────────────────────────
const CHAINS: { value: DeployedChain; label: string; description: string; color: string; dot: string }[] = [
    { value: 'base',   label: 'Base',   description: 'Coinbase L2 — EVM-compatible',           color: 'text-blue-400',   dot: 'bg-blue-400' },
    { value: 'hedera', label: 'Hedera', description: 'Hashgraph — fast finality',               color: 'text-purple-400', dot: 'bg-purple-400' },
    { value: 'zerog',  label: '0G',     description: '0G Chain — INFT identity token',          color: 'text-emerald-400',dot: 'bg-emerald-400' },
    { value: '0g',     label: '0G AI',  description: '0G AI — inference + INFT',                color: 'text-emerald-300',dot: 'bg-emerald-300' },
];

const CHAIN_MAP = Object.fromEntries(CHAINS.map(c => [c.value, c]));

const DEMO_TITLES = ['Analyze market data', 'Execute DeFi swap', 'Generate report', 'Verify attestation', 'Route payment'];

const STATUS_COLOR: Record<Task['status'], string> = {
    pending:    'text-yellow-400  border-yellow-400/40  bg-yellow-400/10',
    dispatched: 'text-blue-400    border-blue-400/40    bg-blue-400/10',
    completed:  'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
    failed:     'text-red-400     border-red-400/40     bg-red-400/10',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ChainSelector({ value, onChange }: { value: DeployedChain; onChange: (c: DeployedChain) => void }) {
    const chain = CHAIN_MAP[value];
    return (
        <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Chain</label>
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
            {/* Every chain mints an INFT */}
            <p className="mt-1.5 text-[9px] text-white/40 border border-white/10 rounded px-2 py-1 bg-white/[0.02]">
                An INFT identity token will be minted on 0G Chain at registration.
            </p>
        </div>
    );
}

function RegisterAgentForm() {
    const { registerAgent, backendAvailable } = useEconomyStore();
    const [id, setId] = useState('');
    const [role, setRole] = useState<AgentRole>('executor');
    const [caps, setCaps] = useState('');
    const [chain, setChain] = useState<DeployedChain>('base');
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setState('loading');
        const capabilities = caps.split(',').map(s => s.trim()).filter(Boolean);
        const agent = await registerAgent({ id: id.trim() || undefined, role, capabilities, deployedChain: chain });
        if (agent) {
            setState('success');
            const tokenPart = agent.inftTokenId ? ` · INFT #${agent.inftTokenId}` : '';
            setMsg(`${agent.id}${tokenPart} · ${CHAIN_MAP[chain].label}`);
            setId(''); setCaps('');
            setTimeout(() => setState('idle'), 4000);
        } else {
            setState('error');
            setMsg('Registration failed');
            setTimeout(() => setState('idle'), 3000);
        }
    }

    const chainInfo = CHAIN_MAP[chain];

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Agent ID (optional)</label>
                <input
                    value={id}
                    onChange={e => setId(e.target.value)}
                    placeholder="auto-generated"
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/30"
                />
            </div>
            <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Role</label>
                <select
                    value={role}
                    onChange={e => setRole(e.target.value as AgentRole)}
                    className="w-full bg-[#0a0a0c] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-white/30"
                >
                    <option value="router">router</option>
                    <option value="executor">executor</option>
                    <option value="settler">settler</option>
                </select>
            </div>
            <div>
                <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1">Capabilities</label>
                <input
                    value={caps}
                    onChange={e => setCaps(e.target.value)}
                    placeholder="defi, routing, inference"
                    className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/30"
                />
                <p className="text-[9px] text-white/30 mt-0.5">comma-separated</p>
            </div>
            <ChainSelector value={chain} onChange={setChain} />
            <button
                type="submit"
                disabled={state === 'loading'}
                className={`w-full py-2 rounded text-xs font-semibold transition-all border ${
                    state === 'loading' ? 'border-white/10 text-white/30 bg-white/5 cursor-wait'
                    : `border-${chainInfo.dot.replace('bg-', '')}/40 ${chainInfo.color} bg-white/5 hover:bg-white/10`
                }`}
            >
                {state === 'loading' ? 'Registering…' : `Register on ${chainInfo.label}`}
            </button>
            {state === 'success' && (
                <div className="text-[10px] px-2 py-1.5 rounded border text-emerald-400 border-emerald-400/20 bg-emerald-400/5 space-y-1">
                    <p>✓ Agent registered on-chain</p>
                    <p className="font-mono text-[9px] text-emerald-400/70 break-all">{msg}</p>
                    <p className="text-[9px] text-emerald-400/50">INFT minted · 0G Chain (Newton)</p>
                </div>
            )}
            {state === 'error' && (
                <p className="text-[10px] px-2 py-1.5 rounded border text-red-400 border-red-400/20 bg-red-400/5">{msg}</p>
            )}
        </form>
    );
}

function TasksPanel() {
    const { agents, tasks, createTask, dispatchTask, completeTask } = useEconomyStore();
    const agentIds = Object.keys(agents);
    const taskList = Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt);
    const pendingTasks = taskList.filter(t => t.status === 'pending');
    const dispatchedTasks = taskList.filter(t => t.status === 'dispatched');

    // Create task form
    const [title, setTitle] = useState('');
    const [reqId, setReqId] = useState(agentIds[0] || '');
    const [escrow, setEscrow] = useState('');
    const [createState, setCreateState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

    // Dispatch form — always track the first valid pending task
    const firstPendingId = pendingTasks[0]?.id ?? '';
    const [dispTaskId, setDispTaskId] = useState('');
    const [dispAgentId, setDispAgentId] = useState(agentIds[0] || '');
    const [dispState, setDispState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

    // Complete form — always track the first valid dispatched task
    const firstDispatchedId = dispatchedTasks[0]?.id ?? '';
    const [compTaskId, setCompTaskId] = useState('');
    const [compScore, setCompScore] = useState(0.9);
    const [compState, setCompState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

    // Demo loop
    const [demoRunning, setDemoRunning] = useState(false);
    const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep dropdowns valid: if current selection disappears from the list, reset to first available
    useEffect(() => {
        if (agentIds.length > 0 && !agentIds.includes(reqId)) setReqId(agentIds[0]);
        if (agentIds.length > 0 && !agentIds.includes(dispAgentId)) setDispAgentId(agentIds[0]);
    }, [agentIds.join(',')]);

    useEffect(() => {
        // If the selected pending task was just dispatched, auto-advance to next pending task
        const stillPending = pendingTasks.some(t => t.id === dispTaskId);
        if (!stillPending) setDispTaskId(firstPendingId);
    }, [firstPendingId, pendingTasks.map(t => t.id).join(',')]);

    useEffect(() => {
        const stillDispatched = dispatchedTasks.some(t => t.id === compTaskId);
        if (!stillDispatched) setCompTaskId(firstDispatchedId);
    }, [firstDispatchedId, dispatchedTasks.map(t => t.id).join(',')]);

    function toggleDemo() {
        if (demoRunning) {
            if (demoRef.current) clearInterval(demoRef.current);
            setDemoRunning(false);
            return;
        }
        setDemoRunning(true);
        demoRef.current = setInterval(async () => {
            const s = useEconomyStore.getState();
            const ids = Object.keys(s.agents);
            if (ids.length === 0) return;
            const tList = Object.values(s.tasks);
            const dispatched = tList.filter(t => t.status === 'dispatched');
            const pending = tList.filter(t => t.status === 'pending');

            if (dispatched.length > 0) {
                const t = dispatched[Math.floor(Math.random() * dispatched.length)];
                await s.completeTask(t.id, 'auto-completed', 0.7 + Math.random() * 0.3);
            } else if (pending.length > 0) {
                const t = pending[Math.floor(Math.random() * pending.length)];
                const agent = ids[Math.floor(Math.random() * ids.length)];
                await s.dispatchTask(t.id, agent);
            } else {
                const rId = ids[Math.floor(Math.random() * ids.length)];
                const titlePick = DEMO_TITLES[Math.floor(Math.random() * DEMO_TITLES.length)];
                await s.createTask({ title: titlePick, requirements: [], requesterAgentId: rId });
            }
        }, 3000);
    }

    useEffect(() => { return () => { if (demoRef.current) clearInterval(demoRef.current); }; }, []);

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
        if (t) setDispTaskId('');
        setTimeout(() => setDispState('idle'), 2000);
    }

    async function handleComplete(e: React.FormEvent) {
        e.preventDefault();
        if (!compTaskId) return;
        setCompState('loading');
        const t = await completeTask(compTaskId, undefined, compScore);
        setCompState(t ? 'ok' : 'err');
        if (t) setCompTaskId('');
        setTimeout(() => setCompState('idle'), 2000);
    }

    const inputCls = "w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-white/30";
    const selectCls = "w-full bg-[#0a0a0c] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-white/30";
    const labelCls = "block text-[10px] text-white/40 uppercase tracking-widest mb-1";
    const sectionCls = "border border-white/10 rounded-md p-3 space-y-2.5 bg-white/[0.02]";

    const stateBtn = (s: 'idle'|'loading'|'ok'|'err', label: string) =>
        s === 'loading' ? 'loading…' : s === 'ok' ? '✓ done' : s === 'err' ? '✗ failed' : label;

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

            {/* Create task */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">1 · Create Task</p>
                <p className="text-[9px] text-white/25">Creates a pending task. Then dispatch it to an agent below.</p>
                <form onSubmit={handleCreate} className="space-y-2">
                    <div><label className={labelCls}>Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Analyze market data" className={inputCls} /></div>
                    <div>
                        <label className={labelCls}>Requester</label>
                        <select value={reqId} onChange={e => setReqId(e.target.value)} className={selectCls}>
                            {agentIds.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    <div><label className={labelCls}>Escrow (USDC, optional)</label><input type="number" value={escrow} onChange={e => setEscrow(e.target.value)} placeholder="0" className={inputCls} /></div>
                    <button type="submit" disabled={createState === 'loading'} className={`w-full py-1.5 rounded text-xs font-semibold border border-white/20 text-white/70 hover:bg-white/10 transition-all ${createState === 'ok' ? 'text-emerald-400 border-emerald-400/30' : createState === 'err' ? 'text-red-400 border-red-400/30' : ''}`}>
                        {stateBtn(createState, 'Create Task')}
                    </button>
                </form>
            </div>

            {/* Dispatch */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">2 · Dispatch Task</p>
                <p className="text-[9px] text-white/25">Assign a pending task to an agent. Triggers a routing pulse on the graph.</p>
                <form onSubmit={handleDispatch} className="space-y-2">
                    <div>
                        <label className={labelCls}>Pending Task</label>
                        <select value={dispTaskId} onChange={e => setDispTaskId(e.target.value)} className={selectCls}>
                            <option value="">— select pending task —</option>
                            {pendingTasks.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 24)} · {t.id.slice(-5)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Assign To</label>
                        <select value={dispAgentId} onChange={e => setDispAgentId(e.target.value)} className={selectCls}>
                            {agentIds.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={dispState === 'loading' || !dispTaskId} className={`w-full py-1.5 rounded text-xs font-semibold border border-white/20 text-white/70 hover:bg-white/10 transition-all disabled:opacity-40 ${dispState === 'ok' ? 'text-emerald-400 border-emerald-400/30' : dispState === 'err' ? 'text-red-400 border-red-400/30' : ''}`}>
                        {stateBtn(dispState, 'Dispatch')}
                    </button>
                </form>
            </div>

            {/* Complete */}
            <div className={sectionCls}>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">3 · Complete + Attest</p>
                <p className="text-[9px] text-white/25">Mark a dispatched task done. Releases escrow and records attestation on-chain.</p>
                <form onSubmit={handleComplete} className="space-y-2">
                    <div>
                        <label className={labelCls}>Dispatched Task</label>
                        <select value={compTaskId} onChange={e => setCompTaskId(e.target.value)} className={selectCls}>
                            <option value="">— select dispatched task —</option>
                            {dispatchedTasks.map(t => <option key={t.id} value={t.id}>{t.title.slice(0, 24)} · {t.id.slice(-5)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Attestation Score: {compScore.toFixed(2)}</label>
                        <input type="range" min={0} max={1} step={0.01} value={compScore} onChange={e => setCompScore(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
                    </div>
                    <button type="submit" disabled={compState === 'loading' || !compTaskId} className={`w-full py-1.5 rounded text-xs font-semibold border border-white/20 text-white/70 hover:bg-white/10 transition-all disabled:opacity-40 ${compState === 'ok' ? 'text-emerald-400 border-emerald-400/30' : compState === 'err' ? 'text-red-400 border-red-400/30' : ''}`}>
                        {stateBtn(compState, 'Complete + Attest')}
                    </button>
                </form>
            </div>
        </div>
    );
}

function TaskLog() {
    const tasks = useEconomyStore(s => s.tasks);
    const taskList = Object.values(tasks).sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

    if (taskList.length === 0) {
        return <p className="text-[10px] text-white/30 text-center py-6">No tasks yet. Create one in the Tasks tab.</p>;
    }

    return (
        <div className="space-y-1.5">
            {taskList.map(t => {
                const chainInfo = t.assignedAgentId
                    ? CHAIN_MAP[useEconomyStore.getState().agents[t.assignedAgentId]?.deployedChain ?? 'base']
                    : null;
                return (
                    <div key={t.id} className="border border-white/10 rounded px-2.5 py-2 bg-white/[0.02] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/60 truncate flex-1">{t.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${STATUS_COLOR[t.status]}`}>{t.status}</span>
                        </div>
                        <div className="text-[9px] text-white/30 font-mono">
                            {t.requesterAgentId}
                            {t.assignedAgentId && <> → {t.assignedAgentId}</>}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-white/20 font-mono">{t.id.slice(-8)}</span>
                            {t.escrowAmount && <span className="text-[9px] text-yellow-400/60">{t.escrowAmount} USDC</span>}
                            {chainInfo && (
                                <span className={`text-[9px] ${chainInfo.color}`}>{chainInfo.label}</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Main ActionPanel ──────────────────────────────────────────────────────────

type Tab = 'register' | 'tasks' | 'log';

export default function ActionPanel() {
    const { actionPanelOpen, setActionPanelOpen, backendAvailable } = useEconomyStore();
    const [tab, setTab] = useState<Tab>('register');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'register', label: 'Register' },
        { id: 'tasks',    label: 'Tasks' },
        { id: 'log',      label: 'Log' },
    ];

    return (
        <>
            {/* Toggle button */}
            <button
                onClick={() => setActionPanelOpen(!actionPanelOpen)}
                className="fixed bottom-16 left-5 z-50 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-white/70 text-xs font-medium backdrop-blur-md hover:bg-white/20 hover:text-white transition-colors"
            >
                {actionPanelOpen ? '✕ Close' : '⊕ Control Panel'}
            </button>

            {/* Panel */}
            <AnimatePresence>
                {actionPanelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18 }}
                        className="fixed bottom-28 left-5 z-40 w-80 max-h-[calc(100vh-10rem)] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10 shrink-0">
                            <span className="text-[11px] font-semibold text-white/70 uppercase tracking-widest">Conduit Control</span>
                            <div className="flex items-center gap-2">
                                {!backendAvailable && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-amber-400/40 text-amber-400 bg-amber-400/10">offline</span>
                                )}
                                {backendAvailable && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-emerald-400/40 text-emerald-400 bg-emerald-400/10">live</span>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 shrink-0">
                            {tabs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-semibold transition-colors ${
                                        tab === t.id
                                            ? 'text-white border-b-2 border-white/60'
                                            : 'text-white/30 hover:text-white/60'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="overflow-y-auto flex-1 p-3">
                            {tab === 'register' && <RegisterAgentForm />}
                            {tab === 'tasks'    && <TasksPanel />}
                            {tab === 'log'      && <TaskLog />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
