"use client";

import { useState } from "react";

interface InstrumentData {
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
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
  instrumentData: InstrumentData | null;
}

export default function TradingAIAnalysis({ instrumentData }: Props) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const analyze = async (prompt: string) => {
    if (!instrumentData) return;
    setLoading(true);
    setAnalysis("");
    try {
      const res = await fetch("/api/trading-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrumentData, indicators: instrumentData.indicators, question: prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setAnalysis("Error: " + data.error);
      } else {
        setAnalysis(data.analysis || "No analysis generated.");
      }
    } catch (e) {
      setAnalysis("Failed to get analysis: " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  };

  const presets = [
    { label: "Full Analysis", icon: "🎯", prompt: "Provide a comprehensive trading analysis with full breakdown." },
    { label: "Buy/Long?", icon: "📈", prompt: "Is this a good time to BUY or GO LONG? Show entry, SL, and TP levels." },
    { label: "Sell/Short?", icon: "📉", prompt: "Is this a good time to SELL or GO SHORT? Show entry, SL, and TP levels." },
    { label: "Risk Check", icon: "⚠️", prompt: "What are the risks? Assess volatility and position sizing." },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-bold">AI Trading Analysis</h3>
        <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">Claude AI</span>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => analyze(p.prompt)}
            disabled={loading || !instrumentData}
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
          placeholder={instrumentData ? `Ask about ${instrumentData.symbol}...` : "Select an instrument first..."}
          className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm sm:text-base"
          disabled={!instrumentData}
          onKeyDown={(e) => { if (e.key === "Enter" && question.trim() && instrumentData) { analyze(question); setQuestion(""); } }}
        />
        <button
          onClick={() => { if (question.trim() && instrumentData) { analyze(question); setQuestion(""); } }}
          disabled={loading || !question.trim() || !instrumentData}
          className="px-4 sm:px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shrink-0"
        >
          Ask
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--muted)] p-4 rounded-xl bg-[var(--background)]">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm">Analyzing {instrumentData?.symbol}...</span>
        </div>
      )}

      {analysis && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] whitespace-pre-wrap text-sm leading-relaxed overflow-x-auto font-mono">
          {analysis}
        </div>
      )}

      {!instrumentData && !loading && (
        <div className="text-center py-8 rounded-xl border border-dashed border-[var(--card-border)]">
          <div className="text-3xl mb-2">💹</div>
          <p className="text-[var(--muted)] text-sm">Select an instrument above to get AI trading analysis.</p>
        </div>
      )}
    </div>
  );
}
