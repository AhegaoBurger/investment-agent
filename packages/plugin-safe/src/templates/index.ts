export const tradeToCowSwapTemplate = `You are an AI assistant specialized in processing CowSwap trade requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested CowSwap trade:
1. Token to sell (symbol or address)
2. Token to buy (symbol or address)
3. Input amount (as a string, without the token symbol)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the token to sell.
   - Quote the part mentioning the token to buy.
   - Quote the part mentioning the amount to trade.

2. Validate each piece of information:
   - Token to sell: Identify the token symbol or address for selling.
   - Token to buy: Identify the token symbol or address for buying.
   - Amount: Attempt to convert the amount to a number to verify it's valid.

3. If any required information is missing or invalid, prepare an appropriate error message.

4. If all required information is valid, summarize your findings.

After your analysis, provide the final output in a JSON markdown block. The JSON should have this structure:

\`\`\`json
{
    "tokenToSell": string,
    "tokenToBuy": string,
    "inputAmount": string
}
\`\`\`

Remember:
- The tokens should be either symbols (e.g., "USDC", "ETH", "USDT") or contract addresses
- The input amount should be a string representing the number without any currency symbol
- All fields are required for a valid trade

Now, process the user's request and provide your response.`;

export const stakeTemplate = `You are an AI assistant specialized in processing AAVE staking/lending requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested AAVE staking:
1. Chain to execute on
2. Amount to stake (as a string, without the token symbol)
3. Token to stake (symbol or address)
4. Safe address (if specified)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the chain (if any).
   - Quote the part mentioning the amount.
   - Quote the part mentioning the token to stake.
   - Quote the part mentioning the safe address (if any).

2. Validate each piece of information:
   - Chain: Check if a specific chain is mentioned, default to "sepolia" if not specified.
   - Amount: Attempt to convert the amount to a number to verify it's valid.
   - Token: Identify the token symbol or address.
   - Safe Address: If provided, check that it starts with "0x" and has 42 characters.

3. If any required information is missing or invalid, prepare an appropriate error message.

4. If all required information is valid, summarize your findings.

After your analysis, provide the final output in a JSON markdown block. The JSON should have this structure:

\`\`\`json
{
    "chain": "ethereum" | "sepolia" | "polygon" | "arbitrum" | "optimism" | null,
    "amount": string,
    "token": string,
    "safeAddress": string | null
}
\`\`\`

Remember:
- The amount should be a string representing the number without any currency symbol
- The token should be the symbol (e.g., "USDC", "ETH", "USDT") or the token's contract address
- If no safe address is specified, set it to null
- If no chain is specified, default to "sepolia"

Now, process the user's request and provide your response.`;

export const transferTemplate = `You are an AI assistant specialized in processing cryptocurrency transfer requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Here's a list of supported chains:
<supported_chains>
{{supportedChains}}
</supported_chains>

Your goal is to extract the following information about the requested transfer:
1. Chain to execute on (must be one of the supported chains)
2. Amount to transfer (in ETH, without the coin symbol)
3. Recipient address (must be a valid Ethereum address)
4. Token symbol or address (if not a native token transfer)

Before providing the final JSON output, show your reasoning process inside <analysis> tags. Follow these steps:

1. Identify the relevant information from the user's message:
   - Quote the part of the message mentioning the chain.
   - Quote the part mentioning the amount.
   - Quote the part mentioning the recipient address.
   - Quote the part mentioning the token (if any).

2. Validate each piece of information:
   - Chain: List all supported chains and check if the mentioned chain is in the list.
   - Amount: Attempt to convert the amount to a number to verify it's valid.
   - Address: Check that it starts with "0x" and count the number of characters (should be 42).
   - Token: Note whether it's a native transfer or if a specific token is mentioned.

3. If any information is missing or invalid, prepare an appropriate error message.

4. If all information is valid, summarize your findings.

5. Prepare the JSON structure based on your analysis.

After your analysis, provide the final output in a JSON markdown block. All fields except 'token' are required. The JSON should have this structure:

\`\`\`json
{
    "fromChain": string,
    "amount": string,
    "toAddress": string,
    "token": string | null
}
\`\`\`

Remember:
- The chain name must be a string and must exactly match one of the supported chains.
- The amount should be a string representing the number without any currency symbol.
- The recipient address must be a valid Ethereum address starting with "0x".
- If no specific token is mentioned (i.e., it's a native token transfer), set the "token" field to null.

Now, process the user's request and provide your response.
`;

export const bridgeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token bridge:
- Token symbol or address to bridge
- Source chain
- Destination chain
- Amount to bridge: Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1")
- Destination address (if specified)

Respond with a JSON markdown block containing only the extracted values:

\`\`\`json
{
    "token": string | null,
    "fromChain": "ethereum" | "abstract" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "fraxtal" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | "alienx" | "gravity" | null,
    "toChain": "ethereum" | "abstract" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "fraxtal" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | "alienx" | "gravity" |  null,
    "amount": string | null,
    "toAddress": string | null
}
\`\`\`
`;

export const swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Input token symbol or address (the token being sold)
- Output token symbol or address (the token being bought)
- Amount to swap: Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1")
- Chain to execute on

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "inputToken": string | null,
    "outputToken": string | null,
    "amount": string | null,
    "chain": "ethereum" | "abstract" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | "alienx" | null,
    "slippage": number | null
}
\`\`\`
`;

export const proposeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested proposal:
- Targets
- Values
- Calldatas
- Description
- Governor address
- Chain to execute on

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "targets": string[] | null,
    "values": string[] | null,
    "calldatas": string[] | null,
    "description": string | null,
    "governor": string | null
    "chain": "ethereum" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | null,
}
\`\`\`
`;

export const voteTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested vote:
- Proposal ID
- Support (1 for yes, 2 for no, 3 for abstain)
- Governor address
- Chain to execute on

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "proposalId": string | null,
    "support": number | null,
    "governor": string | null
    "chain": "ethereum" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | null,
}
\`\`\`
`;

export const queueProposalTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested proposal:
- Targets
- Values
- Calldatas
- Description
- Governor address
- Chain to execute on

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "targets": string[] | null,
    "values": string[] | null,
    "calldatas": string[] | null,
    "description": string | null,
    "governor": string | null
    "chain": "ethereum" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | null,
}
\`\`\`
`;

export const executeProposalTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested proposal:
- Targets
- Values
- Calldatas
- Description
- Governor address
- Chain to execute on

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "targets": string[] | null,
    "values": string[] | null,
    "calldatas": string[] | null,
    "description": string | null,
    "governor": string | null
    "chain": "ethereum" | "base" | "sepolia" | "bsc" | "arbitrum" | "avalanche" | "polygon" | "optimism" | "cronos" | "gnosis" | "fantom" | "klaytn" | "celo" | "moonbeam" | "aurora" | "harmonyOne" | "moonriver" | "arbitrumNova" | "mantle" | "linea" | "scroll" | "filecoin" | "taiko" | "zksync" | "canto" | null,
}
\`\`\`
`;
