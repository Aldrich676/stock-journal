import { NextResponse } from "next/server";

function calculateTrendScore(indicators: Record<string, unknown>, changePercent: number, volume: number): { score: number; breakdown: Record<string, number>; label: string; color: string } {
  const rsi = (indicators.rsi as number) || 50;
  const macd = (indicators.macd as number) || 0;
  const smaSignal = (indicators.smaSignal as string) || "neutral";
  const rsiSignal = (indicators.rsiSignal as string) || "neutral";

  let rsiScore = 0;
  if (rsi < 25) rsiScore = 25;
  else if (rsi < 30) rsiScore = 20;
  else if (rsi < 40) rsiScore = 10;
  else if (rsi > 75) rsiScore = -25;
  else if (rsi > 70) rsiScore = -20;
  else if (rsi > 60) rsiScore = -10;

  let macdScore = 0;
  if (macd > 0) macdScore = 20;
  else if (macd < 0) macdScore = -20;

  let trendScore = 0;
  if (smaSignal === "bullish") trendScore = 25;
  else if (smaSignal === "bearish") trendScore = -25;

  let momentumScore = 0;
  if (rsiSignal === "oversold") momentumScore = 15;
  else if (rsiSignal === "overbought") momentumScore = -15;

  let priceActionScore = 0;
  if (changePercent > 2) priceActionScore = 15;
  else if (changePercent > 0.5) priceActionScore = 8;
  else if (changePercent < -2) priceActionScore = -15;
  else if (changePercent < -0.5) priceActionScore = -8;

  const total = rsiScore + macdScore + trendScore + momentumScore + priceActionScore;
  const clamped = Math.max(-100, Math.min(100, total));

  let label = "NEUTRAL";
  let color = "yellow";
  if (clamped >= 50) { label = "STRONG BULLISH"; color = "green"; }
  else if (clamped >= 25) { label = "BULLISH"; color = "green"; }
  else if (clamped > 5) { label = "MILD BULLISH"; color = "green"; }
  else if (clamped <= -50) { label = "STRONG BEARISH"; color = "red"; }
  else if (clamped <= -25) { label = "BEARISH"; color = "red"; }
  else if (clamped < -5) { label = "MILD BEARISH"; color = "red"; }

  return {
    score: clamped,
    breakdown: { RSI: rsiScore, MACD: macdScore, Trend: trendScore, Momentum: momentumScore, "Price Action": priceActionScore },
    label,
    color,
  };
}

