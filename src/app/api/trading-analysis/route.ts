import { NextResponse } from "next/server";

function generateLocalAnalysis(instrumentData: Record<string, unknown>, indicators: Record<string, unknown>, question: string) {
  const price = (instrumentData.currentPrice as number) || 0;
  const change = (instrumentData.change as number) || 0;
  const changePercent = (instrumentData.changePercent as number) || 0;
  const dayHigh = (instrumentData.dayHigh as number) || price;
  const dayLow = (instrumentData.dayLow as number) || price;
  const fiftyTwoWeekHigh = (instrumentData.fiftyTwoWeekHigh as number) || price;
  const fiftyTwoWeekLow = (instrumentData.fiftyTwoWeekLow as number) || price;
  const rsi = (indicators.rsi as number) || 50;
  const macd = (indicators.macd as number) || 0;
  const sma20 = (indicators.sma20 as number) || price;
  const smaSignal = (indicators.smaSignal as string) || "neutral";
  const symbol = (instrumentData.symbol as string) || "???";
  const category = (instrumentData.category as string) || "forex";

  const isPositive = change >= 0;
  const priceVs52wHigh = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;
  const priceVs52wLow = ((price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;
  const support = Math.min(dayLow, sma20 || dayLow);
  const resistance = Math.max(dayHigh, sma20 || dayHigh);
  const q = question.toLowerCase();

  const categoryNote = category === "forex" ? "Forex markets are open 24/5." :
    category === "commodity" ? "Commodity markets have specific trading sessions." :
    "Crypto markets are open 24/7.";

  // Full Analysis
  if (q.includes("comprehensive") || q.includes("full analysis")) {
    const isForexOrCrypto = category === "forex" || category === "crypto";
    return `[${symbol}] ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}
${isForexOrCrypto ? "Forex/Crypto - Can short" : "IDX - No short selling"}

BUY: $${(price * 0.995).toFixed(2)}
SELL: $${(price * 1.005).toFixed(2)}
STOP LOSS: $${(price * 0.98).toFixed(2)}
TAKE PROFIT 1: $${resistance.toFixed(2)}
TAKE PROFIT 2: $${(fiftyTwoWeekHigh * 0.95).toFixed(2)}

Disclaimer: Not financial advice.`;
  }

  // Sell/Short Signal (MUST check before buy because "sell" contains "good time" overlap)
  if (q.includes("sell") || q.includes("short")) {
    const isForexOrCrypto = category === "forex" || category === "crypto" || category === "commodity";

    if (isForexOrCrypto) {
      // Calculate ATR-like volatility
      const atr = (dayHigh - dayLow) * 0.6 + Math.abs(change) * 0.4;
      const entry = price + (atr * 0.3); // Sell on rally
      const stopLoss = entry + (atr * 1.5); // 1.5 ATR above entry
      const tp1 = entry - (atr * 2); // 2 ATR below
      const tp2 = entry - (atr * 3.5); // 3.5 ATR below
      const tp3 = entry - (atr * 5); // 5 ATR below
      const risk = stopLoss - entry;
      const reward1 = entry - tp1;
      const reward2 = entry - tp2;
      const rr1 = (reward1 / risk).toFixed(1);
      const rr2 = (reward2 / risk).toFixed(1);
      const verdict = rsi > 65 ? "STRONG SELL" : rsi > 55 && smaSignal === "bearish" ? "SELL ON RALLY" : "WAIT FOR BOUNCE";
      const reason = rsi > 65 ? "Overbought reversal setup" : smaSignal === "bearish" && macd < 0 ? "Trend + momentum breakdown" : "Weak short — need rally to enter";
      const confidence = rsi > 65 ? "85%" : smaSignal === "bearish" && macd < 0 ? "70%" : "45%";

      return `[${symbol}] SELL / SHORT
━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${confidence}

WHY:
  ${reason}
  RSI ${rsi} ${rsi > 70 ? "(overbought — pullback imminent)" : rsi > 55 ? "(elevated — watch for rejection)" : "(neutral — wait for rally)"}
  MACD ${macd < 0 ? "bearish crossover" : "bullish — not ideal for short"}

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

MANAGEMENT:
  After TP1: move SL to entry
  After TP2: trail SL at TP1
  Max lot: 0.01 (risk 2% account)

---
Disclaimer: Not financial advice.`;
    }

    // IDX (no short)
    const verdict = rsi > 65 ? "SELL NOW" : "HOLD — wait for exit signal";

    return `[${symbol}] SELL (IDX)
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toFixed(0)}
Verdict: ${verdict}

NO SHORT SELLING ON IDX.

SELL SIGNALS:
  RSI > 70: overbought — sell here
  Price < SMA20: trend broken — exit
  Target hit: take profit and wait

EXIT RULES:
  Sell 50% at first target
  Trail stop at SMA20
  Full exit if RSI > 80

IF NO POSITION:
  Wait for buy setup instead.
  Do not chase.

---
Disclaimer: Not financial advice.`;
  }

  // Buy/Long Signal
  if (q.includes("buy") || q.includes("long")) {
    const isForexOrCrypto = category === "forex" || category === "crypto" || category === "commodity";

    if (isForexOrCrypto) {
      // Calculate ATR-like volatility
      const atr = (dayHigh - dayLow) * 0.6 + Math.abs(change) * 0.4;
      const entry = price - (atr * 0.3); // Buy on pullback
      const stopLoss = entry - (atr * 1.5); // 1.5 ATR below entry
      const tp1 = entry + (atr * 2); // 2 ATR above
      const tp2 = entry + (atr * 3.5); // 3.5 ATR above
      const tp3 = entry + (atr * 5); // 5 ATR above
      const risk = entry - stopLoss;
      const reward1 = tp1 - entry;
      const reward2 = tp2 - entry;
      const rr1 = (reward1 / risk).toFixed(1);
      const rr2 = (reward2 / risk).toFixed(1);
      const verdict = rsi < 35 ? "STRONG BUY" : rsi < 45 && smaSignal === "bullish" ? "BUY ON DIP" : "WAIT FOR BETTER ENTRY";
      const reason = rsi < 35 ? "Oversold bounce setup" : smaSignal === "bullish" && macd > 0 ? "Trend + momentum aligned" : "Weak setup — need pullback";
      const confidence = rsi < 35 ? "85%" : smaSignal === "bullish" && macd > 0 ? "70%" : "45%";

      return `[${symbol}] BUY / LONG
━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Verdict: ${verdict}
Confidence: ${confidence}

WHY:
  ${reason}
  RSI ${rsi} ${rsi < 30 ? "(oversold — mean reversion likely)" : rsi < 45 ? "(approaching oversold)" : "(neutral — wait for dip)"}
  MACD ${macd > 0 ? "bullish crossover" : "bearish — not ideal for long"}

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

MANAGEMENT:
  After TP1: move SL to entry
  After TP2: trail SL at TP1
  Max lot: 0.01 (risk 2% account)

---
Disclaimer: Not financial advice.`;
    }

    // IDX (no short)
    const entry = price * 0.995;
    const stopLoss = price * 0.965;
    const tp1 = price * 1.03;
    const tp2 = price * 1.07;
    const risk = price - stopLoss;
    const reward1 = tp1 - price;
    const rr1 = (reward1 / risk).toFixed(1);
    const verdict = rsi < 35 ? "STRONG BUY" : rsi < 45 && smaSignal === "bullish" ? "BUY ON DIP" : "WAIT";

    return `[${symbol}] BUY (IDX)
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toFixed(0)}
Verdict: ${verdict}

NO SHORT SELLING ON IDX.

SETUP:
  Entry:     Rp${entry.toFixed(0)} (limit)
  Stop Loss: Rp${stopLoss.toFixed(0)} (-${((risk / price) * 100).toFixed(1)}%)

TARGETS:
  TP1: Rp${tp1.toFixed(0)} (+${((reward1 / price) * 100).toFixed(1)}%) — sell 50%
  TP2: Rp${tp2.toFixed(0)} (+${(((tp2 - price) / price) * 100).toFixed(1)}%) — sell rest

RISK:REWARD: 1:${rr1}

RULES:
  Lot: 100 shares
  Settlement: T+2
  After TP1: sell half, move SL to entry

---
Disclaimer: Not financial advice.`;
  }

  // Risk
  if (q.includes("risk")) {
    const risk = rsi > 70 || Math.abs(changePercent) > 3 ? "HIGH" : rsi < 30 || smaSignal === "bearish" ? "MEDIUM" : "LOW";
    return `[${symbol}] RISK
━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)}
Risk Level: ${risk}
Max Size: ${risk === "HIGH" ? "0.5%" : risk === "MEDIUM" ? "1%" : "2%"} per trade
Stop Loss: $${(price * 0.98).toFixed(2)}

Disclaimer: Not financial advice.`;
  }

  return `[${symbol}] QUICK LOOK
━━━━━━━━━━━━━━━━━━━━━━━━
Price: $${price.toFixed(2)} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}

Disclaimer: Not financial advice.`;
}

export async function POST(request: Request) {
  const { instrumentData, indicators, question } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const analysis = generateLocalAnalysis(instrumentData, indicators, question);
    return NextResponse.json({ analysis });
  }

  const context = `
Instrument: ${instrumentData.symbol} (${instrumentData.name})
Category: ${instrumentData.category}
Price: $${instrumentData.currentPrice?.toFixed(4)}
Change: ${instrumentData.change?.toFixed(4)} (${instrumentData.changePercent?.toFixed(2)}%)
Range: $${instrumentData.dayLow?.toFixed(4)} - $${instrumentData.dayHigh?.toFixed(4)}
52W Range: $${instrumentData.fiftyTwoWeekLow?.toFixed(4)} - $${instrumentData.fiftyTwoWeekHigh?.toFixed(4)}

Indicators:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd}
- SMA20: $${indicators.sma20?.toFixed(4)}
- SMA50: ${indicators.sma50 ? "$" + indicators.sma50.toFixed(4) : "N/A"}
- Signal: ${indicators.smaSignal}

Recent Prices:
${instrumentData.priceHistory?.slice(-5).map((p: { date: string; close: number }) => `${p.date}: $${p.close.toFixed(4)}`).join("\n") || "N/A"}
`;

  const systemPrompt = `You are an expert trading analyst for forex, commodities, and crypto. Provide actionable trading advice with specific entry/exit points, stop losses, and take profits. Include risk management. ${instrumentData.category === "forex" ? "Forex trades 24/5." : instrumentData.category === "crypto" ? "Crypto trades 24/7." : "Check commodity trading hours."} Always include disclaimer.`;

  const userMessage = `Analyze:\n\n${context}\n\nQuestion: ${question || "Provide comprehensive analysis."}`;

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
    const analysis = generateLocalAnalysis(instrumentData, indicators, question);
    return NextResponse.json({ analysis });
  }
}
