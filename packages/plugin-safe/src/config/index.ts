import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// JSON-RPC Account
export const account = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
// Local Account
// export const account = privateKeyToAccount(...)

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});
