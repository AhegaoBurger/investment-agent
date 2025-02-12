import type { Plugin } from "@elizaos/core";

import { stake } from "./actions/stake.ts";
import { tradeToCowSwap } from "./actions/tradeToCowSwap.ts";
import { balanceProvider } from "./providers/checkBalance.ts";
import { apyProvider } from "./providers/getApy.ts";

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [stake, tradeToCowSwap],
  evaluators: [],
  providers: [balanceProvider, apyProvider],
};
export default safePlugin;
