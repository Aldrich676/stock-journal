"use client";

import { useState } from "react";
import { type Trade } from "@/lib/trades";

interface Props {
  trades: Trade[];
}

export default function AIInsights({ trades }: Props) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const analyze = async (prompt: string) => {
    setLoading(true);
    setInsight("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades, prompt }),
      });
      const data = await res.json();
      setInsight(data.insight || "No insights generated.");
    } catch {
      setInsight("Failed to get insights. Make sure ANTHROPIC_API_KEY is set in .env.local");
    }
    setLoading(false);
  };

  const presets = [
    { label: "🎯 Analyze Mistakes", prompt: "Analyze my trading mistakes and patterns. What am I doing wrong?" },
    { label: "📋 Weekly Summary", prompt: "Give me a summary of my recent trading performance." },
    { label: "🧠 Emotional Patterns", prompt: "Analyze my emotional patterns. How does my mood affect my trades?" },
    { label: "💡 Suggestions", prompt: "Based on my trading history, what suggestions do you have for improvement?" },
    { label: "🇮🇩 IDX Analysis", prompt: "Analyze my Indonesian stock (IDX) trades specifically. What patterns do you see in the IDX market?" },
    { label: "🇺🇸 US Market Analysis", prompt: "Analyze my US market trades specifically. What patterns do you see?" },
  ];

  return (
    <div className="space-y-5 p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">AI Insights</h3>
        <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">Powered by Claude</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => analyze(p.prompt)}
            disabled={loading || trades.length === 0}
            className="px-4 py-2 rounded-full text-sm font-medium border border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your trades..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim()) {
              analyze(question);
              setQuestion("");
            }
          }}
        />
        <button
          onClick={() => {
            if (question.trim()) {
              analyze(question);
              setQuestion("");
            }
          }}
          disabled={loading || !question.trim() || trades.length === 0}
          className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ask
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-[var(--muted)] p-4 rounded-xl bg-[var(--background)]">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          Analyzing your trades...
        </div>
      )}

      {insight && (
        <div className="p-5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] whitespace-pre-wrap text-sm leading-relaxed">
          {insight}
        </div>
      )}

      {trades.length === 0 && !loading && (
        <div className="text-center py-8 rounded-xl border border-dashed border-[var(--card-border)]">
          <div className="text-3xl mb-2">🤖</div>
          <p className="text-[var(--muted)] text-sm">Add some trades first to get AI insights.</p>
        </div>
      )}
    </div>
  );
}
