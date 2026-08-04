"use client";

import { useState, useEffect, useCallback } from "react";

interface Stock {
  symbol: string;
  name: string;
}

interface Props {
  onSelect: (symbol: string) => void;
  selectedStock: string | null;
}

const POPULAR_STOCKS: Stock[] = [
  { symbol: "BBCA", name: "Bank Central Asia" },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia" },
  { symbol: "BMRI", name: "Bank Mandiri" },
  { symbol: "TLKM", name: "Telkom Indonesia" },
  { symbol: "ASII", name: "Astra International" },
  { symbol: "UNVR", name: "Unilever Indonesia" },
  { symbol: "GOTO", name: "GoTo Gojek Tokopedia" },
  { symbol: "ADRO", name: "Adaro Energy" },
  { symbol: "PTBA", name: "Bukit Asam" },
  { symbol: "SMGR", name: "Semen Indonesia" },
  { symbol: "EXCL", name: "XL Axiata" },
  { symbol: "ISAT", name: "Indosat Ooredoo" },
];

export default function StockSearch({ onSelect, selectedStock }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Stock[]>(POPULAR_STOCKS);
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const searchStocks = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(POPULAR_STOCKS);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/stock?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults(POPULAR_STOCKS.filter(s => 
        s.symbol.includes(q.toUpperCase()) || s.name.toUpperCase().includes(q.toUpperCase())
      ));
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => searchStocks(query), 300);
    setSearchTimeout(timeout);
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [query, searchStocks]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search IDX stocks (BBCA, Telkom, Bank...)"
          className="w-full px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-base sm:text-lg pr-20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searching && <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
          <span className="text-[var(--muted)] text-sm">🇮🇩 .JK</span>
        </div>
      </div>

      {query && results.length > 0 && (
        <div className="text-xs text-[var(--muted)]">
          Found {results.length} stocks{searching ? "..." : ""}
        </div>
      )}

      <div className="flex flex-wrap gap-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto p-1">
        {results.map((stock) => (
          <button
            key={stock.symbol}
            onClick={() => {
              onSelect(stock.symbol);
              setQuery("");
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all active:scale-95 ${
              selectedStock === stock.symbol
                ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:text-[var(--foreground)]"
            }`}
          >
            <span className="font-mono font-bold">{stock.symbol}</span>
            <span className="ml-1 text-xs opacity-70 hidden sm:inline">{stock.name}</span>
          </button>
        ))}
      </div>

      {!query && (
        <div className="text-xs text-[var(--muted)]">
          Type to search all 800+ IDX stocks, or tap a stock above
        </div>
      )}

      {query && results.length === 0 && !searching && (
        <div className="text-center py-4 text-[var(--muted)]">
          No stocks found for &quot;{query}&quot;. Try a different search.
        </div>
      )}
    </div>
  );
}
