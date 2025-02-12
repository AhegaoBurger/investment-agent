import type { Plugin } from "@elizaos/core";

import { stake } from "./actions/stake.ts";
// import { checkPositions } from "./actions/checkBalance.ts";
import { balanceProvider } from "./providers/checkBalance.ts";
export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [stake],
  evaluators: [],
  providers: [balanceProvider],
};
export default safePlugin;
