"use client";

import { useState, useEffect } from "react";
import InstrumentSearch from "@/components/trading/InstrumentSearch";
import InstrumentQuote from "@/components/trading/InstrumentQuote";
import TradingAIAnalysis from "@/components/trading/TradingAIAnalysis";
import MT5Connect from "@/components/trading/MT5Connect";
import MT5AccountInfo from "@/components/trading/MT5AccountInfo";

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

export default function TradingAssistantPage() {
  const [instrumentData, setInstrumentData] = useState<InstrumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mt5Connected, setMt5Connected] = useState(false);
  const [showMT5, setShowMT5] = useState(false);
  const [mt5AccountId, setMt5AccountId] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mt5_account");
    if (saved) {
      setMt5Connected(true);
      setMt5AccountId(saved);
    }
  }, []);

  const handleSelect = async (symbol: string) => {
    setSelectedInstrument(symbol);
    setLoading(true);
    setError("");
    setInstrumentData(null);
    try {
      const res = await fetch(`/api/forex?symbol=${symbol}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setInstrumentData(data);
    } catch {
      setError("Failed to fetch data. Please try again.");
    }
    setLoading(false);
  };

  const handleMT5Connected = (accountId: string) => {
    setMt5Connected(true);
    setMt5AccountId(accountId);
    setShowMT5(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Trading Assistant</h1>
          <p className="text-[var(--muted)] text-base sm:text-lg">AI-powered analysis for Forex, Commodities, and Crypto</p>
        </div>
        <button
          onClick={() => setShowMT5(!showMT5)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
            mt5Connected
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]"
          }`}
        >
          {mt5Connected ? "🟢 HFM Connected" : "🔗 Connect HFM MT5"}
        </button>
      </div>

      {showMT5 && (
        <div className="animate-fade-in">
          <MT5Connect onConnected={handleMT5Connected} />
        </div>
      )}

      {mt5Connected && !showMT5 && (
        <div className="animate-fade-in">
          <MT5AccountInfo accountId={mt5AccountId} />
        </div>
      )}

      <div className="animate-fade-in-delay">
        <InstrumentSearch onSelect={handleSelect} selectedInstrument={selectedInstrument} />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-fade-in-delay text-sm">
          {error}
        </div>
      )}

      <div className="animate-fade-in-delay">
        <InstrumentQuote data={instrumentData} loading={loading} />
      </div>

      <div className="animate-fade-in-delay-2">
        <TradingAIAnalysis instrumentData={instrumentData} />
      </div>

      <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--muted)] space-y-1">
        <p><strong>Disclaimer:</strong> This analysis is for educational purposes only. Not financial advice.</p>
        <p>Data source: {mt5Connected ? "HFM MT5 (real-time)" : "Yahoo Finance (delayed 15-20 min)"}. Forex: 24/5 | Crypto: 24/7 | Commodities: varies.</p>
      </div>
    </div>
  );
}
