import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  type HandlerCallback,
  type State,
  composeContext,
  generateObjectDeprecated,
  ModelClass,
} from "@elizaos/core";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { holesky } from "viem/chains";

import { AnkrAbi } from "../abi/AnkrAbi";
import { AnkrTokenAbi } from "../abi/AnkrToken";

import { stakeTemplate } from "../templates";
import type { StakeParams, StakeResponse } from "../types";

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

/**
 * ACTION: INITIATE_ANKR_WITHDRAWAL
 *
 * This action initiates a withdrawal of staked ETH from Ankr.
 * It also requires a multi-day unbonding period before finalizing.
 */

export const initiateAnkrWithdrawal: Action = {
  name: "INITIATE_ANKR_WITHDRAWAL",
  similes: [
    "ANKR_UNSTAKE",
    "WITHDRAW_FROM_ANKR",
    "REMOVE_ANKR_STAKE",
    "ANKR_UNBOND",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Initiates a withdrawal of staked ETH from Ankr (aETH). This requires waiting for Ankr's unbonding period before finalizing.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Initiating Ankr withdrawal...");

    try {
      // STEP 1: Setup chain, client, account
      const rpcHolesky = "https://holesky.drpc.org";
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
      const account = privateKeyToAccount(agentPrivateKey as `0x${string}`);

      const publicClient = createPublicClient({
        chain: holesky,
        transport: http(),
      });
      const walletClient = createWalletClient({
        account,
        chain: holesky,
        transport: http(),
      });

      // STEP 2: Contract addresses
      const ankrAddress = "0xb2f5B45Aa301fD478CcffC93DBD2b91C22FDeDae";
      // This might be your staked token or the contract that handles unbonding logic
      // The actual function name and approach depends on Ankr's protocol

      // STEP 3: Example function to begin unbond
      async function initiateAnkrUnstake(amountToUnstake: bigint) {
        console.log(`Requesting unbond of ${amountToUnstake} aETH on Ankr...`);
        // For instance, if "unstake" is the correct function in AnkrAbi
        // The actual function might differ depending on Ankr’s contract
        const { request } = await publicClient.simulateContract({
          account,
          address: ankrAddress,
          abi: AnkrAbi,
          functionName: "unstakeAETH", // placeholder
          args: [amountToUnstake],
        });
        await walletClient.writeContract(request);
        console.log("✓ Unbonding from Ankr initiated.");
      }

      // For demonstration, assume user wants to unstake 1 aETH

      const stakeParams = await buildStakeDetails(state, runtime);

      // Format the amount with proper decimals
      const scaledAmount = await formatAmount(stakeParams.amount, 18);
      await initiateAnkrUnstake(BigInt(scaledAmount));

      // STEP 4: Return success or handle errors
      if (callback) {
        callback({
          text: "Ankr unbonding initiated. You'll need to wait the unbonding period before fully withdrawing your ETH.",
          content: {
            requestedUnstakeAmount: scaledAmount.toString(),
            note: "Check your position after the waiting period to finalize.",
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Error initiating Ankr withdrawal:", error);
      if (callback) {
        callback({
          text: `Error: ${error.message}`,
          content: { error: error.message },
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Please begin unstaking my aETH from Ankr.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Certainly. I'll initiate the Ankr unbonding process. Remember, it takes multiple days before you can finalize.",
          action: "INITIATE_ANKR_WITHDRAWAL",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Start my Ankr withdrawal for 1 aETH.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Understood. I'll call Ankr’s unstake function so you can reclaim your ETH after the waiting period.",
          action: "INITIATE_ANKR_WITHDRAWAL",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I just withdrew from EigenLayer. Now I'm ready to pull out my staked ETH from Ankr too.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll initiate your Ankr unstake. Once the required time passes, we can finalize and reclaim your ETH.",
          action: "INITIATE_ANKR_WITHDRAWAL",
        },
      },
    ],
  ] as ActionExample[][],
};
