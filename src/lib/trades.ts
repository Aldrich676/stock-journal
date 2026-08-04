export type Market = "us" | "indonesia";

export interface Trade {
  id: string;
  ticker: string;
  market: Market;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  date: string;
  mood: "confident" | "fearful" | "greedy" | "neutral" | "fomo" | "calm";
  notes: string;
  pnl?: number;
}

export const MARKET_INFO: Record<Market, { name: string; suffix: string; currency: string; examples: string[] }> = {
  us: {
    name: "US Market",
    suffix: "",
    currency: "USD",
    examples: ["AAPL", "TSLA", "NVDA", "AMZN", "GOOGL"],
  },
  indonesia: {
    name: "Indonesia (IDX)",
    suffix: ".JK",
    currency: "IDR",
    examples: ["BBCA", "TLKM", "ASII", "BMRI", "BBRI"],
  },
};

const STORAGE_KEY = "stock-journal-trades";

export function getTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTrades(trades: Trade[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function addTrade(trade: Omit<Trade, "id" | "pnl">): Trade {
  const trades = getTrades();
  const marketInfo = MARKET_INFO[trade.market];
  const fullTicker = trade.market === "indonesia" && !trade.ticker.endsWith(".JK")
    ? `${trade.ticker}${marketInfo.suffix}`
    : trade.ticker;

  const newTrade: Trade = {
    ...trade,
    ticker: fullTicker,
    id: crypto.randomUUID(),
    pnl: trade.type === "sell" ? (trade.price - (findBuyPrice(trades, fullTicker) || trade.price)) * trade.quantity : undefined,
  };
  trades.push(newTrade);
  saveTrades(trades);
  return newTrade;
}

export function updateTrade(id: string, updates: Partial<Trade>): void {
  const trades = getTrades();
  const index = trades.findIndex((t) => t.id === id);
  if (index !== -1) {
    trades[index] = { ...trades[index], ...updates };
    saveTrades(trades);
  }
}

export function deleteTrade(id: string): void {
  const trades = getTrades().filter((t) => t.id !== id);
  saveTrades(trades);
}

function findBuyPrice(trades: Trade[], ticker: string): number | undefined {
  const lastBuy = trades
    .filter((t) => t.ticker === ticker && t.type === "buy")
    .pop();
  return lastBuy?.price;
}

export interface PortfolioStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  avgPnl: number;
  byMood: Record<string, { count: number; avgPnl: number }>;
  byMarket: Record<Market, { count: number; pnl: number }>;
}

export function calculateStats(trades: Trade[]): PortfolioStats {
  const closedTrades = trades.filter((t) => t.pnl !== undefined);
  const wins = closedTrades.filter((t) => (t.pnl || 0) > 0);
  const pnls = closedTrades.map((t) => t.pnl || 0);

  const byMood: Record<string, { count: number; totalPnl: number }> = {};
  for (const t of closedTrades) {
    if (!byMood[t.mood]) byMood[t.mood] = { count: 0, totalPnl: 0 };
    byMood[t.mood].count++;
    byMood[t.mood].totalPnl += t.pnl || 0;
  }

  const byMarket: Record<Market, { count: number; pnl: number }> = {
    us: { count: 0, pnl: 0 },
    indonesia: { count: 0, pnl: 0 },
  };
  for (const t of closedTrades) {
    byMarket[t.market].count++;
    byMarket[t.market].pnl += t.pnl || 0;
  }

  return {
    totalTrades: trades.length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalPnl: pnls.reduce((a, b) => a + b, 0),
    bestTrade: closedTrades.length > 0 ? closedTrades.reduce((a, b) => (a.pnl || 0) > (b.pnl || 0) ? a : b) : null,
    worstTrade: closedTrades.length > 0 ? closedTrades.reduce((a, b) => (a.pnl || 0) < (b.pnl || 0) ? a : b) : null,
    avgPnl: pnls.length > 0 ? pnls.reduce((a, b) => a + b, 0) / pnls.length : 0,
    byMood: Object.fromEntries(
      Object.entries(byMood).map(([mood, data]) => [
        mood,
        { count: data.count, avgPnl: data.totalPnl / data.count },
      ])
    ),
    byMarket,
  };
}
