import { NextResponse } from "next/server";

const POPULAR_IDX = [
  { symbol: "BBCA", name: "Bank Central Asia" },
  { symbol: "BBRI", name: "Bank Rakyat Indonesia" },
  { symbol: "BMRI", name: "Bank Mandiri" },
  { symbol: "TLKM", name: "Telkom Indonesia" },
  { symbol: "ASII", name: "Astra International" },
  { symbol: "UNVR", name: "Unilever Indonesia" },
  { symbol: "HMSP", name: "HM Sampoerna" },
  { symbol: "GGRM", name: "Gudang Garam" },
  { symbol: "ADRO", name: "Adaro Energy" },
  { symbol: "PTBA", name: "Bukit Asam" },
  { symbol: "ITMG", name: "Indo Tambangraya Megah" },
  { symbol: "SMGR", name: "Semen Indonesia" },
  { symbol: "MDKA", name: "Merdeka Copper Gold" },
  { symbol: "EMTK", name: "Elang Mahkota Teknologi" },
  { symbol: "GOTO", name: "GoTo Gojek Tokopedia" },
  { symbol: "BUKA", name: "Bukalapak" },
  { symbol: "EXCL", name: "XL Axiata" },
  { symbol: "ISAT", name: "Indosat Ooredoo" },
  { symbol: "BSDE", name: "BSD City" },
  { symbol: "CPIN", name: "Charoen Pokphand" },
];

async function searchYahoo(query: string) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.quotes || [])
    .filter((q: { symbol: string; exchange: string; quoteType: string }) => 
      q.exchange === "JKT" && q.quoteType === "EQUITY"
    )
    .map((q: { symbol: string; shortname: string; longname: string }) => ({
      symbol: q.symbol.replace(".JK", ""),
      name: q.longname || q.shortname || q.symbol.replace(".JK", ""),
    }));
}

async function fetchYahooQuote(symbol: string) {
  const ticker = `${symbol}.JK`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1mo`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  const result = data.chart.result[0];
  const meta = result.meta;
  const quotes = result.indicators.quote[0];
  const timestamps = result.timestamp;

  const closes: number[] = quotes.close.filter((c: number | null) => c !== null);
  const highs: number[] = quotes.high.filter((h: number | null) => h !== null);
  const lows: number[] = quotes.low.filter((l: number | null) => l !== null);
  const volumes: number[] = quotes.volume.filter((v: number | null) => v !== null);

  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose || closes[closes.length - 2];
  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  const priceHistory = timestamps.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString().split("T")[0],
    open: quotes.open[i],
    high: highs[i],
    low: lows[i],
    close: closes[i],
    volume: volumes[i],
  })).filter((p: { close: number | null }) => p.close !== null);

  return {
    symbol,
    name: POPULAR_IDX.find((s) => s.symbol === symbol)?.name || symbol,
    currency: "IDR",
    currentPrice,
    previousClose,
    change,
    changePercent,
    dayHigh: meta.regularMarketDayHigh || Math.max(...highs),
    dayLow: meta.regularMarketDayLow || Math.min(...lows),
    volume: meta.regularMarketVolume || volumes[volumes.length - 1],
    marketCap: meta.marketCap,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    priceHistory,
  };
}

function calculateIndicators(closes: number[]) {
  if (closes.length < 26) return {};

  const sma = (period: number) => {
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };

  const ema = (period: number) => {
    const multiplier = 2 / (period + 1);
    let emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < closes.length; i++) {
      emaVal = (closes[i] - emaVal) * multiplier + emaVal;
    }
    return emaVal;
  };

  const sma20 = sma(20);
  const sma50 = closes.length >= 50 ? sma(50) : null;
  const ema12 = ema(12);
  const ema26 = ema(26);
  const macd = ema12 - ema26;

  const rsi = (() => {
    const changes = [];
    for (let i = 1; i < closes.length; i++) {
      changes.push(closes[i] - closes[i - 1]);
    }
    const gains = changes.filter((c) => c > 0);
    const losses = changes.filter((c) => c < 0).map((l) => Math.abs(l));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / changes.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / changes.length : 0;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  })();

  const price = closes[closes.length - 1];
  let smaSignal = "neutral";
  if (price > sma20 && (sma50 === null || sma20 > sma50)) smaSignal = "bullish";
  if (price < sma20 && (sma50 === null || sma20 < sma50)) smaSignal = "bearish";

  return {
    sma20: Math.round(sma20),
    sma50: sma50 ? Math.round(sma50) : null,
    ema12: Math.round(ema12),
    ema26: Math.round(ema26),
    macd: Math.round(macd),
    rsi: Math.round(rsi),
    smaSignal,
    rsiSignal: rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral",
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const search = searchParams.get("search");

  if (search) {
    try {
      const results = await searchYahoo(search);
      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }

  if (symbol) {
    try {
      const quote = await fetchYahooQuote(symbol.toUpperCase());
      const indicators = calculateIndicators(quote.priceHistory.map((p: { close: number }) => p.close));
      return NextResponse.json({ ...quote, indicators });
    } catch {
      return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
    }
  }

  return NextResponse.json({ popular: POPULAR_IDX });
}
