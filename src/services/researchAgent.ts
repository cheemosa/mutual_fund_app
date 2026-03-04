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
): Promise<FundResearch> => {
  console.log(`Running research agent for ${mutualFundName}...`);
  const stockResearch: StockResearch[] = [];

  await Promise.all(
    topDraggers.map(async (stock) => {
      const news = await fetchStockNews(stock.symbol);
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
      console.log(
        `Researched ${stock.symbol}: ${analysis.outlook} - ${analysis.summary}`,
      );
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
        Top draggers and their outlook:
        ${stockResearch.map((s) => `- ${s.symbol} (${s.contribution.toFixed(3)}%): ${s.outlook}`).join("\n")}

        In 2-3 sentences, give an overall outlook on whether the fund's dip today appears to be a buying opportunity or a warning sign. Be specific and actionable.
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
