export const docsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .docs-root {
    --docs-bg: #0b0e1a;
    --docs-surface: #111622;
    --docs-surface-2: #181e2e;
    --docs-border: rgba(148,163,184,0.1);
    --docs-text: #e2e8f0;
    --docs-muted: #7f8ea3;
    --docs-accent: #4f8ef7;
    --docs-accent-glow: rgba(79,142,247,0.15);
    --docs-green: #34d399;
    --docs-red: #f87171;
    --docs-sidebar-w: 260px;
    --docs-font: 'Outfit', sans-serif;
    --docs-mono: 'JetBrains Mono', monospace;
    min-height: 100vh;
    background: var(--docs-bg);
    color: var(--docs-text);
    font-family: var(--docs-font);
  }

  /* Light mode overrides */
  :root:not(.dark) .docs-root {
    --docs-bg: #f5f7ff;
    --docs-surface: #ffffff;
    --docs-surface-2: #f0f4ff;
    --docs-border: rgba(15,23,42,0.1);
    --docs-text: #0f172a;
    --docs-muted: #5a6a83;
    --docs-accent: #2563eb;
    --docs-accent-glow: rgba(37,99,235,0.1);
  }

  /* ── Top bar ── */
  .docs-topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--docs-surface);
    border-bottom: 1px solid var(--docs-border);
    backdrop-filter: blur(12px);
  }
  .docs-topbar-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .docs-logo {
    font-family: var(--docs-font);
    font-weight: 800;
    font-size: 1.25rem;
    color: var(--docs-text);
    text-decoration: none;
    letter-spacing: -0.03em;
    margin-right: auto;
  }
  .docs-logo span {
    color: var(--docs-accent);
  }
  .docs-topnav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .docs-topnav-link {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--docs-muted);
    text-decoration: none;
    transition: all 0.15s;
  }
  .docs-topnav-link:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }

  .docs-menu-btn {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .docs-menu-btn span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--docs-muted);
    border-radius: 99px;
  }

  /* ── Layout ── */
  .docs-layout {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    min-height: calc(100vh - 60px);
  }

  /* ── Sidebar ── */
  .docs-sidebar {
    width: var(--docs-sidebar-w);
    flex-shrink: 0;
    border-right: 1px solid var(--docs-border);
    position: sticky;
    top: 60px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    background: var(--docs-surface);
  }
  .docs-sidebar-inner {
    padding: 28px 16px 48px;
  }
  .docs-sidebar-eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--docs-accent);
    margin-bottom: 20px;
    padding: 0 8px;
  }
  .docs-nav-group {
    margin-bottom: 24px;
  }
  .docs-nav-group-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--docs-muted);
    padding: 0 8px;
    margin-bottom: 4px;
  }
  .docs-nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .docs-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 7px 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--docs-muted);
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--docs-font);
  }
  .docs-nav-item:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }
  .docs-nav-item.active {
    background: var(--docs-accent-glow);
    color: var(--docs-accent);
    font-weight: 600;
  }

  /* ── Main ── */
  .docs-main {
    flex: 1;
    min-width: 0;
    padding: 0 48px 80px;
    max-width: 900px;
  }

  /* ── Hero ── */
  .docs-hero {
    padding: 56px 0 48px;
    border-bottom: 1px solid var(--docs-border);
    margin-bottom: 0;
  }
  .docs-hero-title {
    font-family: var(--docs-font);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--docs-text);
    margin: 16px 0 16px;
    line-height: 1.1;
  }
  .docs-hero-sub {
    font-size: 1.1rem;
    color: var(--docs-muted);
    max-width: 640px;
    line-height: 1.65;
    margin: 0 0 24px;
  }
  .docs-hero-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .docs-chip {
    padding: 6px 14px;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 99px;
    font-size: 0.8rem;
    color: var(--docs-muted);
    font-weight: 500;
  }

  /* ── Sections ── */
  .docs-section {
    padding: 56px 0 0;
    border-top: 1px solid var(--docs-border);
    margin-top: 0;
  }
  .docs-section:first-of-type {
    border-top: none;
  }
  .docs-section-title {
    font-family: var(--docs-font);
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--docs-text);
    margin-bottom: 20px;
  }
  .docs-h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--docs-text);
    margin: 28px 0 12px;
  }
  .docs-prose {
    font-size: 0.975rem;
    line-height: 1.75;
    color: var(--docs-muted);
    margin-bottom: 16px;
  }
  .docs-prose strong, .docs-prose em {
    color: var(--docs-text);
  }
  .docs-list {
    padding-left: 20px;
    margin: 0 0 16px;
    color: var(--docs-muted);
    font-size: 0.95rem;
    line-height: 1.75;
  }
  .docs-list--ordered {
    list-style: decimal;
  }
  .docs-list:not(.docs-list--ordered) {
    list-style: disc;
  }
  .docs-list li {
    margin-bottom: 6px;
  }
  .docs-list strong {
    color: var(--docs-text);
  }
  .docs-inline-code {
    font-family: var(--docs-mono);
    font-size: 0.82em;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 5px;
    padding: 1px 6px;
    color: var(--docs-accent);
  }
  .docs-inline-link {
    color: var(--docs-accent);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    font-size: inherit;
  }
  .docs-inline-link:hover {
    text-decoration: underline;
  }

  /* ── Code block ── */
  .docs-code-block {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--docs-border);
    margin: 16px 0 24px;
    background: #090d18;
  }
  :root:not(.dark) .docs-code-block {
    background: #1e2535;
  }
  .docs-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-code-lang {
    font-family: var(--docs-mono);
    font-size: 0.75rem;
    color: var(--docs-muted);
    letter-spacing: 0.04em;
  }
  .docs-copy-btn {
    background: none;
    border: 1px solid var(--docs-border);
    border-radius: 6px;
    color: var(--docs-muted);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 3px 10px;
    transition: all 0.15s;
    font-family: var(--docs-font);
  }
  .docs-copy-btn:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }
  .docs-code-pre {
    padding: 20px;
    overflow-x: auto;
    margin: 0;
    font-family: var(--docs-mono);
    font-size: 0.82rem;
    line-height: 1.65;
    color: #c3cfe8;
  }
  .docs-code-pre code {
    font-family: inherit;
    white-space: pre;
  }

  /* ── Callout ── */
  .docs-callout {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 18px;
    border-radius: 10px;
    border: 1px solid;
    font-size: 0.9rem;
    line-height: 1.65;
    margin: 16px 0 24px;
  }
  .docs-callout-icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .docs-callout-info {
    background: rgba(79,142,247,0.08);
    border-color: rgba(79,142,247,0.2);
    color: #93c5fd;
  }
  :root:not(.dark) .docs-callout-info {
    background: rgba(37,99,235,0.06);
    border-color: rgba(37,99,235,0.2);
    color: #1e40af;
  }
  .docs-callout-warning {
    background: rgba(251,191,36,0.08);
    border-color: rgba(251,191,36,0.2);
    color: #fcd34d;
  }
  :root:not(.dark) .docs-callout-warning {
    color: #92400e;
    background: rgba(251,191,36,0.1);
    border-color: rgba(251,191,36,0.3);
  }
  .docs-callout-tip {
    background: rgba(52,211,153,0.07);
    border-color: rgba(52,211,153,0.2);
    color: #6ee7b7;
  }
  :root:not(.dark) .docs-callout-tip {
    color: #065f46;
    background: rgba(52,211,153,0.08);
    border-color: rgba(52,211,153,0.25);
  }
  .docs-callout a, .docs-callout button {
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
  }

  /* ── Endpoint bar ── */
  .docs-endpoint-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    padding: 12px 18px;
    margin-bottom: 20px;
  }
  .docs-endpoint-path {
    font-family: var(--docs-mono);
    font-size: 0.9rem;
    color: var(--docs-text);
    flex: 1;
  }

  /* ── Response fields ── */
  .docs-fields {
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
    margin: 16px 0 24px;
  }
  .docs-response-field {
    padding: 16px 18px;
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-response-field:last-child {
    border-bottom: none;
  }
  .docs-field-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .docs-field-name {
    font-family: var(--docs-mono);
    font-size: 0.85rem;
    color: var(--docs-accent);
    background: var(--docs-accent-glow);
    padding: 2px 8px;
    border-radius: 5px;
    border: 1px solid rgba(79,142,247,0.2);
  }
  .docs-field-type {
    font-size: 0.78rem;
    color: var(--docs-muted);
    border: 1px solid var(--docs-border);
    padding: 1px 6px;
    border-radius: 5px;
    font-family: var(--docs-mono);
  }
  .docs-field-required {
    font-size: 0.72rem;
    color: #f87171;
    border: 1px solid rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.08);
    padding: 1px 8px;
    border-radius: 5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .docs-field-desc {
    font-size: 0.87rem;
    color: var(--docs-muted);
    line-height: 1.6;
    margin: 0;
  }

  /* ── Table ── */
  .docs-table-wrap {
    overflow-x: auto;
    margin: 16px 0 24px;
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
  }
  .docs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .docs-table th {
    text-align: left;
    padding: 12px 16px;
    background: var(--docs-surface-2);
    color: var(--docs-muted);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-table td {
    padding: 12px 16px;
    color: var(--docs-muted);
    border-bottom: 1px solid var(--docs-border);
    line-height: 1.55;
  }
  .docs-table tr:last-child td {
    border-bottom: none;
  }
  .docs-table code {
    font-family: var(--docs-mono);
    font-size: 0.8em;
    color: var(--docs-accent);
  }

  /* ── Status badges ── */
  .docs-status {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .docs-status--active {
    background: rgba(52,211,153,0.12);
    color: #34d399;
    border: 1px solid rgba(52,211,153,0.25);
  }

  /* ── Platform cards ── */
  .docs-platform-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin: 20px 0 24px;
  }
  .docs-platform-card {
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 12px;
    padding: 18px;
  }
  .docs-platform-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }
  .docs-platform-fields {
    font-size: 0.82rem;
    color: var(--docs-muted);
    margin-bottom: 10px;
    line-height: 1.7;
  }
  .docs-platform-fraud {
    font-size: 0.82rem;
    color: var(--docs-muted);
    line-height: 1.6;
  }
  .docs-platform-fraud strong {
    color: var(--docs-text);
  }

  /* ── Score grid ── */
  .docs-score-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
    margin: 16px 0 24px;
  }
  .docs-score-row {
    display: grid;
    grid-template-columns: 90px 80px 1fr;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--docs-border);
    font-size: 0.875rem;
  }
  .docs-score-row:last-child {
    border-bottom: none;
  }
  .docs-score-row p {
    color: var(--docs-muted);
    margin: 0;
  }
  .docs-score-row strong {
    color: var(--docs-text);
  }
  .docs-score-range {
    font-family: var(--docs-mono);
    font-size: 0.8em;
    color: var(--docs-accent);
    background: var(--docs-accent-glow);
    padding: 3px 8px;
    border-radius: 6px;
  }

  /* ── Footer ── */
  .docs-footer {
    margin-top: 80px;
    padding-top: 32px;
    border-top: 1px solid var(--docs-border);
    font-size: 0.85rem;
    color: var(--docs-muted);
    text-align: center;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .docs-sidebar {
      position: fixed;
      top: 60px;
      left: 0;
      height: calc(100vh - 60px);
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      z-index: 40;
      width: 280px;
      box-shadow: 4px 0 24px rgba(0,0,0,0.3);
    }
    .docs-sidebar.open {
      transform: translateX(0);
    }
    .docs-menu-btn {
      display: flex;
    }
    .docs-topnav {
      display: none;
    }
    .docs-main {
      padding: 0 20px 80px;
    }
    .docs-score-row {
      grid-template-columns: 80px 70px 1fr;
      gap: 10px;
    }
  }
`;
