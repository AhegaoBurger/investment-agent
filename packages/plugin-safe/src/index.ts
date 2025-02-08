import type { Plugin } from "@elizaos/core";

import { executeTransaction } from "./actions/executeTransaction.ts";

// export * as actions from "./actions";

export const bootstrapPlugin: Plugin = {
  name: "safe",
  description: "",
  actions: [executeTransaction],
  evaluators: [],
  providers: [],
};
export default bootstrapPlugin;
