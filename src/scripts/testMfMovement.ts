import { calculateMfMovement } from "./calculateMfMovement";

const main = async () => {
  const movements = await calculateMfMovement();
  console.log("Mutual Fund Movements:");
  movements.forEach((mf) => {
    console.log(
      `- ${mf.mutualFundName} (ID: ${mf.mutualFundId}): Movement = ${mf.movement.toFixed(2)}%`,
    );
  });
};

main();
