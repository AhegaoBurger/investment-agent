import type { Plugin } from "@elizaos/core";

import { supplyToAave } from "./actions/aaveSupply.ts";
import { tradeToCowSwap } from "./actions/tradeToCowSwap.ts";
import { stakeToAnkrAndEigen } from "./actions/eigenDeposit.ts";

import { balanceProvider } from "./providers/checkBalance.ts";
import { apyProvider } from "./providers/getApy.ts";

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [supplyToAave, tradeToCowSwap, stakeToAnkrAndEigen],
  evaluators: [],
  providers: [balanceProvider, apyProvider],
};
export default safePlugin;
