interface SummaryWithFund {
  mutualFund: { name: string };
  signal: string;
  sentiment: string;
  movement: number;
  movementVsYesterday: number;
  cumulativeMovement: number;
  reason: string;
  aiSummary: string;
}

const signalConfig: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
  good:  { color: "#065f46", bg: "#d1fae5", border: "#6ee7b7", label: "GOOD ENTRY",  emoji: "✅" },
  avoid: { color: "#7f1d1d", bg: "#fee2e2", border: "#fca5a5", label: "AVOID",        emoji: "❌" },
  watch: { color: "#78350f", bg: "#fef3c7", border: "#fcd34d", label: "WATCH",        emoji: "👀" },
};

const sentimentConfig: Record<string, { label: string; emoji: string }> = {
  bullish: { label: "Bullish",  emoji: "📈" },
  bearish: { label: "Bearish",  emoji: "📉" },
  neutral: { label: "Neutral",  emoji: "➡️"  },
};

const movementColor = (val: number) =>
  val > 0 ? "#065f46" : val < 0 ? "#7f1d1d" : "#374151";

const movementBg = (val: number) =>
  val > 0 ? "#d1fae5" : val < 0 ? "#fee2e2" : "#f3f4f6";

const formatVal = (val: number) =>
  `${val >= 0 ? "+" : ""}${val.toFixed(3)}%`;

export const generateEmailHtml = (summaries: SummaryWithFund[], date: Date): string => {
  const goodSignals = summaries.filter((s) => s.signal === "good");

  const alertBanner = goodSignals.length > 0
    ? `<div style="background:#d1fae5;border:2px solid #6ee7b7;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Georgia',serif;font-size:15px;color:#065f46;font-weight:600;">
          🚨 ${goodSignals.length} fund${goodSignals.length > 1 ? "s" : ""} signal${goodSignals.length === 1 ? "s" : ""} a good entry today:
          ${goodSignals.map((s) => `<span style="text-decoration:underline;">${s.mutualFund.name}</span>`).join(", ")}
        </p>
        <p style="margin:6px 0 0;font-family:'Georgia',serif;font-size:13px;color:#065f46;">
          Remember to place your order before <strong>3:00 PM IST</strong> to get today's NAV.
        </p>
      </div>`
    : `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 20px;margin-bottom:28px;">
        <p style="margin:0;font-family:'Georgia',serif;font-size:14px;color:#6b7280;">
          No strong buy signals today. Stay patient and wait for a better entry.
        </p>
      </div>`;

  const fundCards = summaries.map((s) => {
    const sig = signalConfig[s.signal] ?? signalConfig.watch;
    const sent = sentimentConfig[s.sentiment] ?? sentimentConfig.neutral;

    return `
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        
        <!-- Fund name + signal badge -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div>
            <p style="margin:0 0 4px;font-family:'Georgia',serif;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Mutual Fund</p>
            <p style="margin:0;font-family:'Georgia',serif;font-size:16px;font-weight:700;color:#111827;">${s.mutualFund.name}</p>
          </div>
          <span style="background:${sig.bg};color:${sig.color};border:1px solid ${sig.border};padding:6px 14px;border-radius:999px;font-family:monospace;font-size:12px;font-weight:700;letter-spacing:0.5px;white-space:nowrap;">
            ${sig.emoji} ${sig.label}
          </span>
        </div>

        <!-- Stats row -->
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
          <div style="flex:1;min-width:100px;background:${movementBg(s.movement)};border-radius:8px;padding:10px 14px;text-align:center;">
            <p style="margin:0 0 2px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;">Today</p>
            <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:${movementColor(s.movement)};">${formatVal(s.movement)}</p>
          </div>
          <div style="flex:1;min-width:100px;background:${movementBg(s.movementVsYesterday)};border-radius:8px;padding:10px 14px;text-align:center;">
            <p style="margin:0 0 2px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;">vs Yesterday</p>
            <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:${movementColor(s.movementVsYesterday)};">${formatVal(s.movementVsYesterday)}</p>
          </div>
          <div style="flex:1;min-width:100px;background:${movementBg(s.cumulativeMovement)};border-radius:8px;padding:10px 14px;text-align:center;">
            <p style="margin:0 0 2px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;">5 Day Cumul.</p>
            <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:${movementColor(s.cumulativeMovement)};">${formatVal(s.cumulativeMovement)}</p>
          </div>
          <div style="flex:1;min-width:100px;background:#f9fafb;border-radius:8px;padding:10px 14px;text-align:center;">
            <p style="margin:0 0 2px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;">Sentiment</p>
            <p style="margin:0;font-family:monospace;font-size:15px;font-weight:700;color:#374151;">${sent.emoji} ${sent.label}</p>
          </div>
        </div>

        <!-- Reason -->
        <div style="background:#f9fafb;border-left:3px solid #d1d5db;border-radius:0 6px 6px 0;padding:10px 14px;margin-bottom:12px;">
          <p style="margin:0 0 2px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;">Signal Reason</p>
          <p style="margin:0;font-family:'Georgia',serif;font-size:13px;color:#374151;line-height:1.5;">${s.reason}</p>
        </div>

        <!-- Summary -->
        <p style="margin:0;font-family:'Georgia',serif;font-size:13px;color:#6b7280;line-height:1.7;">${s.aiSummary}</p>

      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>MF Daily Report</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Georgia',serif;">
  <div style="max-width:620px;margin:32px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background:#111827;border-radius:12px 12px 0 0;padding:28px 28px 24px;">
      <p style="margin:0 0 4px;font-family:monospace;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#6b7280;">Daily Report</p>
      <h1 style="margin:0 0 4px;font-family:'Georgia',serif;font-size:26px;font-weight:700;color:#f9fafb;">Mutual Fund Tracker</h1>
      <p style="margin:0;font-family:monospace;font-size:12px;color:#9ca3af;">${date.toDateString()} &nbsp;·&nbsp; ${summaries.length} fund${summaries.length !== 1 ? "s" : ""} tracked</p>
    </div>

    <!-- Body -->
    <div style="background:#f3f4f6;padding:24px 0;">
      ${alertBanner}
      ${fundCards}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:8px;">
      <p style="margin:0;font-family:monospace;font-size:11px;color:#9ca3af;">This is an automated report. Not financial advice.</p>
    </div>

  </div>
</body>
</html>`;
};