function renderScoreBar(score: number): string {
  const normalized = Math.round((score + 100) / 2);
  const filled = Math.round(normalized / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

async function fetchNews(symbol: string, category: string): Promise<{ headlines: string[]; sentiment: string; sentimentScore: number } | null> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return null;

  const searchTerms: Record<string, string> = {
    XAUUSD: "gold price", XAGUSD: "silver price",
    BTC: "bitcoin", ETH: "ethereum", SOL: "solana",
    EURUSD: "EUR USD forex", GBPUSD: "GBP USD forex",
    USDJPY: "USD JPY forex", AUDUSD: "AUD USD forex",
    USDIDR: "USD IDR rupiah", SPX500: "S&P 500",
    NASDAQ: "nasdaq 100",
  };

  const query = searchTerms[symbol] || symbol;

  try {
    const res = await fetch(
      `https://api.marketaux.com/v1/news/search?q=${encodeURIComponent(query)}&language=en&limit=5&api_token=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const articles = data.data || [];

    if (articles.length === 0) return null;

    const headlines = articles.map((a: { title: string }) => a.title).slice(0, 3);

    let bullishCount = 0;
    let bearishCount = 0;
    for (const a of articles) {
      const text = ((a.title || "") + " " + (a.description || "")).toLowerCase();
      if (text.match(/surge|rally|soar|bull|gain|rise|jump|high|boom|recover|up|strong|breakout/)) bullishCount++;
      if (text.match(/crash|drop|fall|bear|plunge|decline|loss|weak|slump|low|down|recession|fear|crisis/)) bearishCount++;
    }

    let sentiment = "NEUTRAL";
    let sentimentScore = 0;
    if (bullishCount > bearishCount + 1) { sentiment = "BULLISH"; sentimentScore = 1; }
    else if (bearishCount > bullishCount + 1) { sentiment = "BEARISH"; sentimentScore = -1; }
    else if (bullishCount > bearishCount) { sentiment = "MILD BULLISH"; sentimentScore = 0.5; }
    else if (bearishCount > bullishCount) { sentiment = "MILD BEARISH"; sentimentScore = -0.5; }

    return { headlines, sentiment, sentimentScore };
  } catch {
    return null;
  }
}

function generateLocalAnalysis(instrumentData: Record<string, unknown>, indicators: Record<string, unknown>, question: string, news: { headlines: string[]; sentiment: string; sentimentScore: number } | null) {
  const price = (instrumentData.currentPrice as number) || 0;
  const change = (instrumentData.change as number) || 0;
  const changePercent = (instrumentData.changePercent as number) || 0;
  const dayHigh = (instrumentData.dayHigh as number) || price;
  const dayLow = (instrumentData.dayLow as number) || price;
  const fiftyTwoWeekHigh = (instrumentData.fiftyTwoWeekHigh as number) || price;
  const fiftyTwoWeekLow = (instrumentData.fiftyTwoWeekLow as number) || price;
  const volume = (instrumentData.volume as number) || 0;
  const rsi = (indicators.rsi as number) || 50;
  const macd = (indicators.macd as number) || 0;
  const sma20 = (indicators.sma20 as number) || price;
  const smaSignal = (indicators.smaSignal as string) || "neutral";
  const symbol = (instrumentData.symbol as string) || "???";
  const category = (instrumentData.category as string) || "forex";

  const isPositive = change >= 0;
  const support = Math.min(dayLow, sma20 || dayLow);
  const resistance = Math.max(dayHigh, sma20 || dayHigh);
  const q = question.toLowerCase();

  const trend = calculateTrendScore(indicators, changePercent, volume);
  const newsBoost = news ? Math.round(news.sentimentScore * 10) : 0;
  const finalScore = Math.max(-100, Math.min(100, trend.score + newsBoost));

  const newsSection = news ? `
NEWS SENTIMENT: ${news.sentiment}
  ${news.headlines.map((h) => `• ${h}`).join("\n  ")}` : "";

  const trendSection = `
MARKET BIAS: ${trend.label}
Score: ${finalScore}/100 ${renderScoreBar(finalScore)}
━━━━━━━━━━━━━━━━━━━━━━━
  RSI:        ${trend.breakdown.RSI >= 0 ? "+" : ""}${trend.breakdown.RSI}
  MACD:       ${trend.breakdown.MACD >= 0 ? "+" : ""}${trend.breakdown.MACD}
  Trend:      ${trend.breakdown.Trend >= 0 ? "+" : ""}${trend.breakdown.Trend}
  Momentum:   ${trend.breakdown.Momentum >= 0 ? "+" : ""}${trend.breakdown.Momentum}
  Price:      ${trend.breakdown["Price Action"] >= 0 ? "+" : ""}${trend.breakdown["Price Action"]}${news ? `\n  News:      ${newsBoost >= 0 ? "+" : ""}${newsBoost}` : ""}`;

  if (q.includes("comprehensive") || q.includes("full analysis")) {
    return `[${symbol}] FULL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}
${category === "forex" || category === "crypto" ? "Can short" : "No short selling"}
${trendSection}
${newsSection}

SETUP:
  Entry:     $${(price * 0.995).toFixed(2)}
  Stop Loss: $${(price * 0.98).toFixed(2)}
  TP1:       $${resistance.toFixed(2)}
  TP2:       $${(fiftyTwoWeekHigh * 0.95).toFixed(2)}

---
Disclaimer: Not financial advice.`;
  }

  if (q.includes("sell") || q.includes("short")) {
    const isForexOrCrypto = category === "forex" || category === "crypto" || category === "commodity";

    if (isForexOrCrypto) {
      const atr = (dayHigh - dayLow) * 0.6 + Math.abs(change) * 0.4;
      const entry = price + (atr * 0.3);
      const stopLoss = entry + (atr * 1.5);
      const tp1 = entry - (atr * 2);
      const tp2 = entry - (atr * 3.5);
      const tp3 = entry - (atr * 5);
      const risk = stopLoss - entry;
      const reward1 = entry - tp1;
      const reward2 = entry - tp2;
      const rr1 = (reward1 / risk).toFixed(1);
      const rr2 = (reward2 / risk).toFixed(1);

      const adjustedConfidence = Math.min(95, Math.max(20, 60 + Math.abs(finalScore) * 0.3 + (news && news.sentimentScore < 0 ? 10 : 0)));
      const verdict = finalScore < -40 ? "STRONG SELL" : finalScore < -15 ? "SELL ON RALLY" : "WAIT FOR BOUNCE";
      const reason = finalScore < -40 ? "Bearish trend + negative news" : finalScore < -15 ? "Bearish bias — sell rallies" : "Mixed signals — wait for clarity";

      return `[${symbol}] SELL / SHORT
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${adjustedConfidence.toFixed(0)}%
${trendSection}
${newsSection}

WHY:
  ${reason}

SETUP:
  Entry:     $${entry.toFixed(2)} (limit sell)
  Stop Loss: $${stopLoss.toFixed(2)} (+${((risk / entry) * 100).toFixed(1)}%)

TARGETS:
  TP1: $${tp1.toFixed(2)} (-${((reward1 / entry) * 100).toFixed(1)}%) — cover 40%
  TP2: $${tp2.toFixed(2)} (-${((reward2 / entry) * 100).toFixed(1)}%) — cover 40%
  TP3: $${tp3.toFixed(2)} (-${(((entry - tp3) / entry) * 100).toFixed(1)}%) — trail rest

RISK:REWARD
  Entry→TP1: 1:${rr1}
  Entry→TP2: 1:${rr2}

---
Disclaimer: Not financial advice.`;
    }

    return `[${symbol}] SELL (IDX)
━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toFixed(0)}
Verdict: ${finalScore < -30 ? "SELL NOW" : "HOLD"}
${trendSection}
${newsSection}

NO SHORT SELLING ON IDX.

SELL SIGNALS:
  RSI > 70: overbought — sell here
  Price < SMA20: trend broken — exit
  Target hit: take profit and wait

---
Disclaimer: Not financial advice.`;
  }

  if (q.includes("buy") || q.includes("long")) {
    const isForexOrCrypto = category === "forex" || category === "crypto" || category === "commodity";

    if (isForexOrCrypto) {
      const atr = (dayHigh - dayLow) * 0.6 + Math.abs(change) * 0.4;
      const entry = price - (atr * 0.3);
      const stopLoss = entry - (atr * 1.5);
      const tp1 = entry + (atr * 2);
      const tp2 = entry + (atr * 3.5);
      const tp3 = entry + (atr * 5);
      const risk = entry - stopLoss;
      const reward1 = tp1 - entry;
      const reward2 = tp2 - entry;
      const rr1 = (reward1 / risk).toFixed(1);
      const rr2 = (reward2 / risk).toFixed(1);

      const adjustedConfidence = Math.min(95, Math.max(20, 60 + Math.abs(finalScore) * 0.3 + (news && news.sentimentScore > 0 ? 10 : 0)));
      const verdict = finalScore > 40 ? "STRONG BUY" : finalScore > 15 ? "BUY ON DIP" : "WAIT FOR BETTER ENTRY";
      const reason = finalScore > 40 ? "Bullish trend + positive news" : finalScore > 15 ? "Bullish bias — buy dips" : "Mixed signals — wait for clarity";

      return `[${symbol}] BUY / LONG
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${adjustedConfidence.toFixed(0)}%
${trendSection}
${newsSection}

WHY:
  ${reason}

SETUP:
  Entry:     $${entry.toFixed(2)} (limit order)
  Stop Loss: $${stopLoss.toFixed(2)} (-${((risk / entry) * 100).toFixed(1)}%)

TARGETS:
  TP1: $${tp1.toFixed(2)} (+${((reward1 / entry) * 100).toFixed(1)}%) — close 40%
  TP2: $${tp2.toFixed(2)} (+${((reward2 / entry) * 100).toFixed(1)}%) — close 40%
  TP3: $${tp3.toFixed(2)} (+${(((tp3 - entry) / entry) * 100).toFixed(1)}%) — trail rest

RISK:REWARD
  Entry→TP1: 1:${rr1}
  Entry→TP2: 1:${rr2}

---
Disclaimer: Not financial advice.`;
    }

    const entry = price * 0.995;
    const stopLoss = price * 0.965;
    const tp1 = price * 1.03;
    const tp2 = price * 1.07;
    const risk = price - stopLoss;
    const reward1 = tp1 - price;
    const rr1 = (reward1 / risk).toFixed(1);

    return `[${symbol}] BUY (IDX)
━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toFixed(0)}
Verdict: ${finalScore > 30 ? "STRONG BUY" : finalScore > 10 ? "BUY ON DIP" : "WAIT"}
${trendSection}
${newsSection}

NO SHORT SELLING ON IDX.

SETUP:
  Entry:     Rp${entry.toFixed(0)} (limit)
  Stop Loss: Rp${stopLoss.toFixed(0)} (-${((risk / price) * 100).toFixed(1)}%)

TARGETS:
  TP1: Rp${tp1.toFixed(0)} (+${((reward1 / price) * 100).toFixed(1)}%) — sell 50%
  TP2: Rp${tp2.toFixed(0)} (+${(((tp2 - price) / price) * 100).toFixed(1)}%) — sell rest

RISK:REWARD: 1:${rr1}

---
Disclaimer: Not financial advice.`;
  }

  if (q.includes("risk")) {
    const risk = rsi > 70 || Math.abs(changePercent) > 3 ? "HIGH" : rsi < 30 || smaSignal === "bearish" ? "MEDIUM" : "LOW";
    return `[${symbol}] RISK
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Risk Level: ${risk}
Max Size: ${risk === "HIGH" ? "0.5%" : risk === "MEDIUM" ? "1%" : "2%"} per trade
Stop Loss: $${(price * 0.98).toFixed(2)}
${trendSection}
${newsSection}

---
Disclaimer: Not financial advice.`;
  }

  return `[${symbol}] QUICK LOOK
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
${trendSection}
${newsSection}

---
Disclaimer: Not financial advice.`;
}

export async function POST(request: Request) {
  const { instrumentData, indicators, question } = await request.json();

  const news = await fetchNews(instrumentData.symbol, instrumentData.category);

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const analysis = generateLocalAnalysis(instrumentData, indicators, question, news);
    return NextResponse.json({ analysis });
  }

  const trend = calculateTrendScore(indicators, instrumentData.changePercent, instrumentData.volume);
  const newsContext = news ? `\nNews Sentiment: ${news.sentiment}\nHeadlines:\n${news.headlines.map((h: string) => `- ${h}`).join("\n")}` : "";

  const context = `
Instrument: ${instrumentData.symbol} (${instrumentData.name})
Category: ${instrumentData.category}
Price: $${instrumentData.currentPrice?.toFixed(4)}
Change: ${instrumentData.change?.toFixed(4)} (${instrumentData.changePercent?.toFixed(2)}%)

Trend Score: ${trend.score}/100 (${trend.label})
Breakdown: RSI=${trend.breakdown.RSI}, MACD=${trend.breakdown.MACD}, Trend=${trend.breakdown.Trend}, Momentum=${trend.breakdown.Momentum}, Price=${trend.breakdown["Price Action"]}
${newsContext}

Indicators:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd}
- SMA20: $${indicators.sma20?.toFixed(4)}
- Signal: ${indicators.smaSignal}
`;

  const systemPrompt = `You are an expert trading analyst. Use the Trend Score and News Sentiment provided to give a clear market bias (bullish/bearish/neutral). Include the score breakdown in your analysis. ${instrumentData.category === "forex" ? "Forex trades 24/5." : instrumentData.category === "crypto" ? "Crypto trades 24/7." : "Check commodity hours."} Always include disclaimer.`;

  const userMessage = `Analyze:\n\n${context}\n\nQuestion: ${question || "Provide comprehensive analysis with trend score."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2048, system: systemPrompt, messages: [{ role: "user", content: userMessage }] }),
    });
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    return NextResponse.json({ analysis: data.content?.[0]?.text || "No analysis." });
  } catch {
    const analysis = generateLocalAnalysis(instrumentData, indicators, question, news);
    return NextResponse.json({ analysis });
  }
}
