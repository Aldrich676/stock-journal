"use client";

import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-[var(--card-border)] sticky top-0 z-40 backdrop-blur-md bg-[var(--background)]/80">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/stocks" className="text-base sm:text-lg font-bold tracking-tight hover:text-[var(--accent)] transition-colors">
          AI Stock Journal
        </a>

        <nav className="hidden sm:flex gap-6 text-sm font-medium text-[var(--muted)]">
          <a href="/stocks/assistant" className="hover:text-[var(--accent)] transition-colors">🇮🇩 Stocks</a>
          <a href="/trading/assistant" className="hover:text-[var(--accent)] transition-colors">💹 Trading</a>
          <a href="/history" className="hover:text-[var(--accent)] transition-colors">History</a>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-2 rounded-lg hover:bg-[var(--card)] transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="sm:hidden border-t border-[var(--card-border)] px-4 py-3 space-y-2">
          <a href="/stocks/assistant" className="block py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors">🇮🇩 Stocks (IDX)</a>
          <a href="/trading/assistant" className="block py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors">💹 Trading (Forex/Commodities)</a>
          <a href="/history" className="block py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)] transition-colors">History</a>
        </nav>
      )}
    </header>
  );
}
