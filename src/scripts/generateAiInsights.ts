import { prisma } from "../db/db";

export const generateAiInsights = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summaries = await prisma.dailySummary.findMany({
    where: { date: today },
    include: { mutualFund: true },
  });

  return summaries.map((summary) => {
    return {
      mfName: summary.mutualFund.name,
      delta: summary.movementVsYesterday,
      strength: summary.signalStrength,
    };
  });
};
