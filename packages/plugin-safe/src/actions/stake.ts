import type {
  ActionExample,
  IAgentRuntime,
  Memory,
  Action,
} from "@elizaos/core";
import Safe from "@safe-global/protocol-kit";
import { encodeFunctionData } from "viem";
import { poolAbi } from "../abi/abi";

export const stake: Action = {
  name: "STAKE",
  similes: [
    "SEND_TRANSACTION",
    "SUBMIT_TRANSACTION",
    "PROCESS_TRANSACTION",
    "TRANSFER",
    "SEND_TX",
    "EXECUTE_TX",
    "PERFORM_TRANSACTION",
    "BROADCAST_TRANSACTION",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description: "",
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory
  ): Promise<boolean> => {
    const preExistingSafe = await Safe.init({
      provider: process.env.RPC_URL,
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: process.env.SAFE_ADDRESS,
    });

    const user = preExistingSafe.getAddress();

    const data = encodeFunctionData({
      abi: poolAbi,
      functionName: "supply",
      args: [],
    });

    const tx = await preExistingSafe.createTransaction({
      transactions: [
        {
          to: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // AAVE pool address on sepolia
          data: data,
          value: "0",
        },
      ],
    });

    preExistingSafe.executeTransaction(tx);

    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you send 0.1 ETH to 0x123...789?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll execute that transaction for you now",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Please transfer 50 USDC to Bob's wallet",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Initiating the USDC transfer to Bob's address",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I need to swap 10 ETH for DAI using Uniswap",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll execute this swap transaction on Uniswap for you",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Could you stake 100 MATIC in the validator contract?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Processing your staking transaction now",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Execute the smart contract function approve() with 1000 tokens",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Executing the approve function with specified parameters",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Bridge 5 ETH from Ethereum to Polygon",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Initiating the bridge transaction",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Mint an NFT from this collection: 0xabc...def",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Processing your NFT mint transaction",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Vote on proposal #123 in the DAO",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Submitting your vote transaction to the DAO",
          action: "EXECUTE_TRANSACTION",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
