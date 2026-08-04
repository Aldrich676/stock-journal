"use client";

import { useState } from "react";
import { type Trade, type Market, deleteTrade } from "@/lib/trades";

interface Props {
  trades: Trade[];
  onTradeDeleted: (id: string) => void;
  onEditTrade: (trade: Trade) => void;
}

const MOOD_EMOJI: Record<string, string> = {
  confident: "😎",
  fearful: "😰",
  greedy: "🤑",
  neutral: "😐",
  fomo: "😫",
  calm: "😌",
};

export default function TradeLog({ trades, onTradeDeleted, onEditTrade }: Props) {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const [marketFilter, setMarketFilter] = useState<"all" | Market>("all");
  const [sortBy, setSortBy] = useState<"date" | "pnl">("date");

  const filtered = trades
    .filter((t) => filter === "all" || t.type === filter)
    .filter((t) => marketFilter === "all" || t.market === marketFilter)
    .sort((a, b) => {
      if (sortBy === "pnl") return (b.pnl || 0) - (a.pnl || 0);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleDelete = (id: string) => {
    deleteTrade(id);
    onTradeDeleted(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-bold">Trade Log</h3>
        <div className="flex gap-2 flex-wrap">
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value as typeof marketFilter)}
            className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          >
            <option value="all">All Markets</option>
            <option value="us">🇺🇸 US</option>
            <option value="indonesia">🇮🇩 Indonesia</option>
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          >
            <option value="all">All Types</option>
            <option value="buy">Buys</option>
            <option value="sell">Sells</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          >
            <option value="date">Date</option>
            <option value="pnl">P&L</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--card-border)]">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-[var(--muted)]">No trades yet. Add your first trade above!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="min-w-[80px]">
                  <span className="font-bold text-lg font-mono">{trade.ticker}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                      trade.type === "buy"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trade.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-lg">{trade.market === "us" ? "🇺🇸" : "🇮🇩"}</div>
                <div className="text-sm text-[var(--muted)] font-mono">
                  {trade.quantity} @ {trade.market === "indonesia" ? "Rp" : "$"}{trade.price.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--muted)]">{trade.date}</div>
                <div className="text-lg">{MOOD_EMOJI[trade.mood]}</div>
                {trade.notes && (
                  <div className="text-xs text-[var(--muted)] max-w-[200px] truncate hidden md:block">
                    {trade.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {trade.pnl !== undefined && (
                  <span
                    className={`font-mono font-bold text-sm ${
                      trade.pnl > 0 ? "text-green-400" : trade.pnl < 0 ? "text-red-400" : "text-[var(--muted)]"
                    }`}
                  >
                    {trade.pnl > 0 ? "+" : ""}{trade.market === "indonesia" ? "Rp" : "$"}{trade.pnl.toLocaleString()}
                  </span>
                )}
                <button
                  onClick={() => onEditTrade(trade)}
                  className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(trade.id)}
                  className="text-[var(--muted)] hover:text-red-400 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
