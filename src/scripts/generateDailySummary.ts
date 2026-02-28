import { prisma } from "../db/db";
import { mfInsightPrompt } from "../prompt/prompt";
import { calculateMfMovement } from "./calculateMfMovement";
import { generateAISummary } from "./generateAISummary";

export const generateDailySummary = async () => {
  const movements = await calculateMfMovement();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await Promise.all(
    movements.map(async (mf) => {
      const recentSummaries = await prisma.dailySummary.findMany({
        where: {
          mutualFundId: mf.mutualFundId,
          date: { lt: today },
        },
        orderBy: { date: "desc" },
        take: 5,
      });
      const yesterdayEntry = recentSummaries[0] ?? null;
      const recentMovements = recentSummaries
        .map((s) => s.movement.toFixed(3))
        .reverse()
        .join(", ");

      const movementVsYesterday = yesterdayEntry
        ? mf.movement - yesterdayEntry.movement
        : 0;

      const pastCumulativeMovement = recentSummaries.reduce(
        (sum, s) => sum + s.movement,
        0,
      );
      const cumulativeMovement = pastCumulativeMovement + mf.movement;
      const aiSummary = await generateAISummary(
        mfInsightPrompt(
          mf.mutualFundName,
          mf.movement,
          movementVsYesterday,
          cumulativeMovement,
          recentMovements,
          mf.topDraggers,
          mf.topContributors,
        ),
      );
      console.log(`Generated summary for ${mf.mutualFundName}:`, aiSummary);

      await prisma.dailySummary.create({
        data: {
          date: today,
          mutualFundId: mf.mutualFundId,
          movement: mf.movement,
          movementVsYesterday,
          cumulativeMovement,
          sentiment: aiSummary.sentiment,
          signal: aiSummary.signal,
          reason: aiSummary.reason,
          aiSummary: aiSummary.summary,
          invested: false,
        },
      });
    }),
  );
  console.log("Daily summary generated for all mutual funds.");
};
