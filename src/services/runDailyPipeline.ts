import { prisma } from "../db/db";
import { generateDailySummary } from "../scripts/generateDailySummary";
import { ingestDailyPrices } from "../scripts/ingestPrices";
import { sendEmailReport } from "./sendEmailReport";

export const main = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailySummary.findFirst({
    where: { date: today },
  });

  if (existing) {
    console.log("Pipeline already ran today, skipping.");
    return;
  }

  await ingestDailyPrices();
  await generateDailySummary();
  await sendEmailReport();
};

main().catch((err) => {
  console.error("Error running daily pipeline:", err);
  process.exit(1);
});
