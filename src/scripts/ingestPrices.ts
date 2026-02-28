import yahooFinance from "yahoo-finance2";
import { prisma } from "../db/db.ts";

const yf = new yahooFinance();

export const ingestDailyPrices = async () => {
  const stocks = await prisma.stock.findMany({
    select: { symbol: true, id: true },
  });
  const symbolMap = new Map<string, string[]>();

  for (const stock of stocks) {
    const existing = symbolMap.get(stock.symbol) ?? [];
    symbolMap.set(stock.symbol, [...existing, stock.id]);
  }

  await Promise.all(
    Array.from(symbolMap.entries()).map(async ([symbol, stockIds]) => {
      try {
        const quote = await yf.quote(`${symbol}.NS`);
        const price = quote.regularMarketPrice;
        const changePercent = quote.regularMarketChangePercent;
        if (price == null || changePercent == null) {
          console.warn(
            `Missing price or changePercent for ${symbol}, skipping.`,
          );
          return;
        }
        await prisma.stockMovement.createMany({
          data: stockIds.map((stockId) => ({
            stockId,
            symbol,
            price,
            change: changePercent,
          })),
        });
        console.log(
          `Processed ${symbol}: Price ${price}, Change ${changePercent}%`,
        );
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      }
    }),
  );
  console.log("Finished processing all stocks.");
};
