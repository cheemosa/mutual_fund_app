-- AlterTable
ALTER TABLE "DailySummary" ADD COLUMN     "reentryReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reentrySignal" TEXT NOT NULL DEFAULT 'partial';
