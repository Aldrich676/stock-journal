import { NextResponse } from "next/server";

const INSTRUMENTS = [
  // Commodities - Metals
  { symbol: "XAUUSD", name: "Gold", category: "commodity", subcategory: "metals", yahooSymbol: "GC=F" },
  { symbol: "XAGUSD", name: "Silver", category: "commodity", subcategory: "metals", yahooSymbol: "SI=F" },
  { symbol: "XPTUSD", name: "Platinum", category: "commodity", subcategory: "metals", yahooSymbol: "PL=F" },
  { symbol: "XPDUSD", name: "Palladium", category: "commodity", subcategory: "metals", yahooSymbol: "PA=F" },
  { symbol: "COPPERUSD", name: "Copper", category: "commodity", subcategory: "metals", yahooSymbol: "HG=F" },

  // Commodities - Energy
  { symbol: "WTI", name: "Crude Oil (WTI)", category: "commodity", subcategory: "energy", yahooSymbol: "CL=F" },
  { symbol: "BRENT", name: "Brent Crude Oil", category: "commodity", subcategory: "energy", yahooSymbol: "BZ=F" },
  { symbol: "NATGAS", name: "Natural Gas", category: "commodity", subcategory: "energy", yahooSymbol: "NG=F" },

  // Commodities - Agriculture
  { symbol: "WHEAT", name: "Wheat", category: "commodity", subcategory: "agriculture", yahooSymbol: "ZW=F" },
  { symbol: "CORN", name: "Corn", category: "commodity", subcategory: "agriculture", yahooSymbol: "ZC=F" },
  { symbol: "SOYBEAN", name: "Soybeans", category: "commodity", subcategory: "agriculture", yahooSymbol: "ZS=F" },
  { symbol: "COFFEE", name: "Coffee", category: "commodity", subcategory: "agriculture", yahooSymbol: "KC=F" },
  { symbol: "SUGAR", name: "Sugar", category: "commodity", subcategory: "agriculture", yahooSymbol: "SB=F" },
  { symbol: "COCOA", name: "Cocoa", category: "commodity", subcategory: "agriculture", yahooSymbol: "CC=F" },
  { symbol: "COTTON", name: "Cotton", category: "commodity", subcategory: "agriculture", yahooSymbol: "CT=F" },

  // Crypto
  { symbol: "BTC", name: "Bitcoin", category: "crypto", subcategory: "major", yahooSymbol: "BTC-USD" },
  { symbol: "ETH", name: "Ethereum", category: "crypto", subcategory: "major", yahooSymbol: "ETH-USD" },
  { symbol: "SOL", name: "Solana", category: "crypto", subcategory: "major", yahooSymbol: "SOL-USD" },
  { symbol: "BNB", name: "Binance Coin", category: "crypto", subcategory: "major", yahooSymbol: "BNB-USD" },
  { symbol: "XRP", name: "Ripple", category: "crypto", subcategory: "major", yahooSymbol: "XRP-USD" },
  { symbol: "ADA", name: "Cardano", category: "crypto", subcategory: "major", yahooSymbol: "ADA-USD" },
  { symbol: "DOGE", name: "Dogecoin", category: "crypto", subcategory: "major", yahooSymbol: "DOGE-USD" },
  { symbol: "DOT", name: "Polkadot", category: "crypto", subcategory: "major", yahooSymbol: "DOT-USD" },
  { symbol: "AVAX", name: "Avalanche", category: "crypto", subcategory: "major", yahooSymbol: "AVAX-USD" },
  { symbol: "LINK", name: "Chainlink", category: "crypto", subcategory: "major", yahooSymbol: "LINK-USD" },
  { symbol: "MATIC", name: "Polygon", category: "crypto", subcategory: "major", yahooSymbol: "MATIC-USD" },
  { symbol: "UNI", name: "Uniswap", category: "crypto", subcategory: "defi", yahooSymbol: "UNI-USD" },
  { symbol: "LTC", name: "Litecoin", category: "crypto", subcategory: "major", yahooSymbol: "LTC-USD" },
  { symbol: "ATOM", name: "Cosmos", category: "crypto", subcategory: "major", yahooSymbol: "ATOM-USD" },
  { symbol: "NEAR", name: "NEAR Protocol", category: "crypto", subcategory: "major", yahooSymbol: "NEAR-USD" },
  { symbol: "APT", name: "Aptos", category: "crypto", subcategory: "major", yahooSymbol: "APT-USD" },
  { symbol: "ARB", name: "Arbitrum", category: "crypto", subcategory: "layer2", yahooSymbol: "ARB-USD" },
  { symbol: "OP", name: "Optimism", category: "crypto", subcategory: "layer2", yahooSymbol: "OP-USD" },
  { symbol: "SUI", name: "Sui", category: "crypto", subcategory: "major", yahooSymbol: "SUI-USD" },
  { symbol: "SEI", name: "Sei", category: "crypto", subcategory: "major", yahooSymbol: "SEI-USD" },

  // Forex - Major
  { symbol: "EURUSD", name: "Euro/US Dollar", category: "forex", subcategory: "major", yahooSymbol: "EURUSD=X" },
  { symbol: "GBPUSD", name: "British Pound/US Dollar", category: "forex", subcategory: "major", yahooSymbol: "GBPUSD=X" },
  { symbol: "USDJPY", name: "US Dollar/Japanese Yen", category: "forex", subcategory: "major", yahooSymbol: "USDJPY=X" },
  { symbol: "USDCHF", name: "US Dollar/Swiss Franc", category: "forex", subcategory: "major", yahooSymbol: "USDCHF=X" },
  { symbol: "AUDUSD", name: "Australian Dollar/US Dollar", category: "forex", subcategory: "major", yahooSymbol: "AUDUSD=X" },
  { symbol: "USDCAD", name: "US Dollar/Canadian Dollar", category: "forex", subcategory: "major", yahooSymbol: "USDCAD=X" },
  { symbol: "NZDUSD", name: "New Zealand Dollar/US Dollar", category: "forex", subcategory: "major", yahooSymbol: "NZDUSD=X" },

  // Forex - Crosses
  { symbol: "EURGBP", name: "Euro/British Pound", category: "forex", subcategory: "cross", yahooSymbol: "EURGBP=X" },
  { symbol: "EURJPY", name: "Euro/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "EURJPY=X" },
  { symbol: "GBPJPY", name: "British Pound/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "GBPJPY=X" },
  { symbol: "AUDJPY", name: "Australian Dollar/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "AUDJPY=X" },
  { symbol: "EURAUD", name: "Euro/Australian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "EURAUD=X" },
  { symbol: "EURCHF", name: "Euro/Swiss Franc", category: "forex", subcategory: "cross", yahooSymbol: "EURCHF=X" },
  { symbol: "EURCAD", name: "Euro/Canadian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "EURCAD=X" },
  { symbol: "EURNZD", name: "Euro/New Zealand Dollar", category: "forex", subcategory: "cross", yahooSymbol: "EURNZD=X" },
  { symbol: "GBPAUD", name: "British Pound/Australian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "GBPAUD=X" },
  { symbol: "GBPCAD", name: "British Pound/Canadian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "GBPCAD=X" },
  { symbol: "GBPCHF", name: "British Pound/Swiss Franc", category: "forex", subcategory: "cross", yahooSymbol: "GBPCHF=X" },
  { symbol: "GBPNZD", name: "British Pound/New Zealand Dollar", category: "forex", subcategory: "cross", yahooSymbol: "GBPNZD=X" },
  { symbol: "AUDCAD", name: "Australian Dollar/Canadian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "AUDCAD=X" },
  { symbol: "AUDCHF", name: "Australian Dollar/Swiss Franc", category: "forex", subcategory: "cross", yahooSymbol: "AUDCHF=X" },
  { symbol: "AUDNZD", name: "Australian Dollar/New Zealand Dollar", category: "forex", subcategory: "cross", yahooSymbol: "AUDNZD=X" },
  { symbol: "CADJPY", name: "Canadian Dollar/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "CADJPY=X" },
  { symbol: "CHFJPY", name: "Swiss Franc/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "CHFJPY=X" },
  { symbol: "NZDJPY", name: "New Zealand Dollar/Japanese Yen", category: "forex", subcategory: "cross", yahooSymbol: "NZDJPY=X" },
  { symbol: "NZDCAD", name: "New Zealand Dollar/Canadian Dollar", category: "forex", subcategory: "cross", yahooSymbol: "NZDCAD=X" },

  // Forex - Exotics
  { symbol: "USDIDR", name: "US Dollar/Indonesian Rupiah", category: "forex", subcategory: "exotic", yahooSymbol: "USDIDR=X" },
  { symbol: "USDSGD", name: "US Dollar/Singapore Dollar", category: "forex", subcategory: "exotic", yahooSymbol: "USDSGD=X" },
  { symbol: "USDTHB", name: "US Dollar/Thai Baht", category: "forex", subcategory: "exotic", yahooSymbol: "USDTHB=X" },
  { symbol: "USDMYR", name: "US Dollar/Malaysian Ringgit", category: "forex", subcategory: "exotic", yahooSymbol: "USDMYR=X" },
  { symbol: "USDPHP", name: "US Dollar/Philippine Peso", category: "forex", subcategory: "exotic", yahooSymbol: "USDPHP=X" },
  { symbol: "USDTRY", name: "US Dollar/Turkish Lira", category: "forex", subcategory: "exotic", yahooSymbol: "USDTRY=X" },
  { symbol: "USDMXN", name: "US Dollar/Mexican Peso", category: "forex", subcategory: "exotic", yahooSymbol: "USDMXN=X" },
  { symbol: "USDZAR", name: "US Dollar/South African Rand", category: "forex", subcategory: "exotic", yahooSymbol: "USDZAR=X" },
  { symbol: "USDBRL", name: "US Dollar/Brazilian Real", category: "forex", subcategory: "exotic", yahooSymbol: "USDBRL=X" },
  { symbol: "USDINR", name: "US Dollar/Indian Rupee", category: "forex", subcategory: "exotic", yahooSymbol: "USDINR=X" },
  { symbol: "USDCNH", name: "US Dollar/Chinese Yuan", category: "forex", subcategory: "exotic", yahooSymbol: "USDCNH=X" },
  { symbol: "USDPLN", name: "US Dollar/Polish Zloty", category: "forex", subcategory: "exotic", yahooSymbol: "USDPLN=X" },
  { symbol: "USDSEK", name: "US Dollar/Swedish Krona", category: "forex", subcategory: "exotic", yahooSymbol: "USDSEK=X" },
  { symbol: "USDNOK", name: "US Dollar/Norwegian Krone", category: "forex", subcategory: "exotic", yahooSymbol: "USDNOK=X" },
  { symbol: "USDDKK", name: "US Dollar/Danish Krone", category: "forex", subcategory: "exotic", yahooSymbol: "USDDKK=X" },
  { symbol: "USDHUF", name: "US Dollar/Hungarian Forint", category: "forex", subcategory: "exotic", yahooSymbol: "USDHUF=X" },
  { symbol: "USDCZK", name: "US Dollar/Czech Koruna", category: "forex", subcategory: "exotic", yahooSymbol: "USDCZK=X" },
  { symbol: "USDHKD", name: "US Dollar/Hong Kong Dollar", category: "forex", subcategory: "exotic", yahooSymbol: "USDHKD=X" },
  { symbol: "USDSAR", name: "US Dollar/Saudi Riyal", category: "forex", subcategory: "exotic", yahooSymbol: "USDSAR=X" },
  { symbol: "USDQAR", name: "US Dollar/Qatari Riyal", category: "forex", subcategory: "exotic", yahooSymbol: "USDQAR=X" },

  // Indices
  { symbol: "SPX500", name: "S&P 500", category: "index", subcategory: "us", yahooSymbol: "^GSPC" },
  { symbol: "DOW30", name: "Dow Jones 30", category: "index", subcategory: "us", yahooSymbol: "^DJI" },
  { symbol: "NASDAQ", name: "Nasdaq 100", category: "index", subcategory: "us", yahooSymbol: "^IXIC" },
  { symbol: "RUSSELL", name: "Russell 2000", category: "index", subcategory: "us", yahooSymbol: "^RUT" },
  { symbol: "DAX", name: "DAX 40", category: "index", subcategory: "europe", yahooSymbol: "^GDAXI" },
  { symbol: "FTSE", name: "FTSE 100", category: "index", subcategory: "europe", yahooSymbol: "^FTSE" },
  { symbol: "CAC", name: "CAC 40", category: "index", subcategory: "europe", yahooSymbol: "^FCHI" },
  { symbol: "NIKKEI", name: "Nikkei 225", category: "index", subcategory: "asia", yahooSymbol: "^N225" },
  { symbol: "HANGSENG", name: "Hang Seng 50", category: "index", subcategory: "asia", yahooSymbol: "^HSI" },
  { symbol: "ASX200", name: "ASX 200", category: "index", subcategory: "asia", yahooSymbol: "^AXJO" },
  { symbol: "KOSPI", name: "KOSPI", category: "index", subcategory: "asia", yahooSymbol: "^KS11" },
  { symbol: "SENSEX", name: "SENSEX", category: "index", subcategory: "asia", yahooSymbol: "^BSESN" },
];

async function fetchMetalSpotPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  const metalMap: Record<string, string> = { XAUUSD: "XAU", XAGUSD: "XAG", XPTUSD: "XPT", XPDUSD: "XPD" };
  const metal = metalMap[symbol];
  if (!metal) return null;

  try {
    const res = await fetch(`https://api.gold-api.com/price/${metal}`, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.price) return null;

    return {
      price: data.price,
      change24h: 0,
    };
  } catch {
    return null;
  }
}

async function fetchYahooQuote(yahooSymbol: string, displayName: string, displaySymbol: string, category: string, subcategory: string) {
  // Try spot price for precious metals first, then Yahoo for history
  if (["XAUUSD", "XAGUSD", "XPTUSD", "XPDUSD"].includes(displaySymbol)) {
    const spot = await fetchMetalSpotPrice(displaySymbol);
    if (spot && spot.price > 0) {
      let priceHistory: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
      let prevClose = spot.price;
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1mo`;
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (res.ok) {
          const data = await res.json();
          const result = data.chart?.result?.[0];
          if (result) {
            const quotes = result.indicators.quote[0];
            const timestamps = result.timestamp;
            const closes: number[] = (quotes.close || []).filter((c: number | null) => c !== null);
            priceHistory = timestamps.map((t: number, i: number) => ({
              date: new Date(t * 1000).toISOString().split("T")[0],
              open: quotes.open?.[i], high: (quotes.high || [])[i], low: (quotes.low || [])[i], close: closes[i], volume: (quotes.volume || [])[i],
            })).filter((p: { close: number | null }) => p.close !== null);
            prevClose = result.meta?.chartPreviousClose || spot.price;
          }
        }
      } catch {}
      const change = spot.price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      return {
        symbol: displaySymbol, name: displayName, category, subcategory, currency: "USD",
        currentPrice: spot.price, previousClose: prevClose, change, changePercent,
        dayHigh: spot.price, dayLow: spot.price, volume: 0,
        fiftyTwoWeekHigh: spot.price, fiftyTwoWeekLow: spot.price, priceHistory,
      };
    }
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1mo`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  const data = await res.json();
  if (!data.chart || !data.chart.result || data.chart.result.length === 0) throw new Error("No data");
  const result = data.chart.result[0];
  const meta = result.meta;
  const quotes = result.indicators.quote[0];
  const timestamps = result.timestamp;

  const closes: number[] = (quotes.close || []).filter((c: number | null) => c !== null);
  const highs: number[] = (quotes.high || []).filter((h: number | null) => h !== null);
  const lows: number[] = (quotes.low || []).filter((l: number | null) => l !== null);
  const volumes: number[] = (quotes.volume || []).filter((v: number | null) => v !== null);

  if (closes.length === 0) throw new Error("No price data");

  const currentPrice = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose || closes[closes.length - 2];
  const change = currentPrice - previousClose;
  const changePercent = (change / previousClose) * 100;

  const priceHistory = timestamps.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString().split("T")[0],
    open: quotes.open?.[i], high: highs[i], low: lows[i], close: closes[i], volume: volumes[i],
  })).filter((p: { close: number | null }) => p.close !== null);

  return {
    symbol: displaySymbol,
    name: displayName,
    category, subcategory,
    currency: category === "forex" && displaySymbol.includes("USD") && !displaySymbol.startsWith("USD") ? "USD" : "USD",
    currentPrice, previousClose, change, changePercent,
    dayHigh: meta.regularMarketDayHigh || (highs.length > 0 ? Math.max(...highs) : currentPrice),
    dayLow: meta.regularMarketDayLow || (lows.length > 0 ? Math.min(...lows) : currentPrice),
    volume: meta.regularMarketVolume || (volumes.length > 0 ? volumes[volumes.length - 1] : 0),
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || (highs.length > 0 ? Math.max(...highs) : currentPrice),
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || (lows.length > 0 ? Math.min(...lows) : currentPrice),
    priceHistory,
  };
}

function calculateIndicators(closes: number[]) {
  const empty = { sma20: 0, sma50: null, ema12: 0, ema26: 0, macd: 0, rsi: 50, smaSignal: "neutral", rsiSignal: "neutral" as string };
  if (closes.length < 3) return empty;
  const sma = (period: number) => { const s = closes.slice(-period); return s.reduce((a, b) => a + b, 0) / s.length; };
  const ema = (period: number) => { const m = 2 / (period + 1); const start = closes.slice(0, Math.min(period, closes.length)); let e = start.reduce((a, b) => a + b, 0) / start.length; for (let i = start.length; i < closes.length; i++) e = (closes[i] - e) * m + e; return e; };
  const sma20 = closes.length >= 20 ? sma(20) : sma(closes.length);
  const sma50 = closes.length >= 50 ? sma(50) : null;
  const ema12 = ema(12);
  const ema26 = closes.length >= 26 ? ema(26) : ema12;
  const macd = ema12 - ema26;
  const rsi = (() => { const ch = []; for (let i = 1; i < closes.length; i++) ch.push(closes[i] - closes[i-1]); const g = ch.filter(c => c > 0); const l = ch.filter(c => c < 0).map(x => Math.abs(x)); const ag = g.length > 0 ? g.reduce((a,b) => a+b, 0) / ch.length : 0; const al = l.length > 0 ? l.reduce((a,b) => a+b, 0) / ch.length : 0; if (al === 0) return 100; return 100 - 100 / (1 + ag / al); })();
  const price = closes[closes.length - 1];
  let smaSignal = "neutral"; if (price > sma20 && (sma50 === null || sma20 > sma50)) smaSignal = "bullish"; if (price < sma20 && (sma50 === null || sma20 < sma50)) smaSignal = "bearish";
  return { sma20, sma50, ema12, ema26, macd, rsi: Math.round(rsi), smaSignal, rsiSignal: rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral" };
}

function searchInstruments(query: string) {
  const q = query.toUpperCase();
  return INSTRUMENTS.filter(i => i.symbol.includes(q) || i.name.toUpperCase().includes(q));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const search = searchParams.get("search");

  if (search) {
    return NextResponse.json({ results: searchInstruments(search) });
  }

  if (symbol) {
    const inst = INSTRUMENTS.find(i => i.symbol === symbol.toUpperCase());
    if (!inst) return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
    try {
      const quote = await fetchYahooQuote(inst.yahooSymbol, inst.name, inst.symbol, inst.category, inst.subcategory);
      const indicators = calculateIndicators(quote.priceHistory.map((p: { close: number }) => p.close));
      return NextResponse.json({ ...quote, indicators });
    } catch (e) {
      return NextResponse.json({ error: `Failed to fetch: ${e instanceof Error ? e.message : "unknown"}` }, { status: 500 });
    }
  }

  return NextResponse.json({ popular: INSTRUMENTS });
}
