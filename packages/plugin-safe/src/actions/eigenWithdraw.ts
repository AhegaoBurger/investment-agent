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

// Adjust these imports to point to your correct ABIs
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
      const eigenDelegation = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
      const ankrtokenstrategy = "0x7673a47463f80c6a3553db9e54c8cdcd5313d0ac";

      const AGENT_ADDRESS = "0xbae3ef488949f236f967796AB1Ec262f97F44E78";

      // 0.3 ETH in wei
      const AMOUNT = BigInt("300000000000000000");

      // 
      // STEP 3: Function to queue the withdrawal. This matches the block explorer structure:
      // function queueWithdrawals(tuple[] params)
      // Each tuple has 7 fields in the example data:
      //   (bytes, bytes, address, uint256, address, uint256, uint256)
      //
      async function initiateWithdrawal() {

        const { request } = await publicClient.simulateContract({
          account,
          address: eigenDelegation,
          abi: eigenDelegationAbi,
          functionName: "queueWithdrawals",
          args: [
            [
              [
                "0x",                        // dynamic bytes #1
                "0x",                        // dynamic bytes #2
                AGENT_ADDRESS,                 // e.g. the user or deposit address
                BigInt(1),                   // a numeric param
                ankrtokenstrategy,           // strategy address
                BigInt(1),                   // another numeric param
                AMOUNT,          // 0.3 ETH in wei
              ],
            ],
          ],
        });

        await walletClient.writeContract(request);
        console.log("✓ Unbonding from EigenLayer initiated");
      }

      // Initiate the withdrawal
      await initiateWithdrawal();

      // STEP 4: Return success or handle errors
      if (callback) {
        callback({
          text: "EigenLayer unbonding initiated. You will need to wait for the unbonding period to complete.",
          content: {
            requestedUnbondAmount: "0.3 ETH",
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
          text: "Certainly! I'll queue the EigenLayer withdrawal for 0.3 ETH. We must wait the required days before it’s final.",
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
          text: "No problem. I'll queue your unbond request so the tokens can be withdrawn after the waiting period.",
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
          text: "I'll begin your Eigen unbond for 0.3 ETH now. Once it’s completed, we can proceed with the Ankr withdrawal.",
          action: "INITIATE_EIGEN_WITHDRAWAL",
        },
      },
    ],
  ] as ActionExample[][],
};
