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
  type Provider,
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

const balanceProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    // console.log("process.env.RPC_URL", process.env.RPC_URL);

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

    // console.log("publicClient", publicClient);

    // Helper function to get the wallet balance for a given token using its ERC20 interface
    async function getWalletBalance(tokenAddress: string, abi: any) {
      // console.log("getWalletBalance", tokenAddress);
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
      // console.log("getAaveDepositedBalance", tokenAddress, "amount: ", amount);

      if (amount === 0) {
        // console.log("getAaveDepositedBalance amount is 0, returning 0");
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

    // console.log("DAI Wallet Balance:", walletBalanceDAI.toString());
    // console.log("DAI Deposited on AAVE:", depositBalanceDAI.toString());
    // console.log("USDC Wallet Balance:", walletBalanceUSDC.toString());
    // console.log("USDC Deposited on AAVE:", depositBalanceUSDC);
    // console.log("USDT Wallet Balance:", walletBalanceUSDT.toString());
    // console.log("USDT Deposited on AAVE:", depositBalanceUSDT.toString());

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

    function formatTokenAmount(
      amount: string | bigint,
      decimals: number
    ): string {
      const amountStr = amount.toString();
      const value = Number(amountStr) / Math.pow(10, decimals);
      return value.toFixed(decimals > 5 ? 5 : decimals); // Limit decimal places for readability
    }

    // Constants for token decimals
    const DECIMALS = {
      USDC: 6, // USDC has 6 decimals
      USDT: 6, // USDT has 6 decimals
      DAI: 18, // DAI has 18 decimals
    };

    // Format the return object with balances
    const balances = {
      DAI: {
        wallet: formatTokenAmount(walletBalanceDAI, DECIMALS.DAI),
        aaveDeposited: formatTokenAmount(
          extractValue(depositBalanceDAI),
          DECIMALS.DAI
        ),
      },
      USDC: {
        wallet: formatTokenAmount(walletBalanceUSDC, DECIMALS.USDC),
        aaveDeposited: formatTokenAmount(
          extractValue(depositBalanceUSDC),
          DECIMALS.USDC
        ),
      },
      USDT: {
        wallet: formatTokenAmount(walletBalanceUSDT, DECIMALS.USDT),
        aaveDeposited: formatTokenAmount(
          extractValue(depositBalanceUSDT),
          DECIMALS.USDT
        ),
      },
      ADAI: {
        wallet: formatTokenAmount(walletBalanceADAI, DECIMALS.DAI),
      },
      AUSDC: {
        wallet: formatTokenAmount(walletBalanceAUSDC, DECIMALS.USDC),
      },
      AUSDT: {
        wallet: formatTokenAmount(walletBalanceAUSDT, DECIMALS.USDT),
      },
    };

    // Additional logic to aggregate or further process the retrieved balances could be added here.

    try {
      // Format the balances into a readable text
      const formattedText = `Here are your current positions:

            Wallet Balances:
            • DAI: ${formatTokenAmount(walletBalanceDAI, DECIMALS.DAI)} DAI
            • USDC: ${formatTokenAmount(walletBalanceUSDC, DECIMALS.USDC)} USDC
            • USDT: ${formatTokenAmount(walletBalanceUSDT, DECIMALS.USDT)} USDT

            AAVE Deposits (aTokens):
            • aDAI: ${formatTokenAmount(walletBalanceADAI, DECIMALS.DAI)} aDAI
            • aUSDC: ${formatTokenAmount(
              walletBalanceAUSDC,
              DECIMALS.USDC
            )} aUSDC
            • aUSDT: ${formatTokenAmount(
              walletBalanceAUSDT,
              DECIMALS.USDT
            )} aUSDT

            Withdrawable Amounts from AAVE:
            • DAI: ${formatTokenAmount(
              extractValue(depositBalanceDAI),
              DECIMALS.DAI
            )} DAI
            • USDC: ${formatTokenAmount(
              extractValue(depositBalanceUSDC),
              DECIMALS.USDC
            )} USDC
            • USDT: ${formatTokenAmount(
              extractValue(depositBalanceUSDT),
              DECIMALS.USDT
            )} USDT`;

      return formattedText;
    } catch (error) {
      console.error("Error retrieving balances:", error);

      return error;
    }
    // return "Key facts that {{agentName}} knows:\n{{formattedFacts}}"
    //   .replace("{{agentName}}", runtime.character.name)
    //   .replace("{{formattedFacts}}", formattedFacts);
  },
};

export { balanceProvider };
