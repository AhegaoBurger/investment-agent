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

// Supported order kinds for CowSwap
export type CowSwapOrderKind = "SELL" | "BUY";

// Basic token information
export interface CowSwapToken {
  address: Address;
  symbol: string;
  decimals: number;
}

// Parameters for CowSwap trade
export interface CowSwapTradeParams {
  tokenToSell: Address | string; // Can be either a token address or symbol
  tokenToBuy: Address | string; // Can be either a token address or symbol
  inputAmount: string;
  orderKind?: CowSwapOrderKind;
  receiver?: Address; // Optional: defaults to safe address
  validTo?: number; // Optional: order validity in seconds
  partiallyFillable?: boolean; // Optional: whether order can be partially filled
}

// CowSwap trade response
export interface CowSwapTradeResponse {
  orderId: string;
  hash?: Hash;
  from: Address;
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  buyAmount?: bigint;
  status: CowSwapOrderStatus;
  creationTime: number;
  executionTime?: number;
}

// CowSwap order status
export type CowSwapOrderStatus =
  | "PENDING"
  | "EXECUTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

// CowSwap transaction types
export interface CowSwapApprovalTransaction {
  to: Address; // Token address
  value: string;
  data: `0x${string}`;
  operation: number;
}

export interface CowSwapOrderTransaction {
  to: Address; // CowSwap settlement contract
  value: string;
  data: `0x${string}`;
  operation: number;
}

// CowSwap quote information
export interface CowSwapQuote {
  sellAmount: bigint;
  buyAmount: bigint;
  feeAmount: bigint;
  validTo: number;
  quote: {
    price: string;
    priceImpact: string;
    estimatedExecutionPrice: string;
  };
}

// Error types
export interface CowSwapError extends Error {
  code?: number;
  data?: unknown;
  orderId?: string;
  transaction?: {
    hash: Hash;
    status: "failed" | "reverted";
  };
}

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
