import { NextResponse } from "next/server";

function generateLocalAnalysis(stockData: Record<string, unknown>, indicators: Record<string, unknown>, question: string) {
  const price = stockData.currentPrice as number;
  const change = stockData.change as number;
  const changePercent = stockData.changePercent as number;
  const dayHigh = stockData.dayHigh as number;
  const dayLow = stockData.dayLow as number;
  const fiftyTwoWeekHigh = stockData.fiftyTwoWeekHigh as number;
  const fiftyTwoWeekLow = stockData.fiftyTwoWeekLow as number;
  const volume = stockData.volume as number;
  const rsi = indicators.rsi as number;
  const macd = indicators.macd as number;
  const sma20 = indicators.sma20 as number;
  const sma50 = indicators.sma50 as number;
  const smaSignal = indicators.smaSignal as string;

  const isPositive = change >= 0;
  const priceVs52wHigh = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;
  const priceVs52wLow = ((price - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100;
  const support = Math.min(dayLow, sma20 || dayLow);
  const resistance = Math.max(dayHigh, sma20 || dayHigh);

  const q = question.toLowerCase();

  // Full Analysis
  if (q.includes("comprehensive") || q.includes("full analysis")) {
    const verdict = rsi < 40 || (smaSignal === "bullish" && macd > 0) ? "BUY" : rsi > 65 ? "SELL" : "HOLD";
    return `[${stockData.symbol}] ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toLocaleString()} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}

Verdict: ${verdict}

BUY: Rp${(price * 0.97).toLocaleString()}
SELL: Rp${resistance.toLocaleString()}
STOP LOSS: Rp${(price * 0.93).toLocaleString()}

Disclaimer: Not financial advice.`;
  }

  // Buy Signal (includes sell/take profit info)
  if (q.includes("buy") || q.includes("entry") || q.includes("good time")) {
    const verdict = rsi < 40 || (smaSignal === "bullish" && macd > 0) ? "BUY NOW" : "WAIT FOR DIP";
    const entry = Math.max(price * 0.97, support);
    const stopLoss = price * 0.93;
    const tp1 = resistance;
    const tp2 = fiftyTwoWeekHigh * 0.9;

    return `[${stockData.symbol}] BUY SIGNAL
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toLocaleString()}
Verdict: ${verdict}

WHEN TO BUY:
  Limit buy: Rp${entry.toLocaleString()}
  Market buy: Rp${price.toLocaleString()}

WHEN TO SELL:
  Sell at: Rp${tp1.toLocaleString()} (partial)
  Sell at: Rp${tp2.toLocaleString()} (more)
  Emergency sell if: Rp${stopLoss.toLocaleString()}

STOP LOSS: Rp${stopLoss.toLocaleString()} (-7%)

IDX RULES:
  Lot: 100 shares
  Settlement: T+2
  No short selling

---
Disclaimer: Not financial advice.`;
  }

  // Risk
  if (q.includes("risk")) {
    const risk = rsi > 70 || Math.abs(changePercent) > 3 ? "HIGH" : smaSignal === "bearish" ? "MEDIUM" : "LOW";
    return `[${stockData.symbol}] RISK
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toLocaleString()}
Risk: ${risk}
Stop Loss: Rp${(price * 0.93).toLocaleString()}
Max Size: ${risk === "HIGH" ? "2-3%" : "5-10%"} of portfolio

Disclaimer: Not financial advice.`;
  }

  // Default
  const verdict = rsi < 40 ? "BUY" : rsi > 60 ? "SELL" : "HOLD";
  return `[${stockData.symbol}] QUICK LOOK
━━━━━━━━━━━━━━━━━━━━━━━━
Price: Rp${price.toLocaleString()} (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)
RSI: ${rsi} | MACD: ${macd > 0 ? "Bullish" : "Bearish"} | Trend: ${smaSignal}
Verdict: ${verdict}

Disclaimer: Not financial advice.`;
}

export async function POST(request: Request) {
  const { stockData, indicators, question } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const analysis = generateLocalAnalysis(stockData, indicators, question);
    return NextResponse.json({ analysis });
  }

  const stockContext = `
Stock: ${stockData.symbol} (${stockData.name})
Current Price: Rp${stockData.currentPrice?.toLocaleString()}
Change: ${stockData.change?.toFixed(2)} (${stockData.changePercent?.toFixed(2)}%)
Day Range: Rp${stockData.dayLow?.toLocaleString()} - Rp${stockData.dayHigh?.toLocaleString()}
52-Week Range: Rp${stockData.fiftyTwoWeekLow?.toLocaleString()} - Rp${stockData.fiftyTwoWeekHigh?.toLocaleString()}
Volume: ${stockData.volume?.toLocaleString()}

Technical Indicators:
- RSI (14): ${indicators.rsi}
- MACD: ${indicators.macd}
- SMA 20: Rp${indicators.sma20?.toLocaleString()}
- SMA 50: Rp${indicators.sma50?.toLocaleString() || "N/A"}
- SMA Signal: ${indicators.smaSignal}
- RSI Signal: ${indicators.rsiSignal}

Recent Price History:
${stockData.priceHistory?.slice(-5).map((p: { date: string; close: number }) => `${p.date}: Rp${p.close.toLocaleString()}`).join("\n") || "N/A"}
`;

  const systemPrompt = `You are an expert Indonesian stock market (IDX/BEI) trading analyst. Provide actionable trading advice with specific price targets, stop losses, and entry/exit points. Always mention risk factors and include a disclaimer that this is not financial advice.`;

  const userMessage = `Analyze this Indonesian stock for trading:\n\n${stockContext}\n\nQuestion: ${question || "Provide a comprehensive trading analysis including technical outlook, support/resistance levels, buy/sell recommendation with entry/exit points, risk assessment, and price targets."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Claude API error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text || "No analysis generated.";

    return NextResponse.json({ analysis });
  } catch {
    const analysis = generateLocalAnalysis(stockData, indicators, question);
    return NextResponse.json({ analysis });
  }
}
