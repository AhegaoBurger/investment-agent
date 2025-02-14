# ELIZA - CryptoRiskManager

A DeFi risk management AI assistant that helps users navigate multi-chain cryptocurrency strategies across different risk profiles.

## Features

- **Low Risk Profile**: Manage stablecoin deposits, withdrawals, and swaps on Sepolia testnet
- **Medium Risk Profile**: Handle ETH staking on Ankr and re-staking on EigenLayer (Holesky testnet)
- **High Risk Profile**: Estimate memecoin purchases on Linea mainnet
- **Smart Risk Management**: Customizable risk profiles with confirmation-based actions
- **Multi-chain Support**: Operations across Sepolia, Holesky testnets and Linea mainnet

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
AGENT_PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
SAFE_ADDRESS=your_safe_address_here
```

Make sure to replace the placeholder values with your actual credentials.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AhegaoBurger/investment-agent
```

2. Install dependencies:
```bash
pnpm install --no-frozen-lockfile
```

3. Build the project:
```bash
pnpm run build
```

## Usage

1. Start the client:
```bash
pnpm start:client
```

2. Run the CryptoRiskManager character:
```bash
pnpm start --character="characters/cryptoriskmanager.character.json"
```

## Risk Profiles

### Low Risk
- Deposit stablecoins (DAI, USDT, USDC) into Aave on Sepolia testnet
- Manage positions using Gnosis Smart Wallet
- Check APY and optimize yields through stablecoin swaps

### Medium Risk
- Stake ETH on Ankr
- Re-stake on EigenLayer (Holesky testnet)
- Manage withdrawal timeframes (1 week for EigenLayer, 2 weeks for Ankr)

### High Risk
- Estimate memecoin purchases on Linea mainnet
- Simulate trading scenarios
- Access market information and potential returns

## Important Notes

- All actions require explicit user confirmation
- The assistant always verifies risk profile before executing actions
- Withdrawal timeframes are strictly enforced for medium risk operations
- High risk operations are primarily informational/simulated

## Support

For questions or issues, please open an issue in the repository.
