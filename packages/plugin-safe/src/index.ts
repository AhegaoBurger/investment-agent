import type { Plugin } from "@elizaos/core";

import { stake } from "./actions/stake.ts";

// export * as actions from "./actions";

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [stake],
  evaluators: [],
  providers: [],
};
export default safePlugin;
