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
    (s) => s.outlook === "temporary",
  ).length;
  const structuralCount = research.stockResearch.filter(
    (s) => s.outlook === "structural",
  ).length;
  const totalResearched = research.stockResearch.length;
  return `
You are a financial assistant helping a retail investor decide whether to place a lump sum investment in a mutual fund before 3pm IST today.

Mutual Fund: ${mfName}

Broad Market Context:
- Nifty 50: ${indices.nifty.toFixed(0)} (${indices.niftyChange.toFixed(2)}% today)
- Sensex: ${indices.sensex.toFixed(0)} (${indices.sensexChange.toFixed(2)}% today)

Movement Data:
- Today's movement: ${movement.toFixed(3)}%
- Change vs yesterday: ${movementVsYesterday.toFixed(3)}%
- Last 5 days movement (oldest to newest): ${recentMovements}
- Cumulative 5 day movement: ${cumulativeMovement.toFixed(3)}%

Top contributors today (pushing fund up):
${formatStockList(topContributors)}

Top draggers today (pulling fund down):
${formatStockList(topDraggers)}

Research Agent Findings:
- ${temporaryCount} of ${totalResearched} top draggers have temporary outlooks
- ${structuralCount} of ${totalResearched} top draggers have structural issues
- Overall research outlook: ${research.overallOutlook}

Signal guidance based on research:
- If most draggers are temporary AND broad market is also down → strong "good" signal, macro dip is a buying opportunity
- If most draggers are structural → "avoid" or "watch", fundamental issues present
- If mixed → "watch", monitor before deciding
- If fund is falling significantly MORE than Nifty/Sensex → warning sign, be cautious

Based on this data:
- Identify the trend considering the broad market context and research findings
- Give a short specific reason grounded in actual data
- Give a sentiment: bullish, bearish, or neutral
- Re-entry Analysis:
  Looking at the last 5 days movement: ${recentMovements}
  - If the fund has continued to dip after a previous dip, "yes" — good to invest more
  - If the fund has recovered significantly after a dip, "no" — wait for next dip  
  - If mixed signals, "partial" — invest a smaller amount than usual
  - Provide a reentrySignal ("yes", "no", "partial") and a reentryReason explaining whether someone who already invested in the last 5 days should invest again today.
- Give a clear investment timing signal:
  "good" = dip is macro/temporary driven, good entry point
  "avoid" = structural issues or fund overheated
  "watch" = mixed signals, monitor before deciding

Return ONLY valid JSON, no markdown, no explanation outside the JSON:

{
  "sentiment": "bullish" | "bearish" | "neutral",
   "signal": "good" | "avoid" | "watch",
   "reason": "one concise sentence grounded in market data and research findings",
   "reentrySignal": "yes" | "no" | "partial",
   "reentryReason": "one sentence explaining if someone who invested in last 5 days should invest more today",
   "summary":"2-3 sentence paragraph explaining the trend, research findings, and clear investment recommendation"
}
`;
};
