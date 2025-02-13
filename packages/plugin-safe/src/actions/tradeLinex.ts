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

import {
  Address,
  createPublicClient,
  createWalletClient,
  defineChain,
  encodeFunctionData,
  http,
  PublicClient,
  Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { linea } from "viem/chains";

export const stakeToAnkrAndEigen: Action = {
  name: "STAKE_TO_ANKR_AND_EIGEN",
  similes: [
    "RESTAKE_ON_EIGENLAYER",
    "ANKR_EIGEN_DEPOSIT",
    "LIQUID_RESTAKING_EIGEN",
    "EIGEN_ANKR_STAKE",
    "DUAL_STAKE_EIGEN",
    "EIGENLAYER_DEPOSIT",
    "ANKR_TO_EIGEN_STAKE",
    "COMPOUND_STAKE_EIGEN",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    // You can add validation logic here if needed
    return true;
  },
  description:
    "Performs liquid restaking by depositing ETH into Ankr for aETH tokens, then restaking on EigenLayer for additional yield opportunities",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    // RPC for Holesky testnet
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY?.startsWith("0x")
      ? (process.env.AGENT_PRIVATE_KEY as Hex)
      : (`0x${process.env.AGENT_PRIVATE_KEY}` as Hex);
    console.log("agentPrivateKey: ", agentPrivateKey);

    // Contract addresses
    const lynexRouterAddress = "0x610D2f07b7EdC67565160F587F37636194C34E74";

    // Clients
    const publicClient = createPublicClient({
      chain: linea,
      transport: http(),
    });
    console.log("publicClient created");

    const account = privateKeyToAccount(agentPrivateKey);
    console.log("account created");

    const walletClient = createWalletClient({
      account,
      chain: linea,
      transport: http(),
    });
    console.log("walletClient created");

    // -----------------------------------------------------------
    // 1) DEPOSIT ETH INTO ANKR
    // -----------------------------------------------------------
    async function estimateTxOutput(
      amountToDeposit: bigint,
      tokenIn,
      tokenOut
    ) {
      const data = await publicClient.readContract({
        address: "0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2",
        abi: wagmiAbi,
        functionName: "balanceOf",
        args: ["0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC"],
      });
    }

    // -----------------------------------------------------------
    // 3) DEPOSIT aETH INTO EIGEN STRATEGY
    // -----------------------------------------------------------
    async function depositIntoStrategy(amountToDeposit: bigint) {
      console.log(`Restaking ${amountToDeposit} ankrToken on EigenLayer...`);
      const { request } = await publicClient.simulateContract({
        account,
        address: eigenLayerHoleskyStrategy,
        abi: eigenStrategy,
        functionName: "depositIntoStrategy",
        value: 0,
        args: [ankrtokenstrategy, ankrTokenAddress, amountToDeposit],
      });
      await walletClient.writeContract(request);
      console.log("✓ Successfully restaked on EigenLayer");
    }

    // --------------------------------
    // EXAMPLE MAIN LOGIC
    // --------------------------------
    try {
      // For demonstration, assume user wants to stake 1 ETH into Ankr
      // Then restake all aETH into EigenLayer
      const ONE_ETH_IN_WEI = BigInt(10000000000000000);

      // 1) Stake ETH into Ankr
      await depositEthAnkr(ONE_ETH_IN_WEI);

      // 2) If required, approve the new aETH tokens for the Eigen strategy
      // await approveAnkrTokenOnEigen();

      // 3) Suppose user wants to deposit 100% of the newly minted aETH into Eigen
      // The actual minted amount depends on Ankr’s exchange rate
      // For a placeholder, let's assume user minted 1 aETH = 1 ankrToken
      // In reality, you would query the new balance, then deposit that exact amount:
      await depositIntoStrategy(ONE_ETH_IN_WEI);

      // 4) (Optional) delegate
      // await delegate(ONE_ETH_IN_WEI);

      // Return success info
      const result = {
        text: "Staking to Ankr + EigenLayer complete",
        content: {
          ankrStake: "1 ETH staked -> aETH minted",
          eigenRestake: "1 aETH restaked on EigenLayer",
          delegation: "Not delegated (example commented out)",
        },
      };

      if (callback) {
        callback(result);
      }

      return true;
    } catch (error) {
      console.error("Error in stakeToAnkrAndEigen handler:", error);
      if (callback) {
        callback({
          text: `Error while staking: ${error.message}`,
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
          text: "Please stake 1 ETH into Ankr, then restake it on EigenLayer.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Sure! I'll deposit your ETH into Ankr to mint aETH, then restake that aETH on EigenLayer for extra yield.",
          action: "STAKE_TO_ANKR_AND_EIGEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to deposit some ETH into Ankr and then restake on EigenLayer. Can you do that?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Certainly. I'll handle the deposit to Ankr and reinvest those aETH tokens on EigenLayer for added returns.",
          action: "STAKE_TO_ANKR_AND_EIGEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Help me stake my ETH to get aETH and delegate it on EigenLayer to nethermind.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll stake your ETH on Ankr for aETH, restake on EigenLayer, and can optionally handle delegation if you like.",
          action: "STAKE_TO_ANKR_AND_EIGEN",
        },
      },
    ],
  ] as ActionExample[][],
};
