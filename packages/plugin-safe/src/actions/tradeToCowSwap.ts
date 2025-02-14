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

  console.log("context composed ");

  const stakeDetails = (await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL,
  })) as CowSwapTradeParams;

  // console.log("stakeDetails: ", stakeDetails);

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

export class CowSwapAction {
  constructor(private safe: typeof Safe) {}

  private getTokenConfig(token: string): {
    address: string;
    abi: any;
    decimals: number;
  } {
    // Check if it's already an address
    if (token.startsWith("0x")) {
      return {
        address: token,
        abi: UsdcTokenAbi,
        decimals: 6, // Default decimals
      };
    }

    // Convert to uppercase to match our mapping
    const upperToken = token.toUpperCase() as TokenSymbol;

    // Get config from mapping
    const tokenConfig = TOKEN_CONFIG[upperToken];
    if (!tokenConfig) {
      throw new Error(`Unsupported token: ${token}`);
    }

    return tokenConfig;
  }

  private formatAmount(amount: string, decimals: number): bigint {
    // Remove any commas from the amount string
    const cleanAmount = amount.replace(/,/g, "");

    // Convert to number and multiply by 10^decimals
    const parsedAmount = parseFloat(cleanAmount);
    const multiplier = Math.pow(10, decimals);
    const scaledAmount = parsedAmount * multiplier;

    // Convert to bigint, handling any floating point precision issues
    return BigInt(Math.round(scaledAmount));
  }

  async swap(params: CowSwapTradeParams): Promise<any> {
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";

    // Get configurations for both tokens
    const sellTokenConfig = this.getTokenConfig(params.tokenToSell);
    const buyTokenConfig = this.getTokenConfig(params.tokenToBuy);

    // Format the input amount with proper decimals
    const scaledAmount = this.formatAmount(
      params.inputAmount,
      sellTokenConfig.decimals
    );

    const preExistingSafe = await this.safe.init({
      provider: "https://ethereum-sepolia-rpc.publicnode.com/",
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: safeAddress,
    });

    const traderParams = {
      chainId: SupportedChainId.SEPOLIA,
      signer: new VoidSigner(
        safeAddress,
        new JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com/")
      ),
      appCode: "awesome-app",
    };

    console.log("traderParams done");

    const cowSdk = new TradingSdk(traderParams, { logs: false });

    console.log("cowSdk done");

    const parameters: TradeParameters = {
      kind: OrderKind.SELL,
      sellToken: sellTokenConfig.address,
      sellTokenDecimals: sellTokenConfig.decimals,
      buyToken: buyTokenConfig.address,
      buyTokenDecimals: buyTokenConfig.decimals,
      amount: scaledAmount.toString(),
      // amount: params.inputAmount,
      slippageBps: 100,
      partiallyFillable: true,
    };

    console.log("parameters: ", parameters);

    const advancedParameters: SwapAdvancedSettings = {
      quoteRequest: {
        signingScheme: SigningScheme.PRESIGN,
      },
    };

    const orderId = await cowSdk.postSwapOrder(parameters, advancedParameters);

    console.log("orderId: ", orderId);

    const preSignTransaction = await cowSdk.getPreSignTransaction({
      orderId,
      account: safeAddress,
    });

    console.log("preSignTransaction done");

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

    const txResponse = await preExistingSafe.executeTransaction(safeTx);

    console.log("txResponse: ", txResponse);

    return txResponse;
  }
}

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
  suppressInitialMessage: true,
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
    if (!state) {
      state = (await runtime.composeState(message)) as State;
    } else {
      state = await runtime.updateRecentMessageState(state);
    }

    const action = new CowSwapAction(Safe.default);

    try {
      // Get swap parameters from the template
      const swapParams = await buildSwapParams(state, runtime);

      console.log("swapParams: ", swapParams);

      // Execute swap operation
      const swapResp = await action.swap(swapParams);

      console.log("swapResp: ", swapResp);

      if (callback) {
        callback({
          text: `Successfully swapped ${swapParams.inputAmount} ${swapParams.tokenToSell} to ${swapParams.tokenToBuy}\nTransaction Hash: ${swapResp.hash}`,
        });
      }

      return true;
    } catch (error) {
      console.error("Error during CowSwap trade:", error);
      if (callback) {
        callback({
          text: `Error executing swap: ${error.message}`,
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
