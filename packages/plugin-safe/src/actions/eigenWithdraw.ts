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

import { eigenDelegationAbi } from "../abi/EigenDelegationAbi";
import { eigenStrategy } from "../abi/EigenStrategy";
// Additional ABIs or references as needed

/**
 * ACTION: INITIATE_EIGEN_WITHDRAWAL
 *
 * This action initiates a withdrawal from EigenLayer. This process
 * requires waiting several days to finalize, so it cannot be done
 * simultaneously with other withdrawals (e.g., from Ankr).
 */

export const initiateEigenWithdrawal: Action = {
  name: "INITIATE_EIGEN_WITHDRAWAL",
  similes: [
    "EIGEN_UNSTAKE",
    "WITHDRAW_EIGENLAYER",
    "REMOVE_EIGEN_STAKE",
    "EIGEN_UNBOND",
    "EIGEN_CLAIM_WITHDRAWAL",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    // If you have extra validation steps (e.g., checking user confirmations), add them here
    return true;
  },
  description:
    "Initiates a withdrawal of staked tokens from EigenLayer. Requires an unbonding period before finalizing.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Initiating EigenLayer withdrawal...");

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

      // STEP 2: Relevant contract addresses
      const eigenLayerHoleskyStrategy =
        "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
      // The strategy or delegation contract from which we want to withdraw
      // For example, the deposit contract used for your restaked tokens

      // STEP 3: Sample function to begin unbond/withdraw
      // You must wait the unbonding period before finalizing.
      // (The actual function name + args depends on the real contract.)
      async function initiateWithdrawal(amountToUnbond: bigint) {
        console.log(
          `Requesting unbond of ${amountToUnbond} staked tokens on EigenLayer...`
        );
        // The below is just an example. Replace with the actual function that starts the unbond process on Eigen.
        const { request } = await publicClient.simulateContract({
          account,
          address: eigenLayerHoleskyStrategy,
          abi: eigenStrategy, // or eigendelegationabi, depending on your actual flow
          functionName: "initiateUnstake", // placeholder function name
          args: [amountToUnbond],
        });
        await walletClient.writeContract(request);
        console.log("✓ Unbonding from EigenLayer initiated.");
      }

      // For demonstration, unbond a fixed amount. In a real scenario,
      // parse user input from `message.content.text` or your internal logic.
      const amountToUnbond = BigInt(1e18); // e.g., 1 aETH
      await initiateWithdrawal(amountToUnbond);

      // STEP 4: Return success or handle errors
      if (callback) {
        callback({
          text: "EigenLayer unbonding initiated. You will need to wait for the unbonding period to complete.",
          content: {
            requestedUnbondAmount: amountToUnbond.toString(),
            note: "Finalize once the required waiting period is over",
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Error initiating EigenLayer withdrawal:", error);
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
          text: "Please start withdrawing my staked tokens from EigenLayer.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Certainly! I'll initiate the EigenLayer unbonding. Remember, we must wait the required days before it's final.",
          action: "INITIATE_EIGEN_WITHDRAWAL",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to remove my restaked tokens from EigenLayer. Begin the process.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "No problem. I'll call the unbond function so your tokens can be withdrawn after the waiting period.",
          action: "INITIATE_EIGEN_WITHDRAWAL",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Let’s get my aETH from EigenLayer unstaked so I can eventually withdraw from Ankr.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll initiate your Eigen unbond process now. Once it's done, we can proceed with the Ankr withdrawal.",
          action: "INITIATE_EIGEN_WITHDRAWAL",
        },
      },
    ],
  ] as ActionExample[][],
};
