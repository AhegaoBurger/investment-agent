# ElizaFi – Safe Agentathon by LXers

Welcome to ElizaFi, our AI-powered DeFi risk management assistant built for the Safe Agentathon by Team LXers. This project uses ElizaOS as its framework, runs on Venice AI, and leverages the DeepSeek-R1-Llama-70B model to help users navigate multi-chain crypto strategies in a clear, secure, and user-verified manner.

---

## Project Overview

ElizaFi is designed to guide you through DeFi strategies across different risk levels. It interacts with popular protocols and networks using Gnosis Safe for secure transaction management.

This project is part of the Safe Agentathon and represents our honest effort to combine AI with decentralized finance.

Our main changes, aside from those related to the ElizaOS framework, were the creation of 
`./characters/cryptoriskmanager.character.json` and the development of the plugin 
`./packages/plugin-safe`, along with adjustments to configuration files and the removal of 
unused dependencies.

---

## Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AhegaoBurger/investment-agent
cd investment-agent
```

2. Create a `.env` file in the root directory with the following variables:
```env
AGENT_PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
SAFE_ADDRESS=your_safe_address_here
```
Make sure to replace the placeholder values with your actual credentials.

3. Install dependencies:
```bash
pnpm install --no-frozen-lockfile
```

4. Build the project:
```bash
pnpm run build
```

## Usage

Open two terminal tabs/windows:

In the first terminal:
```bash
pnpm start:client
```

In the second terminal:
```bash
pnpm start --character="characters/cryptoriskmanager.character.json"
```


## Key Features

- **Multi-Chain Operations:** It supports different networks:
  - **Sepolia Testnet** for stablecoin yield and swaps.
  - **Holesky Testnet** for ETH staking and restaking.
  - **Linea Mainnet** for high-risk memecoin analysis and estimations.
- **Secure Transactions:** Integrated with Gnosis Safe.
- **Protocol Integrations:** The assistant interacts with:
  - **Aave** for lending and yield generation.
  - **Ankr** and **EigenLayer** for staking and restaking.
  - **CowSwap** for stablecoin swaps with MEV protection.
  - **DexScreener, Lynex & Linea** for memecoin market data.

---

## Risk Profiles & Their Functionalities

### Low Risk – Stablecoin Yield Optimization (Sepolia Testnet)
**What it does:**  
- Allows you to supply stablecoins (DAI, USDT, USDC) to Aave to earn yield trough a Gnosis Smart Wallet.
- Lets you withdraw your stablecoins when needed.
- Offers stablecoin swaps via CowSwap for improved returns.

**Protocols & Network:**  
- **Aave, CowSwap, Gnosis Safe** on the **Sepolia Testnet**.

**Actions Used:**
- `SUPPLY_TO_AAVE`
- `WITHDRAW_FROM_AAVE`
- `TRADE_TO_COWSWAP`

---

### Medium Risk – ETH Staking & Restaking (Holesky Testnet)
**What it does:**  
- Helps you stake ETH on Ankr to receive ankrETH.
- Provides an option to restake ankrETH on EigenLayer to potentially boost your returns.

**Protocols & Network:**  
- **Ankr, EigenLayer, Gnosis Safe** on the **Holesky Testnet**.

**Actions Used:**
- `STAKE_TO_ANKR`
- `STAKE_TO_EIGEN`
- `INITIATE_EIGEN_WITHDRAWAL`
- `INITIATE_ANKR_WITHDRAWAL`
---

### High Risk – Memecoin Analysis & Estimation (Linea Mainnet)
**What it does:**  
- Evaluates memecoins (like FOXY, CROAK, and LINDA) using short-term momentum data from DexScreener.
- Provides an estimation of how many memecoins you could buy with a given amount of ETH on Lynex.
- Note: This feature is purely informational since memecoins are not available on testnets.

**Protocols & Network:**  
- **DexScreener, Lynex & Linea Mainnet**

**Actions Used:**
- `EVALUATE_BEST_MEMECOIN`
- `ESTIMATE_MEMECOIN_PURCHASE`

---

## Support

For questions or issues, please open an issue in the repository.
