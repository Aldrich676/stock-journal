import { NextResponse } from "next/server";

const IDX_STOCKS = [
  "BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII", "UNVR", "HMSP", "GGRM",
  "KLBF", "ICBP", "INDF", "TOWR", "EXCL", "ISAT", "ADRO", "PTBA", "ITMG",
  "ANTM", "MDKA", "INCO", "TINS", "MDKA", "BSSR", "HRUM", "PWON", "CTRA",
  "BSDE", "SMRA", "PWON", "PANI", "JSMR", "WASKITA", "WSKT", "PTPP", "ADHI",
  "WIKA", "SMGR", "INTP", "TPIA", "BRPT", "TKIM", "TAPP", "BRMS", "BUMI",
  "PTBA", "BIRD", "GOTO", "BUKA", "EMTK", "DCII", "BEEN", "LPPF", "MAPI",
  "RALS", "ERAA", "AURO", "SRTG", "BGTG", "BTPS", "NISP", "MEGA", "BDMN",
  "PNBN", "BBYB", "BNGA", "ARTO", "BBHI", "BGTG", "MAGR", "BBSS", "INMF",
  "AMRT", "ACES", "MAPI", "LPPF", "RALS", "ERAA", "ASGR", "AUTO", "SMSM",
  "DSNG", "SSMS", "LSIP", "AALI", "SSIA", "SMAR", "BRMS", "INDF", "MYOR",
  "KLBF", "SIDO", "HMSP", "GGRM", "CPIN", "GOOD", "HEAL", "MIKA", "TBIG",
  "TOWR", "MTEL", "EXCL", "ISAT", "FREN", "TBIG", "MTEL", "ADTN", "TBIG",
];

const UNIQUE_STOCKS = [...new Set(IDX_STOCKS)];

async function fetchStockData(symbol: string): Promise<{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  rsi: number;
  macd: number;
  sma20: number;
  sma50: number | null;
  smaSignal: string;
  rsiSignal: string;
  score: number;
  signals: string[];
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.JK?interval=1d&range=3mo`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close?.filter((c: number | null) => c !== null) || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    const meta = result.meta;

    if (closes.length < 26) return null;

    const price = meta.regularMarketPrice || closes[closes.length - 1];
    const prevClose = closes[closes.length - 2] || price;
    const change = price - prevClose;
    const changePercent = (change / prevClose) * 100;
    const volume = meta.regularMarketVolume || volumes[volumes.length - 1] || 0;

    const calcSMA = (data: number[], period: number) => {
      if (data.length < period) return null;
      return data.slice(-period).reduce((a, b) => a + b, 0) / period;
    };

    const calcRSI = (data: number[], period = 14) => {
      if (data.length < period + 1) return 50;
      const changes = [];
      for (let i = 1; i < data.length; i++) changes.push(data[i] - data[i - 1]);
      const recent = changes.slice(-period);
      const gains = recent.filter(c => c > 0);
      const losses = recent.filter(c => c < 0).map(c => Math.abs(c));
      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0.001;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    };

    const sma20 = calcSMA(closes, 20);
    const sma50 = calcSMA(closes, 50);
    const rsi = calcRSI(closes);

    const ema12 = calcSMA(closes.slice(-12), 12);
    const ema26 = calcSMA(closes.slice(-26), 26);
    const macd = (ema12 || 0) - (ema26 || 0);

    const smaSignal = sma20 && sma50 ? (sma20 > sma50 ? "bullish" : "bearish") : "neutral";
    const rsiSignal = rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral";

    let score = 0;
    const signals: string[] = [];

    if (rsi < 25) { score += 30; signals.push(`RSI OVERSOLD (${rsi.toFixed(0)})`); }
    else if (rsi < 30) { score += 20; signals.push(`RSI near oversold (${rsi.toFixed(0)})`); }
    else if (rsi > 75) { score -= 20; signals.push(`RSI overbought (${rsi.toFixed(0)})`); }
    else if (rsi > 70) { score -= 15; signals.push(`RSI elevated (${rsi.toFixed(0)})`); }

    if (macd > 0 && closes.length > 2) {
      const prevMacd = (calcSMA(closes.slice(0, -1), 12) || 0) - (calcSMA(closes.slice(0, -1), 26) || 0);
      if (prevMacd <= 0) { score += 25; signals.push("MACD BULLISH CROSSOVER"); }
      else { score += 10; signals.push("MACD positive"); }
    } else if (macd < 0) {
      score -= 10;
    }

    if (smaSignal === "bullish") { score += 20; signals.push("ABOVE SMA20 (uptrend)"); }
    else if (smaSignal === "bearish") { score -= 10; }

    const avgVolume = volumes.slice(-20).reduce((a: number, b: number) => a + (b || 0), 0) / 20;
    if (avgVolume > 0 && volume > avgVolume * 2) { score += 15; signals.push(`VOLUME SPIKE (+${((volume / avgVolume - 1) * 100).toFixed(0)}%)`); }

    if (changePercent > 1) { score += 10; }
    else if (changePercent < -2) { score -= 5; }

    const name = symbol;
    return {
      symbol, name, price, change, changePercent, volume,
      rsi, macd, sma20: sma20 || price, sma50, smaSignal, rsiSignal,
      score: Math.max(-100, Math.min(100, score)),
      signals,
    };
  } catch {
    return null;
  }
}

const scanCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET() {
  const cacheKey = "idx_scan";
  const cached = scanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  const batchSize = 10;
  const results: Awaited<ReturnType<typeof fetchStockData>>[] = [];

  for (let i = 0; i < UNIQUE_STOCKS.length; i += batchSize) {
    const batch = UNIQUE_STOCKS.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(s => fetchStockData(s)));
    results.push(...batchResults);
  }

  const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

  validResults.sort((a, b) => b.score - a.score);

  const response = {
    scanned: validResults.length,
    timestamp: new Date().toISOString(),
    bullish: validResults.filter(r => r.score > 20).slice(0, 15),
    bearish: validResults.filter(r => r.score < -20).slice(-5).reverse(),
    all: validResults.slice(0, 50),
  };

  scanCache.set(cacheKey, { data: response, timestamp: Date.now() });

  return NextResponse.json(response);
}
