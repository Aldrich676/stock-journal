"use client";

import { useState } from "react";

interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  priceHistory: { date: string; close: number; volume: number }[];
  indicators: {
    sma20: number;
    sma50: number | null;
    ema12: number;
    ema26: number;
    macd: number;
    rsi: number;
    smaSignal: string;
    rsiSignal: string;
  };
}

interface Props {
  stockData: StockData | null;
}

export default function AIAnalysis({ stockData }: Props) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const analyze = async (prompt: string) => {
    if (!stockData) return;
    setLoading(true);
    setAnalysis("");

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockData,
          indicators: stockData.indicators,
          question: prompt,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || "No analysis generated.");
    } catch {
      setAnalysis("Failed to get analysis. Make sure ANTHROPIC_API_KEY is set in .env.local");
    }
    setLoading(false);
  };

  const presets = [
    { label: "Buy Signal?", icon: "📈", prompt: "Should I BUY this stock? Show when to buy, when to sell, and when to take profit." },
    { label: "Full Analysis", icon: "🎯", prompt: "Provide full analysis: buy/sell levels, support/resistance, risk assessment." },
    { label: "Risk Check", icon: "⚠️", prompt: "What are the risks? Max position size and stop loss level." },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold">AI Trading Assistant</h3>
        <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">Claude AI</span>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => analyze(p.prompt)}
            disabled={loading || !stockData}
            className="px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-full text-sm font-medium border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start gap-1.5"
          >
            <span className="text-base">{p.icon}</span>
            <span className="hidden sm:inline">{p.label}</span>
            <span className="sm:hidden text-xs">{p.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={stockData ? `Ask about ${stockData.symbol}...` : "Select a stock first..."}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm sm:text-base"
          disabled={!stockData}
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && stockData) {
              analyze(question);
              setQuestion("");
            }
          }}
        />
        <button
          onClick={() => {
            if (question.trim() && stockData) {
              analyze(question);
              setQuestion("");
            }
          }}
          disabled={loading || !question.trim() || !stockData}
          className="px-4 sm:px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shrink-0"
        >
          Ask
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--muted)] p-4 rounded-xl bg-[var(--background)]">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm">Analyzing {stockData?.symbol}...</span>
        </div>
      )}

      {analysis && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto">
          {analysis}
        </div>
      )}

      {!stockData && !loading && (
        <div className="text-center py-8 rounded-xl border border-dashed border-[var(--card-border)]">
          <div className="text-3xl mb-2">🇮🇩</div>
          <p className="text-[var(--muted)] text-sm">Select an IDX stock above to get AI trading analysis.</p>
        </div>
      )}
    </div>
  );
}
