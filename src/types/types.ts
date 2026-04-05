export type AISummaryType = {
  sentiment: string;
  signal: string;
  reason: string;
  reentryReason: string;
  reentrySignal: string;
  summary: string;
};

export interface MarketIndices {
  nifty: number;
  sensex: number;
  niftyChange: number;
  sensexChange: number;
}
