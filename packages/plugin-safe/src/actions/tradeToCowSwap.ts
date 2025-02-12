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
} from "viem";
import {
  SwapAdvancedSettings,
  TradeParameters,
  TradingSdk,
  SupportedChainId,
  OrderKind,
  SigningScheme,
} from "@cowprotocol/cow-sdk";
import { VoidSigner } from "@ethersproject/abstract-signer";
import { JsonRpcProvider } from "@ethersproject/providers";
import { sepolia } from "viem/chains";
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
import { UsdtTokenAbi } from "../abi/UsdtToken";
import { DaiTokenAbi } from "../abi/DaiToken";
import Safe from "@safe-global/protocol-kit";

import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import type { CowSwapTradeParams, StakeResponse } from "../types";
import { tradeToCowSwapTemplate } from "../templates";

const buildSwapParams = async (
  state: State,
  runtime: IAgentRuntime
): Promise<CowSwapTradeParams> => {
  const context = composeContext({
    state,
    template: tradeToCowSwapTemplate,
  });

  console.log("context: ", context);

  const stakeDetails = (await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL,
  })) as CowSwapTradeParams;

  console.log("stakeDetails: ", stakeDetails);

  return stakeDetails;
};

const TOKEN_CONFIG = {
  USDC: {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    abi: UsdcTokenAbi,
    decimals: 6,
    aTokenAddress: "0x16dA4541aD1807f4443d92D26044C1147406EB80",
  },
  USDT: {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    abi: UsdtTokenAbi,
    decimals: 6,
    aTokenAddress: "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6",
  },
  DAI: {
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    abi: DaiTokenAbi,
    decimals: 18,
    aTokenAddress: "0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8",
  },
} as const;

type TokenSymbol = keyof typeof TOKEN_CONFIG;

// Helper functions
// function extractValue(response: any): string {
//   if (
//     typeof response === "object" &&
//     response !== null &&
//     "result" in response
//   ) {
//     return response.result.toString();
//   }
//   return response.toString();
// }

// function formatTokenAmount(amount: string | bigint, decimals: number): string {
//   const amountStr = amount.toString();
//   const value = Number(amountStr) / Math.pow(10, decimals);
//   return value.toFixed(decimals > 5 ? 5 : decimals);
// }

