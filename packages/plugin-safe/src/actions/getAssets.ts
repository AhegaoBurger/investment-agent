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
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
// import type { Transaction, TransferParams } from "../types";
// import { transferTemplate } from "../templates";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";

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
  name: "GET_ASSETS",
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

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";
    const aavePoolSepoliaAddress = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    const USDC_SEPOLIA_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";

    const amount = 150;

    const preExistingSafe = await exSafe.init({
      provider: process.env.RPC_URL,
      signer: agentPrivateKey,
      safeAddress: safeAddress,
    });

    // const testSafe = await Safe.init({})

    // testSafe.get

    console.log("preExistingSafe", preExistingSafe);

    const callDataUSDCApprove = encodeFunctionData({
      abi: UsdcTokenAbi,
      functionName: "approve",
      args: [aavePoolSepoliaAddress, BigInt(amount)],
    });

    console.log("callDataUSDCApprove: ", callDataUSDCApprove);

    const safeUsdcApproveTx: MetaTransactionData = {
      to: USDC_SEPOLIA_ADDRESS,
      // value: amount.toString(),
      value: "0",
      data: callDataUSDCApprove,
      operation: OperationType.Call,
    };

    console.log("safeUsdcApproveTx: ", safeUsdcApproveTx);

    const callDataAAveDeposit = encodeFunctionData({
      abi: AavePoolAbi,
      functionName: "supply",
      args: [USDC_SEPOLIA_ADDRESS, BigInt(amount), safeAddress, 0],
    });

    console.log("callDataAAveDeposit: ", callDataAAveDeposit);

    const safeAaveDepositTx: MetaTransactionData = {
      // to: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", // AAVE pool proxy address on sepolia
      // to: "0xe3F3f22367C359770b085DD23980610eA5815b4f", // My address for testing
      to: aavePoolSepoliaAddress,
      // value: "100000000000000000", // 100000000000000000 wei or 0.1 eth
      value: "0",
      // data: data, // aave transfer data
      // data: "0x", // test data
      data: callDataAAveDeposit,
      operation: OperationType.Call,
    };

    console.log("safeAaveDepositTx: ", safeAaveDepositTx);

    const tx = await preExistingSafe.createTransaction({
      transactions: [safeUsdcApproveTx, safeAaveDepositTx],
      onlyCalls: true,
    });

    console.log("transaction created", tx);

    const txResponse = await preExistingSafe.executeTransaction(tx);

    console.log("transaction executed", txResponse);

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
