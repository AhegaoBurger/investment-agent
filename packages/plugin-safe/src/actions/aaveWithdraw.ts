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
import type { StakeParams, StakeResponse } from "../types";

import { MetaTransactionData, OperationType } from "@safe-global/types-kit";

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

async function getTokenConfig(token: string): Promise<{
  address: string;
  abi: any;
  decimals: number;
}> {
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

async function formatAmount(amount: string, decimals: number): Promise<bigint> {
  // Remove any commas from the amount string
  const cleanAmount = amount.replace(/,/g, "");

  // Convert to number and multiply by 10^decimals
  const parsedAmount = parseFloat(cleanAmount);
  const multiplier = Math.pow(10, decimals);
  const scaledAmount = parsedAmount * multiplier;

  // Convert to bigint, handling any floating point precision issues
  return BigInt(Math.round(scaledAmount));
}

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

export const withdraw: Action = {
  name: "WITHDRAW_FROM_AAVE",
  similes: [
    "REMOVE_FROM_AAVE",
    "WITHDRAW_FROM_AAVE",
    "UNSTAKE_FROM_AAVE",
    "AAVE_WITHDRAW",
    "AAVE_REMOVE",
    "REDEEM_FROM_AAVE",
  ],
  suppressInitialMessage: true,
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description: "Withdraws tokens from the AAVE lending protocol",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log(
      "process.env.RPC_URL",
      process.env.RPC_URL,
      "process.env.AGENT_PRIVATE_KEY",
      process.env.AGENT_PRIVATE_KEY,
      "process.env.SAFE_ADDRESS",
      process.env.SAFE_ADDRESS
    );

    const exSafe = Safe.default;

    // You might want to handle multiple stablecoins at once, so keep them generic:
    // const STABLECOIN_ADDRESSES = {
    //   USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    //   USDT: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    //   DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    // };

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";
    const aavePoolSepoliaAddress = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

    // Initialize Safe
    const preExistingSafe = await exSafe.init({
      provider: process.env.RPC_URL,
      signer: agentPrivateKey,
      safeAddress: safeAddress,
    });

    const stakeParams = await buildStakeDetails(state, runtime);

    // Get the actual token address
    const tokenConfig = await getTokenConfig(stakeParams.token);

    // Format the amount with proper decimals
    const scaledAmount = await formatAmount(stakeParams.amount, tokenConfig.decimals);

    // Example: withdrawing maximum USDC
    // If you need to withdraw multiple tokens, you can create an array of transactions
    // and push them all into one Safe transaction batch.
    const callDataAaveWithdraw = encodeFunctionData({
      abi: AavePoolAbi,
      functionName: "withdraw",
      args: [
        tokenConfig.address as `0x${string}`,
        // Using the maximum integer for withdrawal
        // (or replace with the user-specified amount)
        BigInt(scaledAmount),
        safeAddress,
      ],
    });

    const safeAaveWithdrawTx: MetaTransactionData = {
      to: aavePoolSepoliaAddress,
      value: "0",
      data: callDataAaveWithdraw,
      operation: OperationType.Call,
    };

    console.log("safeAaveWithdrawTx: ", safeAaveWithdrawTx);

    // If withdrawing multiple stablecoins, repeat the above logic for each
    // stablecoin or for each user-specified token and push them into the
    // transactions array.
    const tx = await preExistingSafe.createTransaction({
      transactions: [safeAaveWithdrawTx],
      onlyCalls: true,
    });

    const txResponse = await preExistingSafe.executeTransaction(tx);

    console.log("transaction executed", txResponse);

    if (callback) {
      callback({
        text: `Successfully staked ${stakeParams.amount} ${stakeParams.token} to AAVE\nTransaction Hash: ${txResponse.hash}`,
      });
    }

    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Withdraw my USDT from AAVE" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I’ll help you withdraw your USDT from AAVE and send it to your Safe",
          action: "WITHDRAW",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to redeem my DAI tokens from AAVE",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "No problem! I’ll start the AAVE withdrawal for your DAI",
          action: "WITHDRAW",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Pull out some USDC from AAVE for me, please",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I’ll handle the USDC withdrawal from AAVE and send it back to your Safe",
          action: "WITHDRAW",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "How do I exit my position on AAVE with my stablecoins?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you withdraw your stablecoins from AAVE so they are again available in your Safe",
          action: "WITHDRAW",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to remove my liquidity from AAVE",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I’ll assist you in withdrawing your tokens from the AAVE pool",
          action: "WITHDRAW",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
