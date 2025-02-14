import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  type HandlerCallback,
  type State,
  composeContext,
  generateObjectDeprecated,
  ModelClass
} from "@elizaos/core";

import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { holesky } from "viem/chains";

import { AnkrAbi } from "../abi/AnkrAbi";

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
 * Action: Deposits ETH into Ankr, mints ankrEth.
 */
export const stakeToAnkr: Action = {
  name: "STAKE_TO_ANKR",
  similes: [
    "ANKR_DEPOSIT",
    "ANKR_MINT_ANKRETH",
    "STAKE_ANKR",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    // You can add any additional validation logic here if needed
    return true;
  },
  description:
    "Deposits ETH into Ankr to mint ankrEth.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Staking on Ankr...");

    // RPC for Holesky testnet
    const rpcHolesky = "https://holesky.drpc.org";

    // Make sure you have AGENT_PRIVATE_KEY in your environment
    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY?.startsWith("0x")
      ? (process.env.AGENT_PRIVATE_KEY as Hex)
      : (`0x${process.env.AGENT_PRIVATE_KEY}` as Hex);
    console.log("agentPrivateKey: ", agentPrivateKey);

    // Ankr Contract address on Holesky (example)
    const ankrAddress = "0xb2f5B45Aa301fD478CcffC93DBD2b91C22FDeDae";

    // Clients
    const publicClient = createPublicClient({
      chain: holesky,
      transport: http(),
    });
    const account = privateKeyToAccount(agentPrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: holesky,
      transport: http(),
    });

    // Function to deposit ETH into Ankr
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

    try {
      // For demonstration: stake 0.001 ETH (100000000000000 wei) into Ankr
      const SOMEETH = BigInt(100000000000000);
      await depositEthAnkr(SOMEETH);

      const result = {
        text: "Staking to Ankr complete",
        content: {
          ankrStake: "0.001 ETH staked -> ankrEth minted",
        },
      };

      if (callback) {
        callback(result);
      }

      return true;
    } catch (error) {
      console.error("Error in stakeToAnkr handler:", error);
      if (callback) {
        callback({
          text: `Error while staking: ${String(error)}`,
          content: { error: String(error) },
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
            text: "Please stake some ETH into Ankr to get ankrEth.",
            },
        },
        {
            user: "{{agentName}}",
            content: {
            text: "I can do that. How much ETH would you like to deposit?",
            },
        },
        {
            user: "{{user1}}",
            content: {
            text: "I want to deposit 0.001 ETH.",
            },
        },
        {
            user: "{{agentName}}",
            content: {
            text: "Understood. You’d like to deposit 0.001 ETH into Ankr. Shall I proceed?\n**(Awaiting confirmation to call STAKE_TO_ANKR)**",
            },
        },
        {
            user: "{{user1}}",
            content: {
            text: "Yes, please proceed.",
            },
        },
        {
            user: "{{agentName}}",
            content: {
            action: "STAKE_TO_ANKR",
            text: "Staking 0.001 ETH in Ankr now...",
            },
        },
        ],
        [
        {
            user: "{{user1}}",
            content: {
            text: "I'd like to deposit 0.01 ETH into Ankr, can you do that?",
            },
        },
        {
            user: "{{agentName}}",
            content: {
            text: "Sure. You want to deposit 0.01 ETH into Ankr. Confirm to proceed?\n**(Awaiting confirmation to call STAKE_TO_ANKR)**",
            },
        },
        {
            user: "{{user1}}",
            content: {
            text: "Yes, confirm.",
            },
        },
        {
            user: "{{agentName}}",
            content: {
            action: "STAKE_TO_ANKR",
            text: "Staking 0.01 ETH in Ankr now...",
            },
        },
        ],
    ] as ActionExample[][],
};
