import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { trades, prompt } = await request.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const tradeSummary = trades
    .map(
      (t: { ticker: string; market: string; type: string; price: number; quantity: number; date: string; mood: string; notes: string; pnl?: number }) => {
        const currency = t.market === "indonesia" ? "Rp" : "$";
        const marketLabel = t.market === "indonesia" ? "IDX" : "US";
        return `${t.date} [${marketLabel}]: ${t.type.toUpperCase()} ${t.quantity} ${t.ticker} @ ${currency}${t.price.toLocaleString()} | Mood: ${t.mood} | Notes: ${t.notes || "none"}${t.pnl !== undefined ? ` | P&L: ${currency}${t.pnl.toLocaleString()}` : ""}`;
      }
    )
    .join("\n");

  const marketBreakdown = {
    us: trades.filter((t: { market: string }) => t.market === "us").length,
    indonesia: trades.filter((t: { market: string }) => t.market === "indonesia").length,
  };

  const systemPrompt = `You are an expert stock trading analyst and coach with deep knowledge of both US markets and Indonesian Stock Exchange (IDX/BEI). 

Analyze the user's trading journal data and provide actionable insights. Be specific, reference actual trades, and give practical advice.

Key context:
- US trades are in USD ($)
- Indonesian trades are on IDX/BEI, ticker suffix .JK, currency IDR (Rp)
- IDX trades: 1 lot = 100 shares
- Indonesian market hours: 09:00-16:00 WIB (GMT+7)

Format your response clearly with sections if needed.`;

  const userMessage = `Here is my trading journal:

${tradeSummary}

Market breakdown: ${marketBreakdown.us} US trades, ${marketBreakdown.indonesia} IDX trades

Question: ${prompt}`;

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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Claude API error: ${error}` }, { status: 500 });
    }

    const data = await response.json();
    const insight = data.content?.[0]?.text || "No insight generated.";

    return NextResponse.json({ insight });
  } catch (error) {
    return NextResponse.json({ error: `Failed to call Claude API: ${error}` }, { status: 500 });
  }
}
