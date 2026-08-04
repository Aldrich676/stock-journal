"use client";

import { useState, useEffect } from "react";

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  name: string;
  login: number;
  server: string;
}

interface Position {
  id: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
}

interface Props {
  accountId: string;
}

export default function MT5AccountInfo({ accountId }: Props) {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [infoRes, posRes] = await Promise.all([
        fetch("/api/mt5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getAccountInfo", accountId }),
        }),
        fetch("/api/mt5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getPositions", accountId }),
        }),
      ]);

      const info = await infoRes.json();
      const pos = await posRes.json();

      if (info.error) setError(info.error);
      else setAccountInfo(info);

      if (!pos.error) setPositions(Array.isArray(pos) ? pos : []);
    } catch {
      setError("Failed to fetch account data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [accountId]);

  if (loading && !accountInfo) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--muted)]">Loading account data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!accountInfo) return null;

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Account: {accountInfo.login}</h3>
          <button
            onClick={fetchData}
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
            <div className="text-xs text-[var(--muted)] mb-1">Balance</div>
            <div className="font-bold text-lg">{accountInfo.balance?.toLocaleString()} {accountInfo.currency}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
            <div className="text-xs text-[var(--muted)] mb-1">Equity</div>
            <div className="font-bold text-lg">{accountInfo.equity?.toLocaleString()} {accountInfo.currency}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
            <div className="text-xs text-[var(--muted)] mb-1">Margin</div>
            <div className="font-bold text-lg">{accountInfo.margin?.toLocaleString()} {accountInfo.currency}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
            <div className="text-xs text-[var(--muted)] mb-1">Free Margin</div>
            <div className="font-bold text-lg">{accountInfo.freeMargin?.toLocaleString()} {accountInfo.currency}</div>
          </div>
        </div>
      </div>

      {positions.length > 0 && (
        <div className="p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
          <h3 className="font-bold text-lg mb-4">Open Positions ({positions.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] border-b border-[var(--card-border)]">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Volume</th>
                  <th className="text-right py-2">Open</th>
                  <th className="text-right py-2">Current</th>
                  <th className="text-right py-2">P/L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id} className="border-b border-[var(--card-border)]">
                    <td className="py-2 font-medium">{pos.symbol}</td>
                    <td className={`py-2 ${pos.type === "POSITION_TYPE_BUY" ? "text-green-400" : "text-red-400"}`}>
                      {pos.type === "POSITION_TYPE_BUY" ? "BUY" : "SELL"}
                    </td>
                    <td className="py-2 text-right">{pos.volume}</td>
                    <td className="py-2 text-right">{pos.openPrice}</td>
                    <td className="py-2 text-right">{pos.currentPrice}</td>
                    <td className={`py-2 text-right font-medium ${pos.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pos.profit >= 0 ? "+" : ""}{pos.profit?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
