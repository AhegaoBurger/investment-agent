import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  type HandlerCallback,
  type State,
} from "@elizaos/core";

import { Address, createPublicClient, http, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { linea } from "viem/chains";

// ABI for the router that provides `getAmountOut`
import { lynexAbi } from "../abi/LynexAbi";

/**
 * ACTION: ESTIMATE_MEMECOIN_PURCHASE
 *
 * This action estimates how many memecoins (FOXY, CROAK, LINDA, etc.)
 * can be bought on Linea with a given amount of WETH. Because these
 * tokens aren’t actually available on testnet and the user’s wallet
 * is empty, no real trade is made; we only show an estimate.
 */

export const estimateMemecoinPurchase: Action = {
  name: "ESTIMATE_MEMECOIN_PURCHASE",
  similes: [
    "CALCULATE_MEMECOIN_TRADE",
    "ESTIMATE_MEMECOIN_SWAP",
    "LINEA_MEMECOIN_QUOTE",
    "SIMULATE_MEMECOIN_PURCHASE",
    "MEMECOIN_ESTIMATION",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    // Any extra validation logic can go here
    return true;
  },
  description:
    "Estimates how many memecoins can be purchased on Linea with a given amount of WETH, without executing the trade. Mentions user’s wallet is empty and warns it’s only an estimate.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Starting memecoin purchase estimation on Linea...");

    try {
      // 1) Prepare a public client (testnet or mainnet if needed)
      const publicClient = createPublicClient({
        chain: linea,
        transport: http(),
      });

      // 2) For demonstration, we read an environment variable for a private key
      //    (not strictly needed here since we are only estimating).
      //    We'll do it anyway in case you want to adapt it to sign something in the future.
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY?.startsWith("0x")
        ? (process.env.AGENT_PRIVATE_KEY as Hex)
        : (`0x${process.env.AGENT_PRIVATE_KEY}` as Hex);

      if (!agentPrivateKey) {
        console.log("No AGENT_PRIVATE_KEY found. Using read-only approach.");
      }

      // 3) Reference addresses
      const lynexRouterAddress = "0x610D2f07b7EdC67565160F587F37636194C34E74";
      const wETHLineaAddress = "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f";

      // Example memecoins (not actually available on testnet):
      const FOXY = "0x5FBDF89403270a1846F5ae7D113A989F850d1566";
      const CROAK = "0xaCb54d07cA167934F57F829BeE2cC665e1A5ebEF";
      const LINDA = "0x82cC61354d78b846016b559e3cCD766fa7E793D5";

      // 4) Function to get a rough quote from the router
      async function estimateTxOutput(
        amountIn: bigint,
        tokenIn: Address,
        tokenOut: Address
      ): Promise<bigint> {
        console.log(
          `Estimating trade from tokenIn=${tokenIn} to tokenOut=${tokenOut} for amountIn=${amountIn}...`
        );
        const amountOut = await publicClient.readContract({
          address: lynexRouterAddress as Address,
          abi: lynexAbi,
          functionName: "getAmountOut",
          args: [amountIn, tokenIn, tokenOut],
        });
        return amountOut as bigint;
      }

      // 5) Example usage: Suppose user wants to see how many CROAK they can get for 0.1 WETH
      const amountWethToSpend = BigInt(0.1e18);
      const memecoinAddress = CROAK; // or FOXY, LINDA, etc.

      const estimatedAmountOut = await estimateTxOutput(
        amountWethToSpend,
        wETHLineaAddress as Address,
        memecoinAddress as Address
      );

      console.log(`Estimated memecoin out: ${estimatedAmountOut.toString()}`);

      // 6) Construct the result message. Emphasize that the user’s wallet is empty, so no real trade can occur.
      const resultText = `You could theoretically get ~${estimatedAmountOut.toString()} memecoins (CROAK) for 0.1 WETH on Linea. However, your wallet is empty on testnet, and these tokens are not actually tradable here. This is only an estimation.`;

      if (callback) {
        callback({
          text: resultText,
          content: {
            estimatedAmount: estimatedAmountOut.toString(),
            note: "No actual trade executed. User wallet is empty, tokens not on testnet.",
          },
        });
      }

      return true;
    } catch (error) {
      console.error("Error estimating memecoin purchase:", error);
      if (callback) {
        callback({
          text: `Error while estimating memecoin purchase: ${error.message}`,
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
          text: "How many CROAK can I buy with 0.1 WETH on Linea?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll estimate how many CROAK you'd receive for 0.1 WETH, but your wallet is empty, so this is only a simulation.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you show me how many FOXY I'd get if I swapped 2 WETH on Linea testnet?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can provide a rough estimate using the router's getAmountOut function. Keep in mind that there's no actual trade on testnet.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to see how many LINDA tokens I'd get with 1.5 WETH on the testnet.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll calculate an approximate output using the router, but note that your wallet is empty and the trade cannot be executed on Linea testnet.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
  ] as ActionExample[][],
};
