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
 * can be bought on Linea **using ETH/WETH only**. No other tokens (USDC, DAI, etc.)
 * are accepted here. The function reads the router’s getAmountOut to provide
 * an approximate quote. Because these memecoins aren’t actually available on
 * Linea testnet and the user has an empty wallet, no real trade is made.
 * This is purely informational.
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
    "Estimates how many memecoins can be purchased on Linea with a given amount of ETH/WETH, without executing the trade. Emphasizes that it’s only an estimate, since memecoins are not on testnet and the user’s wallet is empty.",
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Starting memecoin purchase estimation on Linea...");

    try {
      // 1) Prepare a public client for the Linea mainnet settings (or testnet,
      //    but memecoins do not actually exist on the testnet).
      const publicClient = createPublicClient({
        chain: linea,
        transport: http(),
      });

      // 2) We read an environment variable for a private key
      //    (not strictly needed to just estimate).
      const agentPrivateKey = process.env.AGENT_PRIVATE_KEY?.startsWith("0x")
        ? (process.env.AGENT_PRIVATE_KEY as Hex)
        : (`0x${process.env.AGENT_PRIVATE_KEY}` as Hex);

      if (!agentPrivateKey) {
        console.log("No AGENT_PRIVATE_KEY found. Using read-only approach.");
      } else {
        // If we needed to sign something in the future, we could do so here.
        privateKeyToAccount(agentPrivateKey);
      }

      // 3) Reference addresses
      const lynexRouterAddress = "0x610D2f07b7EdC67565160F587F37636194C34E74";
      // We ONLY use WETH for the input token:
      const wETHLineaAddress = "0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f";

      // Example memecoins (not actually tradable on testnet):
      const FOXY = "0x5FBDF89403270a1846F5ae7D113A989F850d1566";
      const CROAK = "0xaCb54d07cA167934F57F829BeE2cC665e1A5ebEF";
      const LINDA = "0x82cC61354d78b846016b559e3cCD766fa7E793D5";

      // 4) Function to get a rough quote from the router:
      //    We are always dealing with WETH -> memecoin,
      //    never stablecoins or other tokens.
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
      //    We only do a demonstration here. In practice, the user might specify a custom amount.
      const amountWethToSpend = BigInt(0.1e18);
      const memecoinAddress = CROAK; // This is just an example; could be FOXY or LINDA, etc.

      const estimatedAmountOut = await estimateTxOutput(
        amountWethToSpend,
        wETHLineaAddress as Address,
        memecoinAddress as Address
      );

      console.log(`Estimated memecoin out: ${estimatedAmountOut.toString()}`);

      // 6) Construct the result message. Emphasize that there is no actual trade
      //    because memecoins are not on the testnet, and the user’s wallet is empty.
      const resultText = `You could theoretically get ~${estimatedAmountOut.toString()} memecoins (CROAK) for 0.1 WETH on Linea. However, no real trade can be made here because these tokens are not on testnet and your wallet is empty. This is only an estimate.`;

      if (callback) {
        callback({
          text: resultText,
          content: {
            estimatedAmount: estimatedAmountOut.toString(),
            note: "Only an estimation using WETH on Linea. No actual trade executed.",
          },
        });
      }

      return true;
    } catch (error) {
      console.error("Error estimating memecoin purchase:", error);
      if (callback) {
        callback({
          text: `Error while estimating memecoin purchase: ${(error as Error).message}`,
          content: { error: (error as Error).message },
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
          text: "How many CROAK can I buy with 0.1 ETH on Linea?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll estimate how many CROAK you'd receive for 0.1 ETH (converted to WETH), but your wallet is empty and these memecoins aren’t on testnet, so it's just a simulation.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you estimate how much FOXY I'd get if I spent 2 ETH on Linea testnet?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can simulate the swap from 2 ETH (via WETH) to FOXY on Linea. Remember, we can’t actually trade memecoins on testnet; it's only a hypothetical quote.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to see how many LINDA tokens I'd theoretically get for 1.5 ETH on the testnet.",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Sure. I'll provide a rough estimate using WETH on Linea. Keep in mind that your wallet is empty and these tokens aren't live on testnet.",
          action: "ESTIMATE_MEMECOIN_PURCHASE",
        },
      },
    ],
  ] as ActionExample[][],
};
