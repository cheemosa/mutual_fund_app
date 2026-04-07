import { StockContribution } from "../scripts/calculateMfMovement";
import { FundResearch } from "../services/researchAgent";
import { MarketIndices } from "../types/types";

const formatStockList = (stocks: StockContribution[]) => {
  return stocks
    .map(
      (s) =>
        `${s.symbol} (contribution: ${s.contribution.toFixed(3)}%, stock change: ${s.change.toFixed(3)}%)`,
    )
    .join(", ");
};

export const mfInsightPrompt = (
  mfName: string,
  movement: number,
  movementVsYesterday: number,
  cumulativeMovement: number,
  recentMovements: string,
  topDraggers: StockContribution[],
  topContributors: StockContribution[],
  indices: MarketIndices,
  research: FundResearch,
) => {
  const temporaryCount = research.stockResearch.filter(
    (s) => s.outlook === "temporary"
  ).length;
  const structuralCount = research.stockResearch.filter(
    (s) => s.outlook === "structural"
  ).length;
  const totalResearched = research.stockResearch.length;

  const signalRule =
    cumulativeMovement > 0
      ? `MANDATORY: cumulativeMovement is POSITIVE (${cumulativeMovement.toFixed(3)}%). signal MUST be "watch" or "avoid". NEVER "good". reentrySignal MUST be "no". The dip has passed.`
      : cumulativeMovement > -2
      ? `MANDATORY: cumulativeMovement is mildly negative (${cumulativeMovement.toFixed(3)}%). signal can be "watch". reentrySignal can be "partial" at most. Do not signal "good" unless there is very strong evidence of continued decline.`
      : `MANDATORY: cumulativeMovement is significantly negative (${cumulativeMovement.toFixed(3)}%). signal can be "good" if draggers are temporary and macro context supports it. reentrySignal can be "yes".`;

  return `
You are a financial assistant helping a retail investor decide whether to place a lump sum investment in a mutual fund before 3pm IST today.

Your job is to give ONE coherent, consistent view across signal, re-entry, and summary. Do not contradict yourself across fields.

Mutual Fund: ${mfName}

=== HARD RULES — FOLLOW THESE BEFORE ANYTHING ELSE ===
${signalRule}
- If signal is "watch" or "avoid", summary must NOT suggest investing today
- If reentrySignal is "no", reentryReason must clearly explain the dip has passed
- Today's movement being positive does NOT make it a good entry if cumulative is positive
- Broad market recovery does NOT override cumulative as the primary indicator
- Never contradict the signal in the summary or reentryReason

=== MARKET DATA ===
Broad Market:
- Nifty 50: ${indices.nifty.toFixed(0)} (${indices.niftyChange.toFixed(2)}% today)
- Sensex: ${indices.sensex.toFixed(0)} (${indices.sensexChange.toFixed(2)}% today)

Fund Movement:
- Today's movement: ${movement.toFixed(3)}%
- Change vs yesterday: ${movementVsYesterday.toFixed(3)}%
- Last 5 days (oldest to newest): ${recentMovements}
- Cumulative 5 day movement: ${cumulativeMovement.toFixed(3)}%

Top contributors today (pushing fund up):
${formatStockList(topContributors)}

Top draggers today (pulling fund down):
${formatStockList(topDraggers)}

=== RESEARCH FINDINGS ===
- ${temporaryCount} of ${totalResearched} top draggers are temporary
- ${structuralCount} of ${totalResearched} top draggers are structural
- Research outlook: ${research.overallOutlook}

=== SIGNAL DEFINITIONS ===
signal:
- "good" = fund is in a meaningful dip (cumulative below -2%), draggers are temporary, good entry point
- "watch" = cumulative is mildly negative or mixed signals, monitor before deciding
- "avoid" = cumulative is positive (dip has passed) or structural issues present

reentrySignal (for someone who already invested in last 5 days):
- "yes" = cumulative still deeply negative, fund still in dip, good to invest more
- "partial" = cumulative mildly negative, invest a smaller amount
- "no" = cumulative is positive or fund has recovered, wait for next dip

=== OUTPUT FORMAT ===
Return ONLY valid JSON, no markdown, no explanation outside JSON:

{
  "sentiment": "bullish" | "bearish" | "neutral",
  "signal": "good" | "avoid" | "watch",
  "reason": "one concise sentence grounded in cumulative movement and market data",
  "reentrySignal": "yes" | "no" | "partial",
  "reentryReason": "one sentence explaining re-entry based on cumulative movement — be direct, not hedging",
  "summary": "2-3 sentences that are fully consistent with signal and reentrySignal. If signal is watch/avoid, do not suggest investing. Reference actual numbers."
}
`;
};
