"use client";

import { useState, useEffect, useCallback } from "react";

interface ScannedStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  rsi: number;
  macd: number;
  sma20: number;
  smaSignal: string;
  score: number;
  signals: string[];
}

interface ScanResult {
  scanned: number;
  timestamp: string;
  bullish: ScannedStock[];
  bearish: ScannedStock[];
  all: ScannedStock[];
}

interface Props {
  onSelectStock: (symbol: string) => void;
}

export default function StockScanner({ onSelectStock }: Props) {
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [lastScan, setLastScan] = useState("");

  const scan = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scanner");
      const result = await res.json();
      if (result.error) setError(result.error);
      else {
        setData(result);
        setLastScan(new Date().toLocaleTimeString());
      }
    } catch {
      setError("Failed to scan. Try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    scan();
    const interval = setInterval(scan, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [scan]);

  const formatVolume = (v: number) => {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
    return v.toString();
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-bold">Early Bird Scanner</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold">
            IDX
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastScan && (
            <span className="text-xs text-[var(--muted)]">Last: {lastScan}</span>
          )}
          <button
            onClick={scan}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center gap-3 text-[var(--muted)] py-8">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Scanning {data?.scanned || "100+"} IDX stocks...</span>
        </div>
      )}

      {data && (
        <>
          {data.bullish.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-lg">Signal</span>
                <span className="text-sm font-semibold text-green-400">
                  {data.bullish.length} stocks with bullish signals
                </span>
              </div>

              <div className="space-y-2">
                {data.bullish.slice(0, expanded ? 15 : 5).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="w-full p-3 sm:p-4 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{stock.symbol}</span>
                        <span className={`text-sm font-medium ${stock.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          Rp{stock.price.toLocaleString()} ({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          stock.score >= 50 ? "bg-green-500/30 text-green-400" :
                          stock.score >= 30 ? "bg-green-500/20 text-green-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {stock.score}/100
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {stock.signals.map((signal, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--background)] text-[var(--muted)] border border-[var(--card-border)]"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-[10px] text-[var(--muted)]">
                      <span>RSI: {stock.rsi.toFixed(0)}</span>
                      <span>MACD: {stock.macd > 0 ? "Bull" : "Bear"}</span>
                      <span>Trend: {stock.smaSignal}</span>
                      <span>Vol: {formatVolume(stock.volume)}</span>
                    </div>
                  </button>
                ))}
              </div>

              {data.bullish.length > 5 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-full py-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                >
                  {expanded ? "Show less" : `Show all ${data.bullish.length} signals`}
                </button>
              )}
            </div>
          )}

          {data.bullish.length === 0 && !loading && (
            <div className="text-center py-6 text-[var(--muted)] text-sm">
              No strong bullish signals right now. Check again later.
            </div>
          )}

          <div className="pt-3 border-t border-[var(--card-border)]">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Scanned {data.scanned} stocks</span>
              <span>{data.bullish.length} bullish | {data.bearish.length} bearish</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
