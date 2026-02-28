/*
  Warnings:

  - You are about to drop the column `signalStrength` on the `DailySummary` table. All the data in the column will be lost.
  - Added the required column `movement` to the `DailySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `DailySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sentiment` to the `DailySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signal` to the `DailySummary` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailySummary" DROP COLUMN "signalStrength",
ADD COLUMN     "cumulativeMovement" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "movement" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "sentiment" TEXT NOT NULL,
ADD COLUMN     "signal" TEXT NOT NULL;
