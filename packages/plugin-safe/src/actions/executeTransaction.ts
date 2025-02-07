import type {
  ActionExample,
  IAgentRuntime,
  Memory,
  Action,
} from "@elizaos/core";
import Safe from "@safe-global/protocol-kit";

export const executeTransaction: Action = {
  name: "EXECUTE_TRANSACTION",
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
  description:
    "Execute a blockchain transaction. This action is used when the agent needs to perform operations like sending tokens, interacting with smart contracts, swapping assets, staking, voting, or any other on-chain transaction that requires signing and broadcasting to the network. The transaction details should be validated and processed according to the specific blockchain protocol requirements.",
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory
  ): Promise<boolean> => {
    const preExistingSafe = await Safe.init({
      provider: process.env.RPC_URL,
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: process.env.SAFE_ADDRESS,
    });
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
