import yahooFinance from "yahoo-finance2";
import { prisma } from "../db/db.ts";
import { MarketIndices } from "../types/types.ts";

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

export const fetchMarketIndices = async (): Promise<MarketIndices> => {
  try {
    const [niftyQuote, sensexQuote] = await Promise.all([
      yf.quote("^NSEI"),
      yf.quote("^BSESN"),
    ]);
    console.log(
      "Market Indices:",
      niftyQuote.regularMarketChangePercent,
      sensexQuote.regularMarketChangePercent,
    );
    return {
      nifty: niftyQuote.regularMarketPrice ?? 0,
      sensex: sensexQuote.regularMarketPrice ?? 0,
      niftyChange: niftyQuote.regularMarketChangePercent ?? 0,
      sensexChange: sensexQuote.regularMarketChangePercent ?? 0,
    };
  } catch (error) {
    console.error("Error fetching market indices:", error);
    return {
      nifty: 0,
      sensex: 0,
      niftyChange: 0,
      sensexChange: 0,
    };
  }
};
