import {
    type IAgentRuntime,
    type Memory,
    type State,
    type Provider,
  } from "@elizaos/core";

  import {
    Address,
    createPublicClient,
    defineChain,
    http,
  } from "viem";
  import { holesky } from "viem/chains";
  import { AnkrTokenAbi } from "../abi/AnkrToken";

  const ANKRETH_HOLESKY_ADDRESS = "0x8783c9c904e1bdc87d9168ae703c8481e8a477fd";
  const AGENT_ADDRESS = "0xbae3ef488949f236f967796AB1Ec262f97F44E78"; // Update if needed
  const DECIMALS = 18; // ankrETH has 18 decimals

  const publicClient = createPublicClient({
    chain: holesky,
    transport: http(),
  });

  async function getWalletBalance(tokenAddress: string) {
    return publicClient.readContract({
      address: tokenAddress as Address,
      abi: AnkrTokenAbi,
      functionName: "balanceOf",
      args: [AGENT_ADDRESS],
    });
  }

  function formatTokenAmount(amount: string | bigint, decimals: number): string {
    const amountStr = amount.toString();
    const value = Number(amountStr) / Math.pow(10, decimals);
    return value.toFixed(5); // Limit decimal places for readability
  }

  const holeSkyBalanceProvider: Provider = {
    get: async () => {
      try {
        const walletBalance = await getWalletBalance(ANKRETH_HOLESKY_ADDRESS);
        return `Your ankrETH balance on Holesky: ${formatTokenAmount(walletBalance, DECIMALS)} ankrETH`;
      } catch (error) {
        return `Error retrieving ankrETH balance: ${error}`;
      }
    },
  };

  export { holeSkyBalanceProvider };
