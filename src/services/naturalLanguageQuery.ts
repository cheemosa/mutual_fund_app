import Groq from "groq-sdk";
import { prisma } from "../db/db";
import dotenv from "dotenv";

dotenv.config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DB_SCHEMA = `
You have access to a PostgreSQL database with the following tables:

"MutualFund": "id" (String), "name" (String)

"Stock": "id" (String), "symbol" (String), "weight" (Float), "updatedAt" (DateTime), "mutualFundId" (String)

"StockMovement": "id" (String), "symbol" (String), "price" (Float), "change" (Float), "createdAt" (DateTime), "stockId" (String)

"DailySummary": "id" (String), "date" (DateTime), "mutualFundId" (String), "movement" (Float), "movementVsYesterday" (Float), "cumulativeMovement" (Float), "sentiment" (String), "signal" (String), "reason" (String), "aiSummary" (String), "invested" (Boolean)

Relationships:
- "DailySummary"."mutualFundId" → "MutualFund"."id"
- "Stock"."mutualFundId" → "MutualFund"."id"
- "StockMovement"."stockId" → "Stock"."id"

CRITICAL: ALL table names and column names are case sensitive and MUST always be wrapped in double quotes exactly as shown above. For example:
- CORRECT: SELECT "MutualFund"."name" FROM "MutualFund"
- CORRECT: JOIN "MutualFund" ON "DailySummary"."mutualFundId" = "MutualFund"."id"
- WRONG: SELECT MutualFund.name FROM MutualFund
- WRONG: JOIN MutualFund ON DailySummary.mutualFundId = MutualFund.id

Other notes:
- signal values are: "good", "avoid", "watch"
- sentiment values are: "bullish", "bearish", "neutral"
- dates are stored as UTC timestamps
- movement is a weighted percentage change for that day
- cumulativeMovement is the 5 day rolling sum
`;

const generateSQL = async (question: string): Promise<string> => {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a PostgreSQL expert. Given a question about mutual fund data, generate a single valid SQL SELECT query.
                ${DB_SCHEMA}
                Rules:
                - Return ONLY the SQL query, nothing else
                - No markdown, no explanation, no code fences
                - Only SELECT queries, never INSERT/UPDATE/DELETE
                - Always join MutualFund when showing fund data so the name is visible
                - Limit results to 20 rows max
                - Use table names exactly as shown above (case sensitive, use double quotes e.g. "DailySummary")
                - For date comparisons use NOW() and INTERVAL
                `,
        },
        {
          role: "user",
          content: question,
        },
      ],
    });
    return response.choices[0].message.content?.trim() ?? "";
  } catch (error) {
    console.error("Error generating SQL:", error);
    return "Error generating SQL";
  }
};

const summarizeResults = async (
  question: string,
  sql: string,
  results: any[],
): Promise<string> => {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a financial assistant. Given a question, the SQL query that was run, and the results, provide a clear and concise answer in 2-3 sentences. Be specific about fund names, dates, and numbers.",
        },
        {
          role: "user",
          content: `Question: ${question}
                   SQL run: ${sql}
                   Results: ${JSON.stringify(results, null, 2)}

                   Answer the question based on the results.
        `,
        },
      ],
    });
    return (
      response.choices[0].message.content?.trim() ?? "Could not generate answer"
    );
  } catch (error) {
    console.error("Error summarizing results:", error);
    return "Error summarizing results";
  }
};

export const runNaturalLanguageQuery = async (question: string) => {
  const sql = await generateSQL(question);
  console.log("Generated SQL:", sql);

  const cleaned = sql.trim().toUpperCase();

  if (!cleaned.startsWith("SELECT")) {
    throw new Error("Generated SQL is not a SELECT query");
  }

  const results = await prisma.$queryRawUnsafe(sql);

  const answer = await summarizeResults(question, sql, results as any[]);
  

  return {
    question,
    sql,
    results,
    answer,
  };
};
