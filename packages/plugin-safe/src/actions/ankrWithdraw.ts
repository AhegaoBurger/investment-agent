import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  type HandlerCallback,
  type State,
} from "@elizaos/core";

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { holesky } from "viem/chains";

import { AnkrAbi } from "../abi/AnkrAbi";
import { AnkrTokenAbi } from "../abi/AnkrToken";

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
      const amountToUnstake = BigInt(1e18);
      await initiateAnkrUnstake(amountToUnstake);

      // STEP 4: Return success or handle errors
      if (callback) {
        callback({
          text: "Ankr unbonding initiated. You'll need to wait the unbonding period before fully withdrawing your ETH.",
          content: {
            requestedUnstakeAmount: amountToUnstake.toString(),
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
