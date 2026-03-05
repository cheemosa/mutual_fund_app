-- CreateTable
CREATE TABLE "NavEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mutualFundId" TEXT NOT NULL,
    "nav" DOUBLE PRECISION NOT NULL,
    "actualChange" DOUBLE PRECISION NOT NULL,
    "estimatedChange" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NavEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NavEntry_mutualFundId_date_key" ON "NavEntry"("mutualFundId", "date");

-- AddForeignKey
ALTER TABLE "NavEntry" ADD CONSTRAINT "NavEntry_mutualFundId_fkey" FOREIGN KEY ("mutualFundId") REFERENCES "MutualFund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
