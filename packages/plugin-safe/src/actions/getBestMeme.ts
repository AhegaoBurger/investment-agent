import {
  type ActionExample,
  type IAgentRuntime,
  type Memory,
  type Action,
  type HandlerCallback,
  type State,
} from "@elizaos/core";

import { Address, createPublicClient, http } from "viem";
import { linea } from "viem/chains";

// ACTION: EVALUATE_BEST_MEMECOIN
//
// This action fetches updated DexScreener data for three memecoins (FOXY, CROAK, LINDA)
// on Linea, computes a short-term momentum-based "score" for each coin, and returns
// whichever coin currently looks best to buy according to that simple formula. No trades
// are executed.

export const evaluateBestMemecoin: Action = {
  name: "EVALUATE_BEST_MEMECOIN",
  similes: [
    "SELECT_BEST_MEMECOIN",
    "ANALYZE_MEMECOIN_MOMENTUM",
    "COMPARE_LINEA_MEMECOINS",
    "EVALUATE_MEMECOIN_OPPORTUNITIES",
  ],
  description:
    "Fetches DexScreener data for FOXY, CROAK, and LINDA on Linea, applies a short-term momentum scoring formula, and picks the best coin to buy.",
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    // Any extra validation logic can go here
    return true;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: any,
    callback?: HandlerCallback
  ): Promise<boolean> => {
    console.log("Evaluating best memecoin to buy...");

    try {
      // 1) Token Addresses
      const FOXY: Address = "0x5FBDF89403270a1846F5ae7D113A989F850d1566";
      const CROAK: Address = "0xaCb54d07cA167934F57F829BeE2cC665e1A5ebEF";
      const LINDA: Address = "0x82cC61354d78b846016b559e3cCD766fa7E793D5";

      // 2) Build the DexScreener API URL (comma-separated addresses)
      const apiUrl = `https://api.dexscreener.com/tokens/v1/linea/${FOXY},${CROAK},${LINDA}`;

      // 3) Fetch data from DexScreener
      const response = await fetch(apiUrl, { method: "GET" });
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        const msg = "No token data returned from DexScreener.";
        console.error(msg);
        callback?.({ text: msg, content: { error: msg } });
        return false;
      }

      // 4) Scoring function that emphasizes short-term momentum and volume
      function computeCoinScore(coin: any): number {
        // Volumes
        const volume5m = coin.volume?.m5 || 0;
        const volume1h = coin.volume?.h1 || 0;
        const volume6h = coin.volume?.h6 || 0;
        const volume24h = coin.volume?.h24 || 0;

        // Price changes (%)
        const pc5m = coin.priceChange?.m5 || 0;
        const pc1h = coin.priceChange?.h1 || 0;
        const pc6h = coin.priceChange?.h6 || 0;
        const pc24h = coin.priceChange?.h24 || 0;

        // Weighted volume factor
        //   5m has weight 2.0
        //   1h has weight 1.5
        //   6h has weight 1.0
        //   24h has weight 0.5
        const volFactor =
          volume5m * 2.0 +
          volume1h * 1.5 +
          volume6h * 1.0 +
          volume24h * 0.5;

        // Weighted price factor
        //   5m has weight 3.0
        //   1h has weight 2.0
        //   6h has weight 1.5
        //   24h has weight 1.0
        const priceFactor =
          pc5m * 3.0 + pc1h * 2.0 + pc6h * 1.5 + pc24h * 1.0;

        // Multiply volume factor by price factor
        return volFactor * priceFactor;
      }

      let bestCoin: any = null;
      let bestScore: number = Number.NEGATIVE_INFINITY;

      // 5) Loop through the coins, compute the score, track the best
      for (const coin of data) {
        const score = computeCoinScore(coin);

        console.log(
          `Token: ${coin.baseToken.symbol} | Score: ${score.toFixed(2)} | ` +
            `Volumes: 5m=${coin.volume?.m5}, 1h=${coin.volume?.h1}, ` +
            `6h=${coin.volume?.h6}, 24h=${coin.volume?.h24} | ` +
            `PriceChg: 5m=${coin.priceChange?.m5}, 1h=${coin.priceChange?.h1}, ` +
            `6h=${coin.priceChange?.h6}, 24h=${coin.priceChange?.h24}`
        );

        if (score > bestScore) {
          bestScore = score;
          bestCoin = coin;
        }
      }

      // 6) Prepare a response message
      if (!bestCoin) {
        const msg = "Could not find the best memecoin from the data.";
        console.log(msg);
        callback?.({
          text: msg,
          content: { error: msg },
        });
        return false;
      }

      const resultText = `Based on short-term momentum and volume, the best memecoin to buy right now is: ${bestCoin.baseToken.name} (${bestCoin.baseToken.symbol}). Score: ${bestScore.toFixed(
        2
      )}`;
      console.log(resultText);

      callback?.({
        text: resultText,
        content: {
          bestCoin: bestCoin.baseToken.symbol,
          bestCoinName: bestCoin.baseToken.name,
          bestScore: bestScore.toFixed(2),
        },
      });

      return true;
    } catch (error: any) {
      const errMsg = `Error while evaluating best memecoin: ${error.message}`;
      console.error(errMsg, error);
      callback?.({ text: errMsg, content: { error: errMsg } });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Which memecoin on Linea looks like the best buy right now?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "Let me fetch DexScreener data and compare short-term price changes and volumes for FOXY, CROAK, and LINDA.",
          action: "EVALUATE_BEST_MEMECOIN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check the momentum for FOXY, CROAK, and LINDA. Which one is trending most strongly?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll pull fresh data from the DexScreener API, evaluate each coin’s short-term momentum, and let you know which is best.",
          action: "EVALUATE_BEST_MEMECOIN",
        },
      },
    ],
  ] as ActionExample[][],
};
