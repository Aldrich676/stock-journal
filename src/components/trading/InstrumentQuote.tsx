"use client";

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
  data: InstrumentData | null;
  loading: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  commodity: { label: "Commodity", color: "text-yellow-400", icon: "🥇" },
  crypto: { label: "Crypto", color: "text-purple-400", icon: "₿" },
  forex: { label: "Forex", color: "text-blue-400", icon: "💱" },
};

export default function InstrumentQuote({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isPositive = data.change >= 0;
  const cat = CATEGORY_LABELS[data.category] || CATEGORY_LABELS.forex;

  return (
    <div className="space-y-4">
      <div className="p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] glow-border">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{cat.icon}</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono">{data.symbol}</h2>
              <p className="text-xs sm:text-sm text-[var(--muted)]">{data.name}</p>
              <span className={`text-xs ${cat.color}`}>{cat.label}</span>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold font-mono">
              {data.symbol.includes("IDR") ? "Rp" : "$"}{data.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-base sm:text-lg font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
              {isPositive ? "+" : ""}{data.change?.toFixed(data.currentPrice > 100 ? 2 : 4)} ({isPositive ? "+" : ""}{data.changePercent?.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
          <div className="p-3 rounded-xl bg-[var(--background)]">
            <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">Day High</div>
            <div className="font-mono font-semibold text-sm sm:text-base">
              {data.dayHigh?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)]">
            <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">Day Low</div>
            <div className="font-mono font-semibold text-sm sm:text-base">
              {data.dayLow?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)]">
            <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">52W High</div>
            <div className="font-mono font-semibold text-sm sm:text-base">
              {data.fiftyTwoWeekHigh?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--background)]">
            <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">52W Low</div>
            <div className="font-mono font-semibold text-sm sm:text-base">
              {data.fiftyTwoWeekLow?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {data.indicators && (
        <div className="p-4 sm:p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
          <h3 className="text-base sm:text-lg font-bold mb-4">Technical Indicators</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 rounded-xl bg-[var(--background)]">
              <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">RSI (14)</div>
              <div className={`text-lg sm:text-xl font-bold font-mono ${
                data.indicators.rsi > 70 ? "text-red-400" : data.indicators.rsi < 30 ? "text-green-400" : "text-[var(--foreground)]"
              }`}>
                {data.indicators.rsi}
              </div>
              <div className={`text-[10px] sm:text-xs mt-1 ${
                data.indicators.rsiSignal === "overbought" ? "text-red-400" :
                data.indicators.rsiSignal === "oversold" ? "text-green-400" : "text-[var(--muted)]"
              }`}>
                {data.indicators.rsiSignal === "overbought" ? "Overbought" :
                 data.indicators.rsiSignal === "oversold" ? "Oversold" : "Neutral"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--background)]">
              <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">MACD</div>
              <div className={`text-lg sm:text-xl font-bold font-mono ${data.indicators.macd > 0 ? "text-green-400" : "text-red-400"}`}>
                {data.indicators.macd?.toFixed(2)}
              </div>
              <div className={`text-[10px] sm:text-xs mt-1 ${data.indicators.macd > 0 ? "text-green-400" : "text-red-400"}`}>
                {data.indicators.macd > 0 ? "Bullish" : "Bearish"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--background)]">
              <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">SMA 20</div>
              <div className="text-lg sm:text-xl font-bold font-mono">
                {data.indicators.sma20?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-[10px] sm:text-xs mt-1 ${
                data.indicators.smaSignal === "bullish" ? "text-green-400" :
                data.indicators.smaSignal === "bearish" ? "text-red-400" : "text-[var(--muted)]"
              }`}>
                {data.indicators.smaSignal === "bullish" ? "Bullish" :
                 data.indicators.smaSignal === "bearish" ? "Bearish" : "Neutral"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--background)]">
              <div className="text-[10px] sm:text-xs text-[var(--muted)] mb-1">SMA 50</div>
              <div className="text-lg sm:text-xl font-bold font-mono">
                {data.indicators.sma50 ? data.indicators.sma50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
