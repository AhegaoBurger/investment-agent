import type { Plugin } from "@elizaos/core";

import { executeTransaction } from "./actions/executeTransaction.ts";

// export * as actions from "./actions";

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [executeTransaction],
  evaluators: [],
  providers: [],
};
export default safePlugin;
