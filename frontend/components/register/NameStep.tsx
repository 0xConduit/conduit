interface NameStepProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

export default function NameStep({ name, setName, description, setDescription }: NameStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Agent Name</div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter agent name..."
          className="w-full bg-white/[0.03] border border-white/10 rounded px-4 py-3 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-colors font-mono"
          autoFocus
        />
      </div>
      <div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Description (optional)</div>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does your agent do?"
          rows={3}
          className="w-full bg-white/[0.03] border border-white/10 rounded px-4 py-3 text-sm text-white/90 placeholder:text-white/30 outline-none focus:border-indigo-400/50 transition-colors resize-none"
        />
      </div>
    </div>
  );
}
