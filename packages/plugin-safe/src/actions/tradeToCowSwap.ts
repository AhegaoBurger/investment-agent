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
function extractValue(response: any): string {
  if (
    typeof response === "object" &&
    response !== null &&
    "result" in response
  ) {
    return response.result.toString();
  }
  return response.toString();
}

function formatTokenAmount(amount: string | bigint, decimals: number): string {
  const amountStr = amount.toString();
  const value = Number(amountStr) / Math.pow(10, decimals);
  return value.toFixed(decimals > 5 ? 5 : decimals);
}

export const checkPositions: Action = {
  name: "CHECK_POSITIONS",
  similes: [
    "CHECK_BALANCES",
    "VIEW_POSITIONS",
    "INSPECT_POSITIONS",
    "QUERY_POSITIONS",
    "BALANCE_OVERVIEW",
    "POSITIONS_CHECK",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Checks the current positions for DAI, USDC, and USDT by verifying both the wallet balances and the amounts deposited on AAVE",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("process.env.RPC_URL", process.env.RPC_URL);

    // Define addresses for the safe, AAVE pool, and tokens (all on Sepolia)
    const safeAddress = process.env.SAFE_SEPOLIA_ADD;
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

    console.log("publicClient", publicClient);

    const exSafe = Safe.default;

    const preExistingSafe = await exSafe.init({
      provider: "https://api-sepolia.etherscan.io/api",
      signer: process.env.AGENT_PRIVATE_KEY,
      safeAddress: safeAddress,
    });

    // Helper function to get the wallet balance for a given token using its ERC20 interface
    async function getWalletBalance(tokenAddress: string, abi: any) {
      console.log("getWalletBalance", tokenAddress, abi);
      return publicClient.readContract({
        address: tokenAddress as Address,
        abi: abi,
        functionName: "balanceOf",
        args: [safeAddress],
      });
    }

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
        new JsonRpcProvider("https://api-sepolia.etherscan.io/api")
      ),
      appCode: "awesome-app",
    };

    const cowSdk = new TradingSdk(traderParams, { logs: false });

    const parameters: TradeParameters = {
      kind: OrderKind.SELL,
      sellToken: tokenToSell,
      sellTokenDecimals: 18,
      buyToken: tokenToBuy,
      buyTokenDecimals: 18,
      amount: INPUT_AMOUNT,
    };

    const advancedParameters: SwapAdvancedSettings = {
      quoteRequest: {
        // Specify the signing scheme
        signingScheme: SigningScheme.PRESIGN,
      },
    };

    const orderId = await cowSdk.postSwapOrder(parameters, advancedParameters);

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

    // async function getBalances(
    //   publicClient: PublicClient,
    //   safeAddress: string
    // ) {
    //   // Helper function to get wallet balance
    //   async function getWalletBalance(tokenAddress: string, abi: any) {
    //     return publicClient.readContract({
    //       address: tokenAddress as Address,
    //       abi: abi,
    //       functionName: "balanceOf",
    //       args: [safeAddress],
    //     });
    //   }

    //   const balances: Record<
    //     string,
    //     { wallet: string; aaveDeposited?: string }
    //   > = {};

    //   // Fetch balances for each token
    //   for (const [symbol, config] of Object.entries(TOKEN_CONFIG)) {
    //     // Get regular token balance
    //     const walletBalance = await getWalletBalance(
    //       config.address,
    //       config.abi
    //     );

    //     // Get aToken balance
    //     const aTokenBalance = await getWalletBalance(
    //       config.aTokenAddress,
    //       config.abi
    //     );

    //     // Format balances
    //     balances[symbol] = {
    //       wallet: formatTokenAmount(walletBalance, config.decimals),
    //       aaveDeposited: formatTokenAmount(aTokenBalance, config.decimals),
    //     };

    //     // Also add aToken balance entry
    //     balances[`a${symbol}`] = {
    //       wallet: formatTokenAmount(aTokenBalance, config.decimals),
    //     };
    //   }

    //   return {
    //     balances,
    //     formattedText: formatBalanceText(balances),
    //   };
    // }

    // function formatBalanceText(
    //   balances: Record<string, { wallet: string; aaveDeposited?: string }>
    // ) {
    //   return `Here are your current positions:

    //     Wallet Balances:
    //     • DAI: ${balances.DAI.wallet} DAI
    //     • USDC: ${balances.USDC.wallet} USDC
    //     • USDT: ${balances.USDT.wallet} USDT

    //     AAVE Deposits (aTokens):
    //     • aDAI: ${balances.aDAI.wallet} aDAI
    //     • aUSDC: ${balances.aUSDC.wallet} aUSDC
    //     • aUSDT: ${balances.aUSDT.wallet} aUSDT

    //     Withdrawable Amounts from AAVE:
    //     • DAI: ${balances.DAI.aaveDeposited} DAI
    //     • USDC: ${balances.USDC.aaveDeposited} USDC
    //     • USDT: ${balances.USDT.aaveDeposited} USDT`;
    // }

    // // In your handler, use it like this:
    // const { balances, formattedText } = await getBalances(
    //   publicClient,
    //   safeAddress
    // );

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
        content: {
          text: "Can you check my positions on AAVE for DAI, USDC, and USDT?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll check your positions on AAVE by verifying both your wallet balances and your deposits for DAI, USDC, and USDT.",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's my current DAI position on AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll retrieve your DAI balance in your wallet as well as the amount deposited on AAVE for a complete overview.",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you show me my USDC status on AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll verify your USDC holdings, both in your wallet and those deposited on AAVE.",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to see my USDT holdings and deposits on AAVE.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll fetch your USDT balance from your wallet and check the deposited amount on AAVE for you.",
          action: "CHECK_POSITIONS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Provide an overview of my stablecoin positions on AAVE.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll check your positions for DAI, USDC, and USDT by comparing your wallet balances with your deposits on AAVE.",
          action: "CHECK_POSITIONS",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
