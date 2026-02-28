import { prisma } from "../db/db";

export interface StockContribution {
  symbol: string;
  contribution: number;
  change: number;
}

export interface MfMovementResult {
  mutualFundId: string;
  mutualFundName: string;
  movement: number;
  topDraggers: StockContribution[];
  topContributors: StockContribution[];
}

export const calculateMfMovement = async (): Promise<MfMovementResult[]> => {
  const mutualFunds = await prisma.mutualFund.findMany({
    include: {
      stocks: {
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
  const result: MfMovementResult[] = [];

  for (const mf of mutualFunds) {
    let totalMovement = 0;
    const contributions: StockContribution[] = [];

    for (const stock of mf.stocks) {
      const latestMove = stock.movements[0];
      if (!latestMove) continue;

      const contribution = (stock.weight / 100) * latestMove.change;
      totalMovement += contribution;

      contributions.push({
        symbol: stock.symbol,
        contribution: parseFloat(contribution.toFixed(4)),
        change: parseFloat(latestMove.change.toFixed(4)),
      });
    }
    const topDraggers = [...contributions]
      .sort((a, b) => a.contribution - b.contribution)
      .slice(0, 3);
    const topContributors = [...contributions]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
    result.push({
      mutualFundId: mf.id,
      mutualFundName: mf.name,
      movement: totalMovement,
      topDraggers,
      topContributors,
    });
  }
  return result;
};
