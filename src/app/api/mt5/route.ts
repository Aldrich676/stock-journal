import { NextResponse } from "next/server";

const METAAPI_BASE = "https://api.metaapi.cloud/api";

async function metaapiRequest(path: string, method: string, body?: Record<string, unknown>) {
  const token = process.env.METAAPI_TOKEN;
  if (!token) throw new Error("METAAPI_TOKEN not configured");

  const res = await fetch(`${METAAPI_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`MetaApi error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function POST(request: Request) {
  const token = process.env.METAAPI_TOKEN;
  if (!token) {
    return NextResponse.json({
      error: "METAAPI_TOKEN not configured. Get your free token at https://metaapi.cloud",
      help: "1. Sign up at metaapi.cloud\n2. Get your API token\n3. Add METAAPI_TOKEN=your_token to .env.local"
    }, { status: 500 });
  }

  const { action, accountId, accountPassword, server, symbol, timeframe } = await request.json();

  try {
    if (action === "listAccounts") {
      const data = await metaapiRequest("/users/me/accounts", "GET");
      return NextResponse.json(data.map((a: Record<string, unknown>) => ({
        id: a.id,
        name: a.name,
        login: a.login,
        server: a.server,
        platform: a.platform,
        state: a.state,
      })));
    }

    if (action === "addAccount") {
      const data = await metaapiRequest("/users/me/accounts", "POST", {
        name: "HFM Trading",
        type: "cloud",
        login: accountId,
        password: accountPassword,
        server: server,
        platform: "mt5",
        magic: 0,
      });
      return NextResponse.json({ success: true, accountId: data.id });
    }

    if (action === "deploy") {
      await metaapiRequest(`/users/me/accounts/${accountId}/deploy`, "POST");
      return NextResponse.json({ success: true, message: "Account deployed" });
    }

    if (action === "waitConnected") {
      const data = await metaapiRequest(`/users/me/accounts/${accountId}/status`, "GET");
      return NextResponse.json({ connected: data.state === "DEPLOYED", state: data.state });
    }

    if (action === "getPrice") {
      const data = await metaapiRequest(`/users/me/accounts/${accountId}/symbols/${symbol || "EURUSD"}`, "GET");
      return NextResponse.json(data);
    }

    if (action === "getAccountInfo") {
      const data = await metaapiRequest(`/users/me/accounts/${accountId}/account`, "GET");
      return NextResponse.json(data);
    }

    if (action === "getPositions") {
      const data = await metaapiRequest(`/users/me/accounts/${accountId}/positions`, "GET");
      return NextResponse.json(data);
    }

    if (action === "getCandles") {
      const data = await metaapiRequest(
        `/users/me/accounts/${accountId}/candles?symbol=${symbol || "EURUSD"}&timeframe=${timeframe || "1h"}&limit=1000`,
        "GET"
      );
      return NextResponse.json(data);
    }

    if (action === "removeAccount") {
      await metaapiRequest(`/users/me/accounts/${accountId}`, "DELETE");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const token = process.env.METAAPI_TOKEN;
  return NextResponse.json({
    configured: !!token,
    message: token ? "MetaApi configured" : "Set METAAPI_TOKEN in .env.local",
    signupUrl: "https://metaapi.cloud",
  });
}
