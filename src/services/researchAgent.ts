import { Groq } from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";

dotenv.config();

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface StockResearch {
  symbol: string;
  contribution: number;
  news: string;
  outlook: string;
}

export interface FundResearch {
  mutualFundName: string;
  overallOutlook: string;
  stockResearch: StockResearch[];
}

const fetchStockNews = async (symbol: string): Promise<string> => {
  try {
    const result = await tavilyClient.search(
      `${symbol} NSE India stock news today reason for movement`,
      {
        searchDepth: "basic",
        maxResults: 3,
      },
    );
    return result.results
      .map((res) => `- ${res.title}: ${res.content.slice(0, 200)}`)
      .join("\n");
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return "No recent news found.";
  }
};

export const fetchMacroNews = async (): Promise<string> => {
  try {
    const result = await tavilyClient.search(
      "India stock market today reason for fall rise NSE BSE",
      {
        searchDepth: "basic",
        maxResults: 3,
      },
    );
    return result.results
      .map((r) => `- ${r.title}: ${r.content.slice(0, 200)}`)
      .join("\n");
  } catch (error) {
    console.error("Error fetching macro news:", error);
    return "No macro news available.";
  }
};

const analyzeStock = async (
  symbol: string,
  contribution: number,
  news: string,
): Promise<{ outlook: string; summary: string }> => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a financial analyst. Given a stock's movement and recent news, determine if the dip is temporary or structural. Be concise and specific",
      },
      {
        role: "user",
        content: `Stock: ${symbol}
                Contribution to Fund: ${contribution.toFixed(3)}%
                Recent news:
                ${news}

                In 1-2 sentences, explain why this stock moved and whether it is:
                - temporary (short term event, likely to recover)
                - structural (fundamental issue, may not recover)
                - unclear (not enough info)

                Return ONLY valid JSON:
                {
                  "outlook": "temporary" | "structural" | "unclear",
                  "summary": "one sentence explanation"
                }
            `,
      },
    ],
  });
  try {
    const content = response.choices[0].message.content?.trim() ?? "";
    const cleaned = content?.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`Error analyzing stock ${symbol}:`, error);
    return { outlook: "unclear", summary: "Could not analyze movement." };
  }
};

export const runResearchAgent = async (
  mutualFundName: string,
  topDraggers: { symbol: string; contribution: number }[],
  macroNews: string,
): Promise<FundResearch> => {
  console.log(`Running research agent for ${mutualFundName}...`);
  const stockResearch: StockResearch[] = [];

  const stockNewsResults = await Promise.all(
    topDraggers.map((stock) => fetchStockNews(stock.symbol)),
  );

  console.log("Fetched macro news and stock news for research agent.");

  await Promise.all(
    topDraggers.map(async (stock, index) => {
      const news = stockNewsResults[index];
      const analysis = await analyzeStock(
        stock.symbol,
        stock.contribution,
        news,
      );
      stockResearch.push({
        symbol: stock.symbol,
        contribution: stock.contribution,
        news,
        outlook: analysis.outlook,
      });
      console.log(`Researched ${stock.symbol}:`, analysis);
    }),
  );

  const overallResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a financial analyst summarizing research for a retail investor deciding whether to invest in a mutual fund today.",
      },
      {
        role: "user",
        content: `Fund: ${mutualFundName}

        Broad market context today:
        ${macroNews}

        Top draggers and their outlook:
        ${stockResearch.map((s) => `- ${s.symbol} (${s.contribution.toFixed(3)}%): ${s.outlook}`).join("\n")}

        In 2-3 sentences, give an overall outlook considering both the macro environment and individual stock movements. Clearly state whether the dip is macro-driven (broad market selloff), stock-specific, or a mix. Then say whether this is a buying opportunity (good time to invest) or a warning sign and why.
        `,
      },
    ],
  });
  const overallOutlook =
    overallResponse.choices[0].message.content?.trim() ??
    "Could not generate overall outlook.";

  return {
    mutualFundName,
    overallOutlook,
    stockResearch,
  };
};
