"use client";

import { useState } from "react";
import StockSearch from "@/components/assistant/StockSearch";
import StockQuote from "@/components/assistant/StockQuote";
import AIAnalysis from "@/components/assistant/AIAnalysis";
import StockScanner from "@/components/assistant/StockScanner";

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

export default function StocksAssistantPage() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelectStock = async (symbol: string) => {
    setSelectedStock(symbol);
    setLoading(true);
    setError("");
    setStockData(null);
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setStockData(data);
    } catch {
      setError("Failed to fetch stock data. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Indonesian Stocks</h1>
        <p className="text-[var(--muted)] text-base sm:text-lg">AI-powered analysis for IDX/BEI stocks</p>
      </div>

      <div className="animate-fade-in-delay">
        <StockScanner onSelectStock={handleSelectStock} />
      </div>

      <div className="animate-fade-in-delay">
        <StockSearch onSelect={handleSelectStock} selectedStock={selectedStock} />
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 animate-fade-in-delay text-sm">
          {error}
        </div>
      )}

      <div className="animate-fade-in-delay">
        <StockQuote data={stockData} loading={loading} />
      </div>

      <div className="animate-fade-in-delay-2">
        <AIAnalysis stockData={stockData} />
      </div>

      <div className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-xs text-[var(--muted)] space-y-1">
        <p><strong>Disclaimer:</strong> This analysis is for educational purposes only. Not financial advice.</p>
        <p>IDX trading hours: 09:00-16:00 WIB. T+2 settlement. 1 lot = 100 shares.</p>
      </div>
    </div>
  );
}
