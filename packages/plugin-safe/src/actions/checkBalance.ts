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
import { sepolia } from "viem/chains";
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
import { UsdtTokenAbi } from "../abi/UsdtToken";
import { DaiTokenAbi } from "../abi/DaiToken";

import { MetaTransactionData, OperationType } from "@safe-global/types-kit";

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
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";
    const aavePoolSepoliaAddress = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    const USDC_SEPOLIA_ADDRESS = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
    const USDT_SEPOLIA_ADDRESS = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";
    const DAI_SEPOLIA_ADDRESS = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";
    const AUSDC_SEPOLIA_ADDRESS = "0x16dA4541aD1807f4443d92D26044C1147406EB80";
    const AUSDT_SEPOLIA_ADDRESS = "0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6";
    const ADAI_SEPOLIA_ADDRESS = "0x29598b72eb5CeBd806C5dCD549490FdA35B13cD8";

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    console.log("publicClient", publicClient);

    // Helper function to get the wallet balance for a given token using its ERC20 interface
    async function getWalletBalance(tokenAddress: string, abi: any) {
      console.log("getWalletBalance", tokenAddress);
      return publicClient.readContract({
        address: tokenAddress as Address,
        abi: abi,
        functionName: "balanceOf",
        args: [safeAddress],
      });
    }

    // Helper function to get the deposited balance on AAVE for a given token.
    // This assumes the AAVE pool contract exposes a "getUserReserveData" function
    // where the first element in the returned tuple is the current deposited (aToken) balance.
    async function getAaveDepositedBalance(
      tokenAddress: string,
      amount: number
    ) {
      console.log("getAaveDepositedBalance", tokenAddress, "amount: ", amount);

      if (amount === 0) {
        console.log("getAaveDepositedBalance amount is 0, returning 0");
        return "0"; // or return BigInt(0) depending on your needs
      }

      try {
        const reserveData = await publicClient.simulateContract({
          address: aavePoolSepoliaAddress as Address,
          abi: AavePoolAbi,
          functionName: "withdraw",
          args: [tokenAddress as Address, BigInt(amount), safeAddress],
        });
        return reserveData;
      } catch (error) {
        console.error("Error in getAaveDepositedBalance:", error);
        return "0"; // or return BigInt(0) depending on your needs
      }
    }

    // Retrieve wallet balances for DAI, USDC, and USDT
    const walletBalanceDAI = await getWalletBalance(
      DAI_SEPOLIA_ADDRESS,
      DaiTokenAbi
    );
    const walletBalanceUSDC = await getWalletBalance(
      USDC_SEPOLIA_ADDRESS,
      UsdcTokenAbi
    );
    const walletBalanceUSDT = await getWalletBalance(
      USDT_SEPOLIA_ADDRESS,
      UsdtTokenAbi
    );
    const walletBalanceADAI = await getWalletBalance(
      ADAI_SEPOLIA_ADDRESS,
      DaiTokenAbi
    );
    const walletBalanceAUSDC = await getWalletBalance(
      AUSDC_SEPOLIA_ADDRESS,
      UsdcTokenAbi
    );
    const walletBalanceAUSDT = await getWalletBalance(
      AUSDT_SEPOLIA_ADDRESS,
      UsdtTokenAbi
    );

    // Retrieve AAVE deposit balances for DAI, USDC, and USDT
    const depositBalanceDAI = await getAaveDepositedBalance(
      DAI_SEPOLIA_ADDRESS,
      walletBalanceADAI
    );
    const depositBalanceUSDC = await getAaveDepositedBalance(
      USDC_SEPOLIA_ADDRESS,
      walletBalanceAUSDC
    );
    const depositBalanceUSDT = await getAaveDepositedBalance(
      USDT_SEPOLIA_ADDRESS,
      walletBalanceAUSDT
    );

    console.log("DAI Wallet Balance:", walletBalanceDAI.toString());
    console.log("DAI Deposited on AAVE:", depositBalanceDAI.toString());
    console.log("USDC Wallet Balance:", walletBalanceUSDC.toString());
    console.log("USDC Deposited on AAVE:", depositBalanceUSDC);
    console.log("USDT Wallet Balance:", walletBalanceUSDT.toString());
    console.log("USDT Deposited on AAVE:", depositBalanceUSDT.toString());

    // Additional logic to aggregate or further process the retrieved balances could be added here.
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

    // Format the return object with balances
    const balances = {
      DAI: {
        wallet: walletBalanceDAI.toString(),
        aaveDeposited: extractValue(depositBalanceDAI),
      },
      USDC: {
        wallet: walletBalanceUSDC.toString(),
        aaveDeposited: extractValue(depositBalanceUSDC),
      },
      USDT: {
        wallet: walletBalanceUSDT.toString(),
        aaveDeposited: extractValue(depositBalanceUSDT),
      },
      ADAI: {
        wallet: walletBalanceADAI.toString(),
      },
      AUSDC: {
        wallet: walletBalanceAUSDC.toString(),
      },
      AUSDT: {
        wallet: walletBalanceAUSDT.toString(),
      },
    };

    // Additional logic to aggregate or further process the retrieved balances could be added here.

    try {
      if (callback) {
        // Format the balances into a readable text
        const formattedText = `Here are your current positions:

          Wallet Balances:
          • DAI: ${walletBalanceDAI.toString()} DAI
          • USDC: ${walletBalanceUSDC.toString()} USDC
          • USDT: ${walletBalanceUSDT.toString()} USDT

          AAVE Deposits (aTokens):
          • aDAI: ${walletBalanceADAI.toString()} aDAI
          • aUSDC: ${walletBalanceAUSDC.toString()} aUSDC
          • aUSDT: ${walletBalanceAUSDT.toString()} aUSDT

          Withdrawable Amounts from AAVE:
          • DAI: ${extractValue(depositBalanceDAI)} DAI
          • USDC: ${extractValue(depositBalanceUSDC)} USDC
          • USDT: ${extractValue(depositBalanceUSDT)} USDT`;

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
