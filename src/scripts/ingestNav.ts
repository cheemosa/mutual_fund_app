import axios from "axios";
import { prisma } from "../db/db";

const fetchAmfiNav = async (): Promise<Map<string, number>> => {
  const response = await axios.get(
    "https://www.amfiindia.com/spages/NAVAll.txt",
  );

  const navMap = new Map<string, number>();
  const lines = response.data.split("\n");

  for (const line of lines) {
    const parts = line.split(";");
    if (parts.length < 5) continue;

    const schemeCode = parts[0].trim();
    const nav = parseFloat(parts[4].trim());
    if (schemeCode && !isNaN(nav)) {
      navMap.set(schemeCode, nav);
    }
  }
  return navMap;
};

export const ingestNav = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.navEntry.findFirst({
    where: { date: today },
  });

  if (existing) {
    console.log("NAV already ingested today, skipping");
    return;
  }

  const navMap = await fetchAmfiNav();

  const funds = await prisma.mutualFund.findMany();

  for (const fund of funds) {
    const todayNav = navMap.get(fund.id);

    if (!todayNav) {
      console.error(`NAV not found for fund ${fund.name} (${fund.id})`);
      continue;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayEntry = await prisma.navEntry.findFirst({
      where: {
        mutualFundId: fund.id,
        date: { lt: today },
      },
      orderBy: { date: "desc" },
    });

    const actualChange = yesterdayEntry
      ? ((todayNav - yesterdayEntry.nav) / yesterdayEntry.nav) * 100
      : 0;

    const todaySummary = await prisma.dailySummary.findFirst({
      where: { mutualFundId: fund.id, date: today },
    });
    const estimatedChange = todaySummary?.movement ?? 0;
    const accuracy = Math.abs(estimatedChange - actualChange);

    await prisma.navEntry.create({
      data: {
        date: today,
        mutualFundId: fund.id,
        nav: todayNav,
        actualChange,
        estimatedChange,
        accuracy,
      },
    });
    console.log(
      `${fund.name}: NAV ${todayNav}, Actual Change ${actualChange.toFixed(2)}%, Estimated Change ${estimatedChange.toFixed(2)}%, Accuracy ${accuracy.toFixed(2)}%`,
    );
  }
  console.log("NAV ingestion completed");
};
