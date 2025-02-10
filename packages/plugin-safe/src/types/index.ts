import type { Route, Token } from "@lifi/types";
import type {
  Account,
  Address,
  Chain,
  Hash,
  HttpTransport,
  PublicClient,
  WalletClient,
  Log,
} from "viem";
import * as viemChains from "viem/chains";

// Supported tokens for AAVE staking
export type AaveToken =
  | "USDC"
  | "USDT"
  | "DAI"
  | "ETH"
  | "WETH"
  | "WBTC"
  | "WMATIC"
  | "AAVE";

// Supported chains for AAVE protocol
export type AaveChain =
  | "ethereum"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "sepolia";

// Parameters for AAVE staking
export interface StakeParams {
  chain: AaveChain;
  amount: string;
  token: AaveToken | Address; // Can be either a token symbol or contract address
  safeAddress?: Address;
}

// AAVE Pool configuration
export interface AavePoolConfig {
  poolAddress: Address;
  wethGatewayAddress?: Address;
  dataProvider: Address;
}

// AAVE staking response
export interface StakeResponse {
  hash: Hash;
  from: Address;
  to: Address; // AAVE pool address
  value: bigint;
  aTokenAddress: Address; // Address of the received aToken
  data?: `0x${string}`;
  chainId?: number;
}

// AAVE transaction types
export interface AaveApprovalTransaction {
  to: Address; // Token address
  value: string;
  data: `0x${string}`;
  operation: number;
}

export interface AaveSupplyTransaction {
  to: Address; // Pool address
  value: string;
  data: `0x${string}`;
  operation: number;
}

// AAVE market data
export interface AaveMarketData {
  supplyAPY: string;
  totalSupply: string;
  availableLiquidity: string;
  utilizationRate: string;
  token: {
    symbol: AaveToken;
    address: Address;
    decimals: number;
  };
}

// Error types
export interface AaveError extends Error {
  code?: number;
  data?: unknown;
  transaction?: {
    hash: Hash;
    status: "failed" | "reverted";
  };
}
