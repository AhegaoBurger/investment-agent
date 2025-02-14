import type { Plugin } from "@elizaos/core";

import { supplyToAave } from "./actions/aaveSupply.ts";
import { tradeToCowSwap } from "./actions/tradeToCowSwap.ts";
import { stakeToAnkrAndEigen } from "./actions/eigenDeposit.ts";
import { withdraw } from "./actions/aaveWithdraw.ts";
import { initiateAnkrWithdrawal } from "./actions/ankrWithdraw.ts";
import { initiateEigenWithdrawal } from "./actions/eigenWithdraw.ts";
import { estimateMemecoinPurchase } from "./actions/tradeLinex.ts";

import { balanceProvider } from "./providers/checkBalance.ts";
import { apyProvider } from "./providers/getApy.ts";
import { holeSkyBalanceProvider} from "./providers/holeskyCheckBalance.ts"

export const safePlugin: Plugin = {
  name: "safe",
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  actions: [
    supplyToAave,
    tradeToCowSwap,
    stakeToAnkrAndEigen,
    withdraw,
    initiateAnkrWithdrawal,
    initiateEigenWithdrawal,
    estimateMemecoinPurchase,
  ],
  evaluators: [],
  providers: [balanceProvider, apyProvider],
};
export default safePlugin;
