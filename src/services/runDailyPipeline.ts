import { generateDailySummary } from "../scripts/generateDailySummary";
import { ingestDailyPrices } from "../scripts/ingestPrices";
import { sendEmailReport } from "./sendEmailReport";

export const main = async () => {
  // await ingestDailyPrices();
  // await generateDailySummary();
  await sendEmailReport();
};

main().catch((err) => {
  console.error("Error running daily pipeline:", err);
  process.exit(1);
});
