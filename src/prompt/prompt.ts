import { StockContribution } from "../scripts/calculateMfMovement";

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
) => {
  return `
You are a financial assistant helping a retail investor decide whether to place a lump sum investment in a mutual fund before 3pm IST today.

Mutual Fund: ${mfName}

Movement Data:
- Today's movement: ${movement.toFixed(3)}%
- Change vs yesterday: ${movementVsYesterday.toFixed(3)}%
- Last 5 days movement (oldest to newest): ${recentMovements}
- Cumulative 5 day movement: ${cumulativeMovement.toFixed(3)}%

Top contributors today (pushing fund up):
${formatStockList(topContributors)}

Top draggers today (pulling fund down):
${formatStockList(topDraggers)}

Based on this data:
- Identify the trend (is it a sustained decline, recovery, volatile, etc.)
- Give a short specific reason grounded in the stock data above
- Give a sentiment: bullish, bearish, or neutral
- Give an investment timing signal:
  "good" =  fund is in a dip, good time to buy
  "avoid" = fund is rising or overheated, wait
  "watch" = unclear trend, monitor before deciding

Return ONLY valid JSON, no markdown, no explanation outside the JSON:

{
  "sentiment": "bullish" | "bearish" | "neutral",
   "signal": "good" | "avoid" | "watch",
   "reason": "one concise sentence grounded in the data above",
   "summary":"2-3 sentence paragraph explaining the trend and investment timing"
}
`;
};
