import {
  type IAgentRuntime,
  type Memory,
  type Provider,
  type State,
} from "@elizaos/core";

import { ethers } from "ethers";
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
import { UsdtTokenAbi } from "../abi/UsdtToken";
import { DaiTokenAbi } from "../abi/DaiToken";

const AAVE_V3_POOL = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

const RAY = Math.pow(10, 27);
const WAD = Math.pow(10, 18);
const SECONDS_PER_YEAR = 31556926.0;

type TokenConfig = {
  address: string;
  abi: any;
  decimals: number;
};

type TokenConfigMap = {
  [key: string]: TokenConfig;
};

type ApyResult = {
  token: string;
  supplyAPY: number;
  variableBorrowAPY: number;
  decimals: number;
};

async function getAaveAPY(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<{ supplyAPY: number; variableBorrowAPY: number }> {
  try {
    const poolContract = new ethers.Contract(
      AAVE_V3_POOL,
      AavePoolAbi,
      provider
    );

    const reserveData = await poolContract.getReserveData(tokenAddress);

    // Convert BigNumber to string then to float
    const liquidityRate = parseFloat(
      reserveData.currentLiquidityRate.toString()
    );
    const variableBorrowRate = parseFloat(
      reserveData.currentVariableBorrowRate.toString()
    );

    // Calculate APYs using the simple formula (matches Python implementation)
    const depositAPY = (100.0 * liquidityRate) / RAY;
    const variableBorrowAPY = (100.0 * variableBorrowRate) / RAY;

    // Calculate compound APY (if needed)
    const compoundSupplyAPY =
      (1 + Number(liquidityRate.toString()) / Number(RAY.toString())) **
        SECONDS_PER_YEAR -
      1;

    // Log data for debugging
    // console.log("token address: ", tokenAddress);
    // console.log("depositAPY: ", depositAPY);
    // console.log("variableBorrowAPY: ", variableBorrowAPY);
    // console.log("liquidityRate: ", liquidityRate);
    // console.log("variableBorrowRate: ", variableBorrowRate);

    return {
      supplyAPY: depositAPY, // Using simple APY calculation
      variableBorrowAPY: variableBorrowAPY,
    };
  } catch (error) {
    console.error(`Error fetching Aave APY for token ${tokenAddress}:`, error);
    throw error;
  }
}

async function getAllTokenAPYs(
  tokenConfig: TokenConfigMap,
  provider: ethers.providers.Provider
): Promise<ApyResult[]> {
  const results: ApyResult[] = [];

  for (const [tokenName, config] of Object.entries(tokenConfig)) {
    try {
      const apyData = await getAaveAPY(config.address, provider);
      results.push({
        token: tokenName,
        ...apyData,
        decimals: config.decimals,
      });
    } catch (error) {
      console.error(`Failed to fetch APY for ${tokenName}:`, error);
      results.push({
        token: tokenName,
        supplyAPY: -1,
        variableBorrowAPY: -1,
        decimals: config.decimals,
      });
    }
  }

  return results;
}

const apyProvider: Provider = {
  get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
    const TOKEN_CONFIG = {
      USDC: {
        address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
        abi: UsdcTokenAbi,
        decimals: 6,
      },
      USDT: {
        address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
        abi: UsdtTokenAbi,
        decimals: 6,
      },
      DAI: {
        address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
        abi: DaiTokenAbi,
        decimals: 18,
      },
    };

    const provider = new ethers.providers.JsonRpcProvider(
      "https://ethereum-sepolia-rpc.publicnode.com/"
    );

    try {
      const allApyData = await getAllTokenAPYs(TOKEN_CONFIG, provider);

      // Format the APY data into a readable text
      const formattedText = `Here are the current APY rates:

                  Supply APY Rates:
                  • DAI: ${allApyData
                    .find((data) => data.token === "DAI")
                    ?.supplyAPY.toFixed(2)}%
                  • USDC: ${allApyData
                    .find((data) => data.token === "USDC")
                    ?.supplyAPY.toFixed(2)}%
                  • USDT: ${allApyData
                    .find((data) => data.token === "USDT")
                    ?.supplyAPY.toFixed(2)}%

                  Variable Borrow APY Rates:
                  • DAI: ${allApyData
                    .find((data) => data.token === "DAI")
                    ?.variableBorrowAPY.toFixed(2)}%
                  • USDC: ${allApyData
                    .find((data) => data.token === "USDC")
                    ?.variableBorrowAPY.toFixed(2)}%
                  • USDT: ${allApyData
                    .find((data) => data.token === "USDT")
                    ?.variableBorrowAPY.toFixed(2)}%`;

      // Print results in a formatted table
      console.table(
        allApyData.map((data) => ({
          Token: data.token,
          "Supply APY (%)": data.supplyAPY.toFixed(2),
          "Borrow APY (%)": data.variableBorrowAPY.toFixed(2),
          Decimals: data.decimals,
        }))
      );

      return formattedText;
    } catch (error) {
      console.error("Error fetching APY data:", error);
      return error;
    }
  },
};

export { apyProvider };