export const tradeToCowSwap: Action = {
  name: "TRADE_TO_COWSWAP",
  similes: [
    "SWAP_ON_COWSWAP",
    "EXCHANGE_VIA_COWSWAP",
    "COWSWAP_TRADE",
    "DEX_SWAP_COWSWAP",
    "TRADE_TOKENS_COWSWAP",
    "COWPROTOCOL_SWAP",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Executes a token swap through CowSwap (CoW Protocol) with MEV protection and optimal pricing",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("process.env.RPC_URL", process.env.RPC_URL);

    // Define addresses for the safe, AAVE pool, and tokens (all on Sepolia)
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";
    const USDC_SEPOLIA_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    const USDT_SEPOLIA_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
    const DAI_SEPOLIA_ADDRESS = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";
    const AUSDC_SEPOLIA_ADDRESS = "0x16dA4541aD1807f4443d92D26044C1147406EB80";
    const AUSDT_SEPOLIA_ADDRESS = "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6";
    const ADAI_SEPOLIA_ADDRESS = "0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8";

    const swapParams = await buildSwapParams(state, runtime);

    const tokenToSell = swapParams.tokenToSell;
    const tokenToBuy = swapParams.tokenToBuy;
    const INPUT_AMOUNT = swapParams.inputAmount;

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    console.log("publicClient created");

    const exSafe = Safe.default;

    console.log("exSafe const made");

    const preExistingSafe = await exSafe.init({
      // provider: process.env.RPC_URL,
      provider: "https://ethereum-sepolia-rpc.publicnode.com/",
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: safeAddress,
    });

    console.log("preExistingSafe ran");

    // Helper function to get the wallet balance for a given token using its ERC20 interface
    async function getWalletBalance(tokenAddress: string, abi: any) {
      console.log("getWalletBalance");
      return publicClient.readContract({
        address: tokenAddress as Address,
        abi: abi,
        functionName: "balanceOf",
        args: [safeAddress],
      });
    }

    console.log("getWalletBalance ran");

    // Retrieve wallet balances for DAI, USDC, and USDT
    const walletBalanceDAI = (await getWalletBalance(
      DAI_SEPOLIA_ADDRESS,
      DaiTokenAbi
    )) as string;
    const walletBalanceUSDC = (await getWalletBalance(
      USDC_SEPOLIA_ADDRESS,
      UsdcTokenAbi
    )) as string;
    const walletBalanceUSDT = (await getWalletBalance(
      USDT_SEPOLIA_ADDRESS,
      UsdtTokenAbi
    )) as string;
    const walletBalanceADAI = (await getWalletBalance(
      ADAI_SEPOLIA_ADDRESS,
      DaiTokenAbi
    )) as string;
    const walletBalanceAUSDC = (await getWalletBalance(
      AUSDC_SEPOLIA_ADDRESS,
      UsdcTokenAbi
    )) as string;
    const walletBalanceAUSDT = (await getWalletBalance(
      AUSDT_SEPOLIA_ADDRESS,
      UsdtTokenAbi
    )) as string;

    const traderParams = {
      chainId: SupportedChainId.SEPOLIA,
      signer: new VoidSigner(
        safeAddress,
        new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com/")
      ),
      appCode: "awesome-app",
    };

    const cowSdk = new TradingSdk(traderParams, { logs: false });

    console.log("cowSdk initialized");

    const parameters: TradeParameters = {
      kind: OrderKind.SELL,
      sellToken: tokenToSell,
      sellTokenDecimals: 18,
      buyToken: tokenToBuy,
      buyTokenDecimals: 18,
      amount: INPUT_AMOUNT,
    };

    console.log("parameters:", parameters);

    const advancedParameters: SwapAdvancedSettings = {
      quoteRequest: {
        // Specify the signing scheme
        signingScheme: SigningScheme.PRESIGN,
      },
    };

    console.log("advanced parameters passed");

    const orderId = await cowSdk.postSwapOrder(parameters, advancedParameters);

    console.log("order posted");

    console.log(`Order ID: [${orderId}]`);

    const preSignTransaction = await cowSdk.getPreSignTransaction({
      orderId,
      account: safeAddress,
    });

    const safePreSignTx: MetaTransactionData = {
      to: preSignTransaction.to,
      value: preSignTransaction.value,
      data: preSignTransaction.data,
      operation: OperationType.Call,
    };

    const safeTx = await preExistingSafe.createTransaction({
      transactions: [safePreSignTx],
      onlyCalls: true,
    });

    // You might need to collect more signatures here

    const txResponse = await preExistingSafe.executeTransaction(safeTx);
    console.log(`Sent tx hash: [${txResponse.hash}]`);
    console.log("Waiting for the tx to be mined");
    await publicClient.waitForTransactionReceipt({
      hash: txResponse.hash as `0x${string}`,
    });

    // Additional logic to aggregate or further process the retrieved balances could be added here.

    function formatTokenAmount(
      amount: string | bigint,
      decimals: number
    ): string {
      const amountStr = amount.toString();
      const value = Number(amountStr) / Math.pow(10, decimals);
      return value.toFixed(decimals > 5 ? 5 : decimals);
    }

    const DECIMALS = {
      USDC: 6,
      USDT: 6,
      DAI: 18,
    };

    try {
      const formattedText = `Here are your current positions:

                Wallet Balances:
                • DAI: ${formatTokenAmount(walletBalanceDAI, DECIMALS.DAI)} DAI
                • USDC: ${formatTokenAmount(
                  walletBalanceUSDC,
                  DECIMALS.USDC
                )} USDC
                • USDT: ${formatTokenAmount(
                  walletBalanceUSDT,
                  DECIMALS.USDT
                )} USDT

                AAVE Deposits (aTokens):
                • aDAI: ${formatTokenAmount(
                  walletBalanceADAI,
                  DECIMALS.DAI
                )} aDAI
                • aUSDC: ${formatTokenAmount(
                  walletBalanceAUSDC,
                  DECIMALS.USDC
                )} aUSDC
                • aUSDT: ${formatTokenAmount(
                  walletBalanceAUSDT,
                  DECIMALS.USDT
                )} aUSDT`;

      if (callback) {
        callback({
          text: formattedText,
        });
      }

      return true;
    } catch (error) {
      console.error("Error retrieving balances:", error);
      if (callback) {
        callback({
          text: `Error retrieving balances: ${error.message}`,
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I want to swap 100 USDC for DAI on CowSwap" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you swap your USDC to DAI using CowSwap for the best possible price with MEV protection",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Exchange my USDT to USDC using CowSwap" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll initiate a USDT to USDC swap on CowSwap to get you the most competitive rate",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What's the best way to trade DAI for USDT?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you swap DAI for USDT using CowSwap, which offers MEV protection and optimal pricing",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Can you help me trade stablecoins on CowSwap?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll assist you in swapping your stablecoins through CowSwap for the best possible execution",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I need to convert 500 DAI to USDC with minimal slippage",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll set up a DAI to USDC swap on CowSwap, which ensures minimal slippage and protection from frontrunning",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "How can I swap tokens safely with the best rate?" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you execute your swap through CowSwap, which provides MEV protection and aggregates liquidity for the best rates",
          action: "TRADE_TO_COWSWAP",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
