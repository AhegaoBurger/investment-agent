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
import { holesky } from "viem/chains";

import { AnkrAbi } from "../abi/AnkrAbi";
import { AnkrTokenAbi } from "../abi/AnkrToken";
import { eigenStrategy } from "../abi/EigenStrategy";
import { eigenDelegationAbi } from "../abi/EigenDelegationAbi";

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
    console.log("Staking on Ankr + EigenLayer...");

    // RPC for Holesky testnet
    const rpcHolesky = "https://holesky.drpc.org";
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY?.startsWith("0x")
      ? (process.env.AGENT_PRIVATE_KEY as Hex)
      : (`0x${process.env.AGENT_PRIVATE_KEY}` as Hex);
    console.log("agentPrivateKey: ", agentPrivateKey);

    // Contract addresses (Holesky example)
    const ankrAddress = "0xb2f5B45Aa301fD478CcffC93DBD2b91C22FDeDae";
    const ankrTokenAddress = "0x8783C9C904e1bdC87d9168AE703c8481E8a477Fd";
    const eigenLayerHoleskyStrategy =
      "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
    const eigenDelegation = "0xA44151489861Fe9e3055d95adC98FbD462B948e7";
    const ankrtokenstrategy = "0x7673a47463f80c6a3553db9e54c8cdcd5313d0ac";

    // Clients
    const publicClient = createPublicClient({
      chain: holesky,
      transport: http(),
    });
    console.log("publicClient created");

    const account = privateKeyToAccount(agentPrivateKey);
    console.log("account created");

    const walletClient = createWalletClient({
      account,
      chain: holesky,
      transport: http(),
    });
    console.log("walletClient created");

    // -----------------------------------------------------------
    // 1) DEPOSIT ETH INTO ANKR
    // -----------------------------------------------------------
    async function depositEthAnkr(amountEthToDeposit: bigint) {
      console.log(`Depositing ${amountEthToDeposit} wei of ETH into Ankr...`);
      const { request } = await publicClient.simulateContract({
        account,
        address: ankrAddress,
        abi: AnkrAbi,
        functionName: "stakeAndClaimAethC",
        value: amountEthToDeposit,
      });
      await walletClient.writeContract(request);
      console.log(`✓ Successfully staked ETH into Ankr.`);
    }

    // -----------------------------------------------------------
    // 2) APPROVE ANKR TOKEN (IF NEEDED) FOR EIGEN STRATEGY
    //    (commented out unless you need explicit approvals)
    // -----------------------------------------------------------
    // async function approveAnkrTokenOnEigen() {
    //   console.log("Approving ankrToken for EigenLayer Strategy...");
    //   const { request } = await walletClient.simulateContract({
    //     account,
    //     address: ankrTokenAddress,
    //     abi: AnkrTokenAbi,
    //     functionName: "approve",
    //     args: [
    //       eigenLayerHoleskyStrategy,
    //       BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
    //     ],
    //   });
    //   await walletClient.writeContract(request);
    //   console.log("✓ ankrToken approved for EigenLayer Strategy");
    // }

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

    // -----------------------------------------------------------
    // 4) OPTIONAL: DELEGATE
    // -----------------------------------------------------------
    // async function delegate(amountToDeposit: bigint) {
    //   console.log(`Delegating ${amountToDeposit} ankrToken...`);
    //   const { request } = await walletClient.simulateContract({
    //     account,
    //     address: eigenDelegation,
    //     abi: eigendelegationabi,
    //     functionName: "delegateTo",
    //     value: 0,
    //     args: [
    //       "0x57b6fdef3a23b81547df68f44e5524b987755c99", // nethermind delegation address example
    //       [
    //         "0x0000000000000000000000000000000000000000000000000000000000000000", // approverSignature (bytes, empty)
    //         BigInt(0), // expiry (uint256, 0)
    //       ],
    //       "0x0000000000000000000000000000000000000000000000000000000000000000", // approverSalt (bytes32)
    //     ],
    //   });
    //   await walletClient.writeContract(request);
    //   console.log("✓ Successfully delegated to nethermind (example)");
    // }

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
