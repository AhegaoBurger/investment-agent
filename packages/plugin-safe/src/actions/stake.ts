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

import Safe from "@safe-global/protocol-kit";

import { encodeFunctionData } from "viem";
import { AavePoolAbi } from "../abi/AavePool";
import { UsdcTokenAbi } from "../abi/UsdcToken";
import { UsdtTokenAbi } from "../abi/UsdtToken";
import { DaiTokenAbi } from "../abi/DaiToken";

import { stakeTemplate } from "../templates";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import type { StakeParams, StakeResponse } from "../types";

const buildStakeDetails = async (
  state: State,
  runtime: IAgentRuntime
): Promise<StakeParams> => {
  const context = composeContext({
    state,
    template: stakeTemplate,
  });

  console.log("context: ", context);

  const stakeDetails = (await generateObjectDeprecated({
    runtime,
    context,
    modelClass: ModelClass.SMALL,
  })) as StakeParams;

  console.log("stakeDetails: ", stakeDetails);

  return stakeDetails;
};

const TOKEN_CONFIG = {
  USDC: {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8",
    abi: UsdcTokenAbi,
  },
  USDT: {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
    abi: UsdtTokenAbi,
  },
  DAI: {
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    abi: DaiTokenAbi,
  },
  // WETH: {
  //   address: "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c",
  //   abi: WethTokenAbi,
  // },
} as const;

type TokenSymbol = keyof typeof TOKEN_CONFIG;

export class StakeAction {
  constructor(private safe: typeof Safe) {}

  private getTokenConfig(token: string): { address: string; abi: any } {
    // Check if it's already an address
    if (token.startsWith("0x")) {
      // For direct addresses, we'll need to determine which ABI to use
      // This could be enhanced with on-chain detection of token type
      return {
        address: token,
        abi: UsdcTokenAbi, // Default ABI - you might want to handle this differently
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

  async stake(params: StakeParams): Promise<StakeResponse> {
    // const aavePoolAddress = process.env.AAVE_POOL_ADDRESS;

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;
    const safeAddress = "0x6485A7046704ca7127B6D9Db3a3519F41C4976c0";
    const aavePoolAddress = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

    // Get the actual token address
    const tokenConfig = this.getTokenConfig(params.token);

    console.log("tokenConfig: ", tokenConfig);

    const preExistingSafe = await this.safe.init({
      provider: process.env.RPC_URL,
      signer: agentPrivateKey,
      safeAddress: safeAddress,
    });

    // Create approve transaction
    const callDataTokenApprove = encodeFunctionData({
      abi: tokenConfig.abi,
      functionName: "approve",
      args: [aavePoolAddress, BigInt(params.amount)],
    });

    const safeTokenApproveTx: MetaTransactionData = {
      to: tokenConfig.address, // Token address
      value: "0",
      data: callDataTokenApprove,
      operation: OperationType.Call,
    };

    // Create supply transaction
    const callDataAaveSupply = encodeFunctionData({
      abi: AavePoolAbi,
      functionName: "supply",
      args: [tokenConfig.address, BigInt(params.amount), safeAddress, 0],
    });

    const safeAaveSupplyTx: MetaTransactionData = {
      to: aavePoolAddress,
      value: "0",
      data: callDataAaveSupply,
      operation: OperationType.Call,
    };

    // Create and execute batch transaction
    const tx = await preExistingSafe.createTransaction({
      transactions: [safeTokenApproveTx, safeAaveSupplyTx],
      onlyCalls: true,
    });

    const txResponse = await preExistingSafe.executeTransaction(tx);

    console.log("txResponse:", txResponse);

    return {
      hash: txResponse.hash,
      from: safeAddress,
      to: aavePoolAddress,
      value: BigInt(params.amount),
      aTokenAddress: "", // You would get this from AAVE's data provider
      chainId: Number(params.chain),
    };
  }
}

export const stake: Action = {
  name: "STAKE",
  similes: [
    "SUPPLY_TO_AAVE",
    "DEPOSIT_TO_AAVE",
    "LEND_ON_AAVE",
    "STAKE_ON_AAVE",
    "PROVIDE_LIQUIDITY_AAVE",
    "AAVE_DEPOSIT",
    "AAVE_SUPPLY",
    "AAVE_STAKE",
  ],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return true;
  },
  description:
    "Supplies/stakes tokens to the AAVE lending protocol to earn yield",
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

    const action = new StakeAction(Safe.default);

    try {
      // Get stake parameters from the template
      const stakeParams = await buildStakeDetails(state, runtime);

      // Execute stake operation
      const stakeResp = await action.stake(stakeParams);

      if (callback) {
        callback({
          text: `Successfully staked ${stakeParams.amount} ${stakeParams.token} to AAVE\nTransaction Hash: ${stakeResp.hash}`,
        });
      }

      return true;
    } catch (error) {
      console.error("Error during AAVE staking:", error);
      if (callback) {
        callback({
          text: `Error staking tokens: ${error.message}`,
        });
      }
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "I want to supply 1000 USDT to AAVE" },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your USDT to the AAVE lending pool to earn yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you deposit my ETH into AAVE for lending?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your ETH to AAVE. This will earn you aETH tokens representing your deposit",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "How do I earn yield on my USDC using AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your USDC to AAVE's lending pool. You'll earn interest and receive aUSDC tokens in return",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Supply 500 DAI to AAVE please",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll process your DAI deposit to AAVE. You'll start earning yield immediately",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I'd like to become an AAVE liquidity provider with my WBTC",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your WBTC to AAVE's lending pool. You'll receive aWBTC tokens representing your position",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the process for lending my tokens on AAVE?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I can help you supply your tokens to AAVE. This will allow you to earn interest while maintaining the ability to withdraw anytime",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "Put my MATIC into AAVE's lending pool",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your MATIC to AAVE. You'll receive aMATIC tokens and start earning yield",
          action: "STAKE",
        },
      },
    ],

    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to earn interest on my stablecoins using AAVE",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "I'll help you supply your stablecoins to AAVE's lending pool to start earning yield",
          action: "STAKE",
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
