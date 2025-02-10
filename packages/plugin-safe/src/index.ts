import type { Plugin } from "@elizaos/core";

import { stake } from "./actions/stake.ts";
import { checkPositions } from "./actions/checkBalance.ts";
// export * as actions from "./actions";

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [stake, checkPositions],
  evaluators: [],
  providers: [],
};
export default safePlugin;
