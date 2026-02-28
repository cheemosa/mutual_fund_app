import csv from "csvtojson";
import { prisma } from "../db/db";
import path from "path";

const readExcel = async (fileName: string) => {
  const json = await csv().fromFile(fileName);
  return json;
};

const seedStocks = async (filePath: string, mutualFundId: string) => {
  const rows: any[] = await readExcel(filePath);

  for (const row of rows) {
    if (row["NSE_Symbol"] == "NOT_FOUND") continue;
    await prisma.stock.create({
      data: {
        symbol: row["NSE_Symbol"],
        weight: parseFloat(row["MF_Holding_Percent"].replace("%", "").trim()),
        updatedAt: new Date(),
        mutualFundId: mutualFundId,
      },
    });
  }
};

const main = async () => {
  const basePath = path.join(
    __dirname,
    "../../../webscraper/mapped_portfolios",
  );
  await seedStocks(
    path.join(basePath, "Bandhan_Small_Cap_Fund_with_NSE_Symbols.csv"),
    "147946",
  );
  await seedStocks(
    path.join(basePath, "HDFC_Flexi_Cap_Fund_with_NSE_Symbols.csv"),
    "118955",
  );
  await seedStocks(
    path.join(basePath, "Nippon_India_Multi_Cap_Fund_with_NSE_Symbols.csv"),
    "118650",
  );

  console.log("Stocks seeded successfully.");
};

main().finally(() => prisma.$disconnect());
