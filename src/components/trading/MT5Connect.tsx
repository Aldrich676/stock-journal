"use client";

import { useState, useEffect } from "react";

interface Props {
  onConnected: (accountId: string) => void;
}

export default function MT5Connect({ onConnected }: Props) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("HFM-MT5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "account" | "deploying" | "connected">("setup");
  const [apiToken, setApiToken] = useState("");
  const [savedAccountId, setSavedAccountId] = useState("");
  const [deployStatus, setDeployStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("mt5_account");
    const savedToken = localStorage.getItem("metaaapi_token");
    if (savedToken) setApiToken(savedToken);
    if (saved) {
      setSavedAccountId(saved);
      setStep("connected");
    }
  }, []);

  const handleSetup = async () => {
    if (!apiToken.trim()) return;
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("metaaapi_token", apiToken);
      const res = await fetch("/api/mt5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listAccounts" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStep("account");
      }
    } catch {
      setError("Failed to connect to MetaApi");
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!login || !password) return;
    setLoading(true);
    setError("");

    try {
      const addRes = await fetch("/api/mt5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAccount",
          accountId: login,
          accountPassword: password,
          server,
        }),
      });
      const addData = await addRes.json();

      if (addData.error) {
        setError(addData.error);
        setLoading(false);
        return;
      }

      const accountId = addData.accountId;
      setSavedAccountId(accountId);
      setStep("deploying");
      setDeployStatus("Deploying account...");

      const deployRes = await fetch("/api/mt5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deploy", accountId }),
      });
      const deployData = await deployRes.json();

      if (deployData.error) {
        setError(deployData.error);
        setStep("account");
        setLoading(false);
        return;
      }

      setDeployStatus("Waiting for connection...");

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch("/api/mt5", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "waitConnected", accountId }),
        });
        const statusData = await statusRes.json();
        if (statusData.connected) {
          setStep("connected");
          localStorage.setItem("mt5_account", accountId);
          onConnected(accountId);
          setLoading(false);
          return;
        }
        setDeployStatus(`Connecting... (${i + 1}/10)`);
      }

      setError("Connection timed out. Account may still be deploying - try again in 30 seconds.");
      setStep("account");
    } catch {
      setError("Failed to connect");
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("mt5_account");
    setSavedAccountId("");
    setStep("setup");
    setLogin("");
    setPassword("");
  };

  if (step === "connected") {
    return (
      <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-green-400">Connected to HFM MT5</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            Disconnect
          </button>
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">Account: {savedAccountId}</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔗</span>
        <div>
          <h3 className="text-lg font-bold">Connect to HFM MT5</h3>
          <p className="text-sm text-[var(--muted)]">Real-time data from your broker</p>
        </div>
      </div>

      {step === "setup" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
            <h4 className="font-semibold mb-2">Setup Steps:</h4>
            <ol className="text-sm text-[var(--muted)] space-y-2">
              <li>1. Go to <a href="https://metaapi.cloud" target="_blank" className="text-[var(--accent)] underline">metaapi.cloud</a> and sign up (free tier available)</li>
              <li>2. Get your API token from the dashboard</li>
              <li>3. Paste your token below</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">MetaApi Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Paste your MetaApi token..."
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSetup}
            disabled={loading || !apiToken.trim()}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Continue"}
          </button>
        </div>
      )}

      {step === "account" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">MT5 Login (Account Number)</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="e.g., 12345678"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">MT5 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your MT5 password"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-[var(--muted)]">Server</label>
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="HFM-MT5">HFM-MT5</option>
              <option value="HFM-MT5-Cent">HFM-MT5-Cent</option>
              <option value="HFM-MT5-Real">HFM-MT5-Real</option>
              <option value="HFM-MT5-Demo">HFM-MT5-Demo</option>
              <option value="HFM-MT5-Edge">HFM-MT5-Edge</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("setup")}
              className="px-6 py-3 rounded-xl border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConnect}
              disabled={loading || !login || !password}
              className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? "Connecting..." : "Connect to HFM"}
            </button>
          </div>
        </div>
      )}

      {step === "deploying" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--muted)]">{deployStatus}</span>
          </div>
          <p className="text-xs text-[var(--muted)]">This may take up to 30 seconds on first connection.</p>
        </div>
      )}
    </div>
  );
}
