import { prisma } from "../db/db.ts";

const main = async () => {
  await prisma.mutualFund.createMany({
    data: [
      {
        name: "HDFC Flexi Cap Fund(G)-Direct Plan",
        id: "118955",
      },
      {
        name: "Bandhan Small Cap Fund(G)-Direct Plan",
        id: "147946",
      },
      {
        name: "Nippon India Multi Cap Fund(G)-Direct Plan",
        id: "118650",
      },
    ],
    skipDuplicates: true,
  });
  console.log("Mutual funds seeded successfully.");
};

main().finally(()=>prisma.$disconnect());
