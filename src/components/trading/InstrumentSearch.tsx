"use client";

import { useState, useEffect, useCallback } from "react";

interface Instrument {
  symbol: string;
  name: string;
  category: string;
  subcategory?: string;
}

interface Props {
  onSelect: (symbol: string) => void;
  selectedInstrument: string | null;
}

const POPULAR: Instrument[] = [
  { symbol: "XAUUSD", name: "Gold", category: "commodity" },
  { symbol: "XAGUSD", name: "Silver", category: "commodity" },
  { symbol: "BTC", name: "Bitcoin", category: "crypto" },
  { symbol: "ETH", name: "Ethereum", category: "crypto" },
  { symbol: "SOL", name: "Solana", category: "crypto" },
  { symbol: "EURUSD", name: "EUR/USD", category: "forex" },
  { symbol: "GBPUSD", name: "GBP/USD", category: "forex" },
  { symbol: "USDJPY", name: "USD/JPY", category: "forex" },
  { symbol: "AUDUSD", name: "AUD/USD", category: "forex" },
  { symbol: "USDIDR", name: "USD/IDR", category: "forex" },
  { symbol: "SPX500", name: "S&P 500", category: "index" },
  { symbol: "NASDAQ", name: "Nasdaq 100", category: "index" },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; border: string; icon: string }> = {
  commodity: { label: "Commodities", color: "text-yellow-400", border: "border-yellow-500/50", icon: "🥇" },
  crypto: { label: "Crypto", color: "text-purple-400", border: "border-purple-500/50", icon: "₿" },
  forex: { label: "Forex", color: "text-blue-400", border: "border-blue-500/50", icon: "💱" },
  index: { label: "Indices", color: "text-orange-400", border: "border-orange-500/50", icon: "📊" },
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  major: "Major", metals: "Metals", energy: "Energy", agriculture: "Agriculture",
  cross: "Crosses", exotic: "Exotics", defi: "DeFi", layer2: "Layer 2",
  us: "US", europe: "Europe", asia: "Asia",
};

export default function InstrumentSearch({ onSelect, selectedInstrument }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instrument[]>(POPULAR);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [allInstruments, setAllInstruments] = useState<Instrument[]>([]);

  useEffect(() => {
    fetch("/api/forex").then(r => r.json()).then(d => setAllInstruments(d.popular || [])).catch(() => {});
  }, []);

  const searchInstruments = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(categoryFilter === "all" ? POPULAR : allInstruments.filter(i => i.category === categoryFilter));
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/forex?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const filtered = categoryFilter === "all" ? data.results : (data.results || []).filter((i: Instrument) => i.category === categoryFilter);
      setResults(filtered);
    } catch {
      setResults([]);
    }
    setSearching(false);
  }, [categoryFilter, allInstruments]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      if (query) searchInstruments(query);
      else setResults(categoryFilter === "all" ? POPULAR : allInstruments.filter(i => i.category === categoryFilter));
    }, 300);
    setSearchTimeout(timeout);
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [query, categoryFilter]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search instruments (Gold, EURUSD, BTC, S&P500...)"
          className="w-full px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-base sm:text-lg pr-20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searching && <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
          <span className="text-[var(--muted)] text-sm">24/5</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            categoryFilter === "all"
              ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
              : "border-[var(--card-border)] text-[var(--muted)]"
          }`}
        >
          All
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              categoryFilter === key
                ? `${config.border} ${config.color} bg-current/10`
                : "border-[var(--card-border)] text-[var(--muted)]"
            }`}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {query && results.length > 0 && (
        <div className="text-xs text-[var(--muted)]">
          Found {results.length} instruments
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-[350px] sm:max-h-[450px] overflow-y-auto p-1">
        {results.map((inst) => {
          const cat = CATEGORY_CONFIG[inst.category] || CATEGORY_CONFIG.forex;
          return (
            <button
              key={inst.symbol}
              onClick={() => { onSelect(inst.symbol); setQuery(""); }}
              className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
                selectedInstrument === inst.symbol
                  ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                  : `${cat.border} bg-[var(--card)] ${cat.color}`
              }`}
            >
              <span className="font-mono font-bold">{inst.symbol}</span>
              <span className="ml-1 text-xs opacity-70 hidden sm:inline">{inst.name}</span>
              {inst.subcategory && (
                <span className="ml-1 text-[10px] opacity-50 hidden md:inline">({SUBCATEGORY_LABELS[inst.subcategory] || inst.subcategory})</span>
              )}
            </button>
          );
        })}
      </div>

      {results.length === 0 && !searching && (
        <div className="text-center py-4 text-[var(--muted)] text-sm">
          No instruments found.
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <span key={key} className="px-2 py-1 rounded">{config.icon} {config.label}</span>
        ))}
      </div>
    </div>
  );
}
