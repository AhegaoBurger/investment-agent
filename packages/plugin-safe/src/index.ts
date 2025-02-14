import type { Plugin } from "@elizaos/core";

import { supplyToAave } from "./actions/aaveSupply.ts";
import { withdraw } from "./actions/aaveWithdraw.ts";

import { stakeToEigen } from "./actions/eigenDeposit.ts";
import { stakeToAnkr } from "./actions/ankrDeposit.ts";

import { initiateAnkrWithdrawal } from "./actions/ankrWithdraw.ts";
import { initiateEigenWithdrawal } from "./actions/eigenWithdraw.ts";

import { estimateMemecoinPurchase } from "./actions/tradeLinex.ts";
import { evaluateBestMemecoin } from "./actions/getBestMeme.ts";
import { tradeToCowSwap } from "./actions/tradeToCowSwap.ts";

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
    stakeToEigen,
    stakeToAnkr,
    withdraw,
    initiateAnkrWithdrawal,
    initiateEigenWithdrawal,
    estimateMemecoinPurchase,
    evaluateBestMemecoin
  ],
  evaluators: [],
  providers: [balanceProvider, apyProvider, holeSkyBalanceProvider],
};
export default safePlugin;
