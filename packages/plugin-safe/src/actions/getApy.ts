import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  composeContext,
  generateObjectDeprecated,
  type HandlerCallback,
  ModelClass,
  type State,
} from "@elizaos/core";

import Safe from "@safe-global/protocol-kit";

import { encodeFunctionData } from "viem";
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
import { UsdtTokenAbi } from "../abi/UsdtToken";
import { DaiTokenAbi } from "../abi/DaiToken";

import { stakeTemplate } from "../templates";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import type { StakeParams, StakeResponse } from "../types";
import { ethers } from "ethers";

const buildStakeDetails = async (
  state: State,
  runtime: IAgentRuntime
): Promise<StakeParams> => {
  const context = composeContext({
    state,
    template: stakeTemplate,
  });

  console.log("context: ", context);

  const stakeDetails = (await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL,
  })) as StakeParams;

  console.log("stakeDetails: ", stakeDetails);

  return stakeDetails;
};

const TOKEN_CONFIG = {
  USDC: {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    abi: UsdcTokenAbi,
    decimals: 6,
  },
  USDT: {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    abi: UsdtTokenAbi,
    decimals: 6,
  },
  DAI: {
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    abi: DaiTokenAbi,
    decimals: 18,
  },
  // WETH: {
  //   address: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  //   abi: WethTokenAbi,
  // },
} as const;

type TokenSymbol = keyof typeof TOKEN_CONFIG;

type TokenConfig = {
  address: string;
  abi: any;
  decimals: number;
};

type TokenConfigMap = {
  [key: string]: TokenConfig;
};

type ApyResult = {
  token: string;
  supplyAPY: number;
  variableBorrowAPY: number;
  decimals: number;
};

export class StakeAction {
  constructor(private safe: typeof Safe) {}

  private getTokenConfig(token: string): {
    address: string;
    abi: any;
    decimals: number;
  } {
    // Check if it's already an address
    if (token.startsWith("0x")) {
      return {
        address: token,
        abi: UsdcTokenAbi,
        decimals: 6, // Default decimals - you might want to handle this differently
      };
    }

    // Convert to uppercase to match our mapping
    const upperToken = token.toUpperCase() as TokenSymbol;

    // Get config from mapping
    const tokenConfig = TOKEN_CONFIG[upperToken];
    if (!tokenConfig) {
      throw new Error(`Unsupported token: ${token}`);
    }

    return tokenConfig;
  }

  private formatAmount(amount: string, decimals: number): bigint {
    // Remove any commas from the amount string
    const cleanAmount = amount.replace(/,/g, "");

    // Convert to number and multiply by 10^decimals
    const parsedAmount = parseFloat(cleanAmount);
    const multiplier = Math.pow(10, decimals);
    const scaledAmount = parsedAmount * multiplier;

    // Convert to bigint, handling any floating point precision issues
    return BigInt(Math.round(scaledAmount));
  }

  async getAaveAPY(
    tokenAddress: string,
    provider: ethers.providers.Provider
  ): Promise<{ supplyAPY: number; variableBorrowAPY: number }> {
    const aavePoolAddress = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

    try {
      const poolContract = new ethers.Contract(
        aavePoolAddress,
        AavePoolAbi,
        provider
      );
      const reserveData = await poolContract.getReserveData(tokenAddress);

      const RAY = ethers.BigNumber.from("1000000000000000000000000000");
      const SECONDS_PER_YEAR = 31536000;

      const liquidityRate = reserveData.liquidityRate;
      const supplyAPY =
        (1 + Number(liquidityRate.toString()) / Number(RAY.toString())) **
          SECONDS_PER_YEAR -
        1;

      const variableBorrowRate = reserveData.variableBorrowRate;
      const variableBorrowAPY =
        (1 + Number(variableBorrowRate.toString()) / Number(RAY.toString())) **
          SECONDS_PER_YEAR -
        1;

      return {
        supplyAPY: supplyAPY * 100,
        variableBorrowAPY: variableBorrowAPY * 100,
      };
    } catch (error) {
      console.error(
        `Error fetching Aave APY for token ${tokenAddress}:`,
        error
      );
      throw error;
    }
  }

  async getAllTokenAPYs(
    tokenConfig: TokenConfigMap,
    provider: ethers.providers.Provider
  ): Promise<ApyResult[]> {
    const results: ApyResult[] = [];

    for (const [tokenName, config] of Object.entries(tokenConfig)) {
      try {
        const apyData = await this.getAaveAPY(config.address, provider);
        results.push({
          token: tokenName,
          ...apyData,
          decimals: config.decimals,
        });
      } catch (error) {
        console.error(`Failed to fetch APY for ${tokenName}:`, error);
        // Continue with other tokens even if one fails
        results.push({
          token: tokenName,
          supplyAPY: -1, // Indicating error
          variableBorrowAPY: -1,
          decimals: config.decimals,
        });
      }
    }

    return results;
  }

  // Example usage
  async main() {
    const TOKEN_CONFIG = {
      USDC: {
        address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        abi: "UsdcTokenAbi", // Replace with actual ABI
        decimals: 6,
      },
      USDT: {
        address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
        abi: "UsdtTokenAbi", // Replace with actual ABI
        decimals: 6,
      },
      DAI: {
        address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
        abi: "DaiTokenAbi", // Replace with actual ABI
        decimals: 18,
      },
    };

    const provider = new ethers.providers.JsonRpcProvider(
      "https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
    );

    try {
      const allApyData = await getAllTokenAPYs(TOKEN_CONFIG, provider);

      // Print results in a formatted table
      console.table(
        allApyData.map((data) => ({
          Token: data.token,
          "Supply APY (%)": data.supplyAPY.toFixed(2),
          "Borrow APY (%)": data.variableBorrowAPY.toFixed(2),
          Decimals: data.decimals,
        }))
      );
    } catch (error) {
      console.error("Error fetching APY data:", error);
    }
  }

  // export { getAllTokenAPYs, getAaveAPY };
}

export const stake: Action = {
  name: "STAKE",
  similes: [
    "SUPPLY_TO_AAVE",
    "DEPOSIT_TO_AAVE",
    "LEND_ON_AAVE",
    "STAKE_ON_AAVE",
    "PROVIDE_LIQUIDITY_AAVE",
    "AAVE_DEPOSIT",
    "AAVE_SUPPLY",
    "AAVE_STAKE",
  ],
  suppressInitialMessage: true,
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I want to supply 1000 USDT to AAVE" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your USDT to the AAVE lending pool to earn yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you deposit my ETH into AAVE for lending?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your ETH to AAVE. This will earn you aETH tokens representing your deposit",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "How do I earn yield on my USDC using AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your USDC to AAVE's lending pool. You'll earn interest and receive aUSDC tokens in return",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Supply 500 DAI to AAVE please",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll process your DAI deposit to AAVE. You'll start earning yield immediately",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to become an AAVE liquidity provider with my WBTC",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your WBTC to AAVE's lending pool. You'll receive aWBTC tokens representing your position",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the process for lending my tokens on AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your tokens to AAVE. This will allow you to earn interest while maintaining the ability to withdraw anytime",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Put my MATIC into AAVE's lending pool",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your MATIC to AAVE. You'll receive aMATIC tokens and start earning yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to earn interest on my stablecoins using AAVE",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your stablecoins to AAVE's lending pool to start earning yield",
          action: "STAKE",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
