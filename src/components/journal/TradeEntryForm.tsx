"use client";

import { useState } from "react";
import { addTrade, updateTrade, type Trade, type Market, MARKET_INFO } from "@/lib/trades";

interface Props {
  onTradeAdded: (trade: Trade) => void;
  editTrade?: Trade;
  onEditDone?: () => void;
}

const MOODS: { value: Trade["mood"]; label: string; emoji: string }[] = [
  { value: "confident", label: "Confident", emoji: "😎" },
  { value: "fearful", label: "Fearful", emoji: "😰" },
  { value: "greedy", label: "Greedy", emoji: "🤑" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "fomo", label: "FOMO", emoji: "😫" },
  { value: "calm", label: "Calm", emoji: "😌" },
];

export default function TradeEntryForm({ onTradeAdded, editTrade, onEditDone }: Props) {
  const [market, setMarket] = useState<Market>(editTrade?.market || "us");
  const [ticker, setTicker] = useState(editTrade?.ticker?.replace(".JK", "") || "");
  const [type, setType] = useState<"buy" | "sell">(editTrade?.type || "buy");
  const [price, setPrice] = useState(editTrade?.price?.toString() || "");
  const [quantity, setQuantity] = useState(editTrade?.quantity?.toString() || "");
  const [date, setDate] = useState(editTrade?.date || new Date().toISOString().split("T")[0]);
  const [mood, setMood] = useState<Trade["mood"]>(editTrade?.mood || "neutral");
  const [notes, setNotes] = useState(editTrade?.notes || "");

  const marketInfo = MARKET_INFO[market];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !price || !quantity) return;

    if (editTrade) {
      updateTrade(editTrade.id, {
        ticker: ticker.toUpperCase(),
        market,
        type,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        date,
        mood,
        notes,
      });
      onEditDone?.();
    } else {
      const trade = addTrade({
        ticker: ticker.toUpperCase(),
        market,
        type,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        date,
        mood,
        notes,
      });
      onTradeAdded(trade);
    }

    setTicker("");
    setPrice("");
    setQuantity("");
    setNotes("");
    setMood("neutral");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <h3 className="text-xl font-bold">{editTrade ? "Edit Trade" : "New Trade"}</h3>

      <div>
        <label className="block text-sm font-medium mb-2 text-[var(--muted)]">Market</label>
        <div className="flex gap-3">
          {(Object.keys(MARKET_INFO) as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMarket(m); setTicker(""); }}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                market === m
                  ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
              }`}
            >
              {m === "us" ? "🇺🇸" : "🇮🇩"} {MARKET_INFO[m].name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">
            Ticker {market === "indonesia" && <span className="text-xs">(e.g. BBCA, TLKM)</span>}
          </label>
          <div className="flex">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder={marketInfo.examples[0]}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-lg"
              required
            />
            {market === "indonesia" && (
              <span className="ml-2 px-3 py-2.5 rounded-xl bg-[var(--card-border)] text-[var(--muted)] font-mono text-lg">.JK</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {marketInfo.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setTicker(ex)}
                className="px-2 py-0.5 rounded text-xs bg-[var(--background)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={`flex-1 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                type === "buy"
                  ? "bg-green-500/20 border-green-500 text-green-400"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:border-green-500/50"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={`flex-1 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                type === "sell"
                  ? "bg-red-500/20 border-red-500 text-red-400"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:border-red-500/50"
              }`}
            >
              Sell
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">
            Price ({marketInfo.currency})
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={market === "indonesia" ? "5000" : "0.00"}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Quantity (Lot)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={market === "indonesia" ? "10 lot (1000 shares)" : "100"}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono"
            required
          />
          {market === "indonesia" && (
            <p className="text-xs text-[var(--muted)] mt-1">1 lot = 100 shares on IDX</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-[var(--muted)]">Mood</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                mood === m.value
                  ? "bg-[var(--accent)]/20 border-[var(--accent)] text-[var(--accent)]"
                  : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)]/50"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why did you take this trade? What was your thesis?"
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          {editTrade ? "Update Trade" : "Add Trade"}
        </button>
        {editTrade && (
          <button
            type="button"
            onClick={onEditDone}
            className="px-6 py-3 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
