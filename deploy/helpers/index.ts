import { BigNumber } from "ethers";

export const colonizationCost = BigNumber.from("100000000000000000000");
export const initialCitadelCapacity = BigNumber.from("10000");

export const ironExtractorConfig = {
  rewards: BigNumber.from("100000000000000"),
  level: 2,
  delay: BigNumber.from(300),
  costs: [
    [1, BigNumber.from("100000000000000")],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
};
