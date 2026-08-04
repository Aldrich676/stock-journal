import { NextResponse } from "next/server";

interface EconomicEvent {
  name: string;
  date: string;
  time: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  currencies: string[];
  description: string;
  typicalReaction: string;
}

function getUpcomingEvents(): EconomicEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const events: EconomicEvent[] = [];

  const nfpDate = new Date(year, month, 1);
  while (nfpDate.getDay() !== 5) nfpDate.setDate(nfpDate.getDate() + 1);
  if (nfpDate < now) nfpDate.setMonth(nfpDate.getMonth() + 1);
  while (nfpDate.getDay() !== 5) nfpDate.setDate(nfpDate.getDate() + 1);

  const fomcDates = [
    new Date(year, 0, 29), new Date(year, 2, 19), new Date(year, 4, 7),
    new Date(year, 5, 18), new Date(year, 7, 20), new Date(year, 9, 29),
    new Date(year, 11, 11),
  ];

  const cpiDate = new Date(year, month, 10);
  if (cpiDate < now) cpiDate.setMonth(cpiDate.getMonth() + 1);

  const ecbDates = [new Date(year, month, 30)];
  if (ecbDates[0] < now) ecbDates[0].setMonth(ecbDates[0].getMonth() + 1);

  events.push({
    name: "NFP (Non-Farm Payrolls)",
    date: nfpDate.toISOString().split("T")[0],
    time: "13:30 UTC",
    impact: "HIGH",
    currencies: ["USD", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
    description: "US job market health. Big moves on gold, USD pairs, indices.",
    typicalReaction: "Strong NFP = USD up, Gold down. Weak NFP = USD down, Gold up.",
  });

  for (const d of fomcDates) {
    if (d >= now) {
      events.push({
        name: "FOMC Interest Rate Decision",
        date: d.toISOString().split("T")[0],
        time: "18:00 UTC",
        impact: "HIGH",
        currencies: ["USD", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTC", "ETH"],
        description: "Fed rate decision. Biggest market mover.",
        typicalReaction: "Rate hike = USD up, Risk assets down. Rate cut = USD up, Risk assets up.",
      });
      break;
    }
  }

  events.push({
    name: "CPI (Consumer Price Index)",
    date: cpiDate.toISOString().split("T")[0],
    time: "12:30 UTC",
    impact: "HIGH",
    currencies: ["USD", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"],
    description: "Inflation data. Drives Fed policy expectations.",
    typicalReaction: "High CPI = USD up, Gold volatile. Low CPI = USD down.",
  });

  for (const d of ecbDates) {
    if (d >= now) {
      events.push({
        name: "ECB Interest Rate Decision",
        date: d.toISOString().split("T")[0],
        time: "12:15 UTC",
        impact: "HIGH",
        currencies: ["EUR", "EURUSD", "GBPUSD"],
        description: "European Central Bank rate decision.",
        typicalReaction: "ECB hike = EUR up. ECB cut = EUR down.",
      });
      break;
    }
  }

  events.push({
    name: "US GDP (Advance)",
    date: new Date(year, month, 25).toISOString().split("T")[0],
    time: "12:30 UTC",
    impact: "MEDIUM",
    currencies: ["USD", "XAUUSD", "SPX500", "NASDAQ"],
    description: "US economic growth measure.",
    typicalReaction: "Strong GDP = USD up, stocks up. Weak = USD down.",
  });

  events.push({
    name: "US Retail Sales",
    date: new Date(year, month, 15).toISOString().split("T")[0],
    time: "12:30 UTC",
    impact: "MEDIUM",
    currencies: ["USD", "XAUUSD", "SPX500"],
    description: "Consumer spending indicator.",
    typicalReaction: "Strong = USD up. Weak = USD down.",
  });

  return events;
}

function checkEventProximity(symbol: string, category: string): { warnings: string[]; advice: string; eventRisk: "HIGH" | "MEDIUM" | "LOW" } {
  const now = new Date();
  const events = getUpcomingEvents();
  const warnings: string[] = [];
  let eventRisk: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let advice = "";

  const symbolUpper = symbol.toUpperCase();
  const relevantEvents = events.filter(e => {
    if (e.currencies.some(c => symbolUpper.includes(c))) return true;
    if (category === "crypto" && ["BTC", "ETH", "SOL"].some(c => symbolUpper.includes(c))) return true;
    if (category === "commodity" && ["XAUUSD", "XAGUSD"].some(c => symbolUpper.includes(c))) return true;
    return false;
  });

  for (const event of relevantEvents) {
    const eventDate = new Date(event.date + "T" + event.time.replace(" UTC", ":00Z"));
    const diffMs = eventDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) continue;

    if (diffHours <= 2) {
      warnings.push(`⚠️ ${event.name} in ${Math.round(diffHours * 60)} MINUTES!`);
      eventRisk = "HIGH";
      advice = `DO NOT TRADE — ${event.name} releasing soon. Extreme volatility expected. Wait 15-30 min after release.`;
    } else if (diffHours <= 24) {
      warnings.push(`⚠️ ${event.name} TODAY at ${event.time}`);
      eventRisk = "HIGH";
      advice = `CAUTION — ${event.name} today. Reduce position size to 0.5% risk. Expect ${diffHours < 6 ? "sharp" : "moderate"} moves on ${symbol}.`;
    } else if (diffDays <= 2) {
      warnings.push(`📅 ${event.name} in ${Math.round(diffDays)} day(s) — ${event.date}`);
      eventRisk = eventRisk === "HIGH" ? "HIGH" : "MEDIUM";
      advice = `APPROACHING — ${event.name} in ${Math.round(diffDays)} days. Consider: (1) Tighten stops, (2) Reduce lot size, (3) Don't open new positions day before.`;
    } else if (diffDays <= 5) {
      warnings.push(`📅 ${event.name} on ${event.date} (${Math.round(diffDays)} days)`);
      if (eventRisk !== "HIGH") eventRisk = "MEDIUM";
      advice = `UPCOMING — ${event.name} in ${Math.round(diffDays)} days. Plan your trades around it. ${event.typicalReaction}`;
    }
  }

  return { warnings, advice, eventRisk };
}

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

function generateLocalAnalysis(instrumentData: Record<string, unknown>, indicators: Record<string, unknown>, question: string, news: { headlines: string[]; sentiment: string; sentimentScore: number } | null, eventInfo: { warnings: string[]; advice: string; eventRisk: string }) {
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
  const eventPenalty = eventInfo.eventRisk === "HIGH" ? -15 : eventInfo.eventRisk === "MEDIUM" ? -5 : 0;
  const finalScore = Math.max(-100, Math.min(100, trend.score + newsBoost + eventPenalty));

  const eventSection = eventInfo.warnings.length > 0 ? `
⚠️ ECONOMIC CALENDAR
${eventInfo.warnings.map((w) => `  ${w}`).join("\n")}
  ${eventInfo.advice}` : "";

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
  Price:      ${trend.breakdown["Price Action"] >= 0 ? "+" : ""}${trend.breakdown["Price Action"]}${news ? `\n  News:      ${newsBoost >= 0 ? "+" : ""}${newsBoost}` : ""}${eventInfo.eventRisk !== "LOW" ? `\n  Event:     ${eventPenalty}` : ""}`;

  if (q.includes("comprehensive") || q.includes("full analysis")) {
    return `[${symbol}] FULL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}
${category === "forex" || category === "crypto" ? "Can short" : "No short selling"}
${eventSection}
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

      const adjustedConfidence = Math.min(95, Math.max(15, 60 + Math.abs(finalScore) * 0.3 + (news && news.sentimentScore < 0 ? 10 : 0) - (eventInfo.eventRisk === "HIGH" ? 20 : eventInfo.eventRisk === "MEDIUM" ? 10 : 0)));
      let verdict = finalScore < -40 ? "STRONG SELL" : finalScore < -15 ? "SELL ON RALLY" : "WAIT FOR BOUNCE";
      let reason = finalScore < -40 ? "Bearish trend + negative news" : finalScore < -15 ? "Bearish bias — sell rallies" : "Mixed signals — wait for clarity";

      if (eventInfo.eventRisk === "HIGH") {
        verdict = "WAIT — HIGH VOLATILITY EVENT";
        reason = `${eventInfo.warnings[0] || "Major event approaching"}. ${eventInfo.advice}`;
      }

      return `[${symbol}] SELL / SHORT
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${adjustedConfidence.toFixed(0)}%
${eventSection}
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
Verdict: ${eventInfo.eventRisk === "HIGH" ? "WAIT — EVENT RISK" : finalScore < -30 ? "SELL NOW" : "HOLD"}
${eventSection}
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

      const adjustedConfidence = Math.min(95, Math.max(15, 60 + Math.abs(finalScore) * 0.3 + (news && news.sentimentScore > 0 ? 10 : 0) - (eventInfo.eventRisk === "HIGH" ? 20 : eventInfo.eventRisk === "MEDIUM" ? 10 : 0)));
      let verdict = finalScore > 40 ? "STRONG BUY" : finalScore > 15 ? "BUY ON DIP" : "WAIT FOR BETTER ENTRY";
      let reason = finalScore > 40 ? "Bullish trend + positive news" : finalScore > 15 ? "Bullish bias — buy dips" : "Mixed signals — wait for clarity";

      if (eventInfo.eventRisk === "HIGH") {
        verdict = "WAIT — HIGH VOLATILITY EVENT";
        reason = `${eventInfo.warnings[0] || "Major event approaching"}. ${eventInfo.advice}`;
      }

      return `[${symbol}] BUY / LONG
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${adjustedConfidence.toFixed(0)}%
${eventSection}
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
Verdict: ${eventInfo.eventRisk === "HIGH" ? "WAIT — EVENT RISK" : finalScore > 30 ? "STRONG BUY" : finalScore > 10 ? "BUY ON DIP" : "WAIT"}
${eventSection}
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
${eventSection}
${trendSection}
${newsSection}

---
Disclaimer: Not financial advice.`;
  }

  return `[${symbol}] QUICK LOOK
━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
${eventSection}
${trendSection}
${newsSection}

---
Disclaimer: Not financial advice.`;
}

export async function POST(request: Request) {
  const { instrumentData, indicators, question } = await request.json();

  const news = await fetchNews(instrumentData.symbol, instrumentData.category);
  const eventInfo = checkEventProximity(instrumentData.symbol, instrumentData.category);

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const analysis = generateLocalAnalysis(instrumentData, indicators, question, news, eventInfo);
    return NextResponse.json({ analysis });
  }

  const trend = calculateTrendScore(indicators, instrumentData.changePercent, instrumentData.volume);
  const newsContext = news ? `\nNews Sentiment: ${news.sentiment}\nHeadlines:\n${news.headlines.map((h: string) => `- ${h}`).join("\n")}` : "";
  const eventContext = eventInfo.warnings.length > 0 ? `\n⚠️ ECONOMIC EVENTS:\n${eventInfo.warnings.join("\n")}\nAdvice: ${eventInfo.advice}` : "";

  const context = `
Instrument: ${instrumentData.symbol} (${instrumentData.name})
Category: ${instrumentData.category}
Price: $${instrumentData.currentPrice?.toFixed(4)}
Change: ${instrumentData.change?.toFixed(4)} (${instrumentData.changePercent?.toFixed(2)}%)

Trend Score: ${trend.score}/100 (${trend.label})
Breakdown: RSI=${trend.breakdown.RSI}, MACD=${trend.breakdown.MACD}, Trend=${trend.breakdown.Trend}, Momentum=${trend.breakdown.Momentum}, Price=${trend.breakdown["Price Action"]}
${newsContext}
${eventContext}

Indicators:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd}
- SMA20: $${indicators.sma20?.toFixed(4)}
- Signal: ${indicators.smaSignal}
`;

  const systemPrompt = `You are an expert trading analyst. Use the Trend Score, News Sentiment, and Economic Calendar events provided to give a clear market bias (bullish/bearish/neutral). Include the score breakdown in your analysis. If there are upcoming economic events, factor them into your advice — warn the user about volatility and suggest position sizing adjustments. ${instrumentData.category === "forex" ? "Forex trades 24/5." : instrumentData.category === "crypto" ? "Crypto trades 24/7." : "Check commodity hours."} Always include disclaimer.`;

  const userMessage = `Analyze:\n\n${context}\n\nQuestion: ${question || "Provide comprehensive analysis with trend score and event warnings."}`;

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
    const analysis = generateLocalAnalysis(instrumentData, indicators, question, news, eventInfo);
    return NextResponse.json({ analysis });
  }
}
