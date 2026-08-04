"use client";

import { type PortfolioStats } from "@/lib/trades";

interface Props {
  stats: PortfolioStats;
}

const MOOD_LABELS: Record<string, string> = {
  confident: "Confident",
  fearful: "Fearful",
  greedy: "Greedy",
  neutral: "Neutral",
  fomo: "FOMO",
  calm: "Calm",
};

export default function PortfolioDashboard({ stats }: Props) {
  const cards = [
    { label: "Total Trades", value: stats.totalTrades.toString(), icon: "📈" },
    { label: "Win Rate", value: `${stats.winRate.toFixed(1)}%`, icon: "🎯" },
    {
      label: "Total P&L",
      value: `${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "💰",
      color: stats.totalPnl > 0 ? "text-green-400" : stats.totalPnl < 0 ? "text-red-400" : "",
    },
    {
      label: "Avg P&L",
      value: `${stats.avgPnl >= 0 ? "+" : ""}$${stats.avgPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "📊",
      color: stats.avgPnl > 0 ? "text-green-400" : stats.avgPnl < 0 ? "text-red-400" : "",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Portfolio Overview</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] text-center glow-border">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm text-[var(--muted)] mb-1">{card.label}</div>
            <div className={`text-2xl font-bold font-mono ${card.color || "text-[var(--foreground)]"}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.byMarket.us.count > 0 && (
          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🇺🇸</span>
              <span className="font-semibold">US Market</span>
              <span className="text-xs text-[var(--muted)]">({stats.byMarket.us.count} trades)</span>
            </div>
            <div className={`text-xl font-bold font-mono ${stats.byMarket.us.pnl > 0 ? "text-green-400" : stats.byMarket.us.pnl < 0 ? "text-red-400" : ""}`}>
              {stats.byMarket.us.pnl >= 0 ? "+" : ""}${stats.byMarket.us.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
        {stats.byMarket.indonesia.count > 0 && (
          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🇮🇩</span>
              <span className="font-semibold">Indonesia (IDX)</span>
              <span className="text-xs text-[var(--muted)]">({stats.byMarket.indonesia.count} trades)</span>
            </div>
            <div className={`text-xl font-bold font-mono ${stats.byMarket.indonesia.pnl > 0 ? "text-green-400" : stats.byMarket.indonesia.pnl < 0 ? "text-red-400" : ""}`}>
              {stats.byMarket.indonesia.pnl >= 0 ? "+" : ""}Rp{stats.byMarket.indonesia.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>

      {(stats.bestTrade || stats.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.bestTrade && (
            <div className="p-5 rounded-2xl border border-green-500/30 bg-green-500/10">
              <div className="text-sm text-green-400 font-semibold mb-2">🏆 Best Trade</div>
              <div className="font-bold text-lg font-mono">{stats.bestTrade.ticker}</div>
              <div className="text-sm text-[var(--muted)]">
                {stats.bestTrade.quantity} @ {stats.bestTrade.market === "indonesia" ? "Rp" : "$"}{stats.bestTrade.price.toLocaleString()} on {stats.bestTrade.date}
              </div>
              <div className="text-green-400 font-bold font-mono mt-1">+{stats.bestTrade.market === "indonesia" ? "Rp" : "$"}{(stats.bestTrade.pnl || 0).toLocaleString()}</div>
            </div>
          )}
          {stats.worstTrade && (
            <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10">
              <div className="text-sm text-red-400 font-semibold mb-2">📉 Worst Trade</div>
              <div className="font-bold text-lg font-mono">{stats.worstTrade.ticker}</div>
              <div className="text-sm text-[var(--muted)]">
                {stats.worstTrade.quantity} @ {stats.worstTrade.market === "indonesia" ? "Rp" : "$"}{stats.worstTrade.price.toLocaleString()} on {stats.worstTrade.date}
              </div>
              <div className="text-red-400 font-bold font-mono mt-1">{stats.worstTrade.market === "indonesia" ? "Rp" : "$"}{(stats.worstTrade.pnl || 0).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {Object.keys(stats.byMood).length > 0 && (
        <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
          <div className="text-sm text-[var(--muted)] font-semibold mb-3 uppercase tracking-wide">Performance by Mood</div>
          <div className="space-y-3">
            {Object.entries(stats.byMood).map(([mood, data]) => (
              <div key={mood} className="flex items-center justify-between">
                <span className="text-sm font-medium">{MOOD_LABELS[mood] || mood} ({data.count} trades)</span>
                <span
                  className={`font-mono font-bold ${
                    data.avgPnl > 0 ? "text-green-400" : data.avgPnl < 0 ? "text-red-400" : ""
                  }`}
                >
                  {data.avgPnl >= 0 ? "+" : ""}${data.avgPnl.toFixed(2)} avg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
