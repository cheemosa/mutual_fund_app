import { Resend } from "resend";
import { prisma } from "../db/db";
import { generateEmailHtml } from "./emailTemplate";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailReport = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summaries = await prisma.dailySummary.findMany({
    where: { date: today },
    include: { mutualFund: true },
    orderBy: { signal: "asc" }, // "good" comes first
  });

  if (summaries.length === 0) {
    console.log("No summaries found for today, skipping email.");
    return;
  }

  const goodSignals = summaries.filter((s) => s.signal === "good");

  const subject =
    goodSignals.length > 0
      ? `🚨 ${goodSignals.length} fund(s) good to invest today — MF Report ${today.toDateString()}`
      : `👀 No strong signals today — MF Report ${today.toDateString()}`;

  const html = generateEmailHtml(summaries, today);

  await resend.emails.send({
    from: process.env.FROM_MAIL!,
    to: process.env.TO_MAIL!,
    subject,
    html,
  });

  console.log("Email report sent successfully.");
};
