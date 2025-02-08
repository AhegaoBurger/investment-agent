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
import { poolAbi } from "../abi";
import type { Transaction, TransferParams } from "../types";
import { transferTemplate } from "../templates";
import { Wallet } from "ethers";

// const buildTransferDetails = async (
//   state: State,
//   runtime: IAgentRuntime
// ): Promise<TransferParams> => {
//   // const chains = Object.keys(wp.chains);
//   // state.supportedChains = chains.map((item) => `"${item}"`).join("|");

//   const context = composeContext({
//     state,
//     template: transferTemplate,
//   });

//   const transferDetails = (await generateObjectDeprecated({
//     runtime,
//     context,
//     modelClass: ModelClass.SMALL,
//   })) as TransferParams;

//   // if (!existingChain) {
//   //   throw new Error(
//   //     "The chain " +
//   //       transferDetails.fromChain +
//   //       " not configured yet. Add the chain or choose one from configured: " +
//   //       chains.toString()
//   //   );
//   // }

//   return transferDetails;
// };

export const stake: Action = {
  name: "STAKE",
  similes: [
    "SUPPLY_TO_AAVE",
    "DEPOSIT_TO_AAVE",
    "LEND_ON_AAVE",
    "STAKE_ON_AAVE",
    "PROVIDE_LIQUIDITY_AAVE",
    "AAVE_DEPOSIT",
    "AAVE_SUPPLY",
    "AAVE_STAKE",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory
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

    // console.log("process.env.RPC_URL", process.env.RPC_URL);
    // console.log("//////////////////////////");
    // console.log("//////////////////////////");
    // console.log(Safe);
    // console.log("//////////////////////////");
    // console.log(Safe.default);
    // console.log("//////////////////////////");
    // console.log(Safe.default.init);
    // console.log("//////////////////////////");
    // console.log("//////////////////////////");

    const privateKey = process.env.AGENT_PRIVATE_KEY;

    console.log("privateKey", privateKey);

    try {
      const wallet = new Wallet(privateKey);
      console.log("Valid private key! Address:", wallet.address);
    } catch (error) {
      console.error("Invalid private key:", error.message);
    }

    if (!privateKey || !/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error("Invalid private key format");
    }

    const preExistingSafe = await exSafe.init({
      provider: process.env.RPC_URL,
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: process.env.SAFE_ADDRESS,
    });

    console.log("preExistingSafe", preExistingSafe);

    const user = await preExistingSafe.getAddress();

    console.log("user:", user);

    const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";

    const args: readonly [`0x${string}`, bigint, `0x${string}`, number] = [
      USDT as `0x${string}`,
      BigInt("0"),
      user as `0x${string}`,
      0,
    ];

    console.log("args:", args);

    const data = encodeFunctionData({
      abi: poolAbi,
      functionName: "supply",
      args: args,
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

    console.log("transaction created", tx);

    preExistingSafe.executeTransaction(tx);

    console.log("transaction executed", tx);

    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I want to supply 1000 USDT to AAVE" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your USDT to the AAVE lending pool to earn yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you deposit my ETH into AAVE for lending?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your ETH to AAVE. This will earn you aETH tokens representing your deposit",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "How do I earn yield on my USDC using AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your USDC to AAVE's lending pool. You'll earn interest and receive aUSDC tokens in return",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Supply 500 DAI to AAVE please",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll process your DAI deposit to AAVE. You'll start earning yield immediately",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to become an AAVE liquidity provider with my WBTC",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your WBTC to AAVE's lending pool. You'll receive aWBTC tokens representing your position",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the process for lending my tokens on AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your tokens to AAVE. This will allow you to earn interest while maintaining the ability to withdraw anytime",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Put my MATIC into AAVE's lending pool",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your MATIC to AAVE. You'll receive aMATIC tokens and start earning yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to earn interest on my stablecoins using AAVE",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your stablecoins to AAVE's lending pool to start earning yield",
          action: "STAKE",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
