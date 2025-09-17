# Anectos

Anectos is a decentralized platform designed to facilitate quadratic funding for community-driven projects. It enables fair and impactful distribution of funds by amplifying contributions from a broad base of supporters. Built on the Solana blockchain, Anectos ensures fast, secure, and low-cost transactions.

## Features

- Quadratic funding mechanism to prioritize community support.
- Matching pool for fair distribution of funds.
- Solana blockchain integration for scalability and efficiency.
- User-friendly interface for project creators and contributors.

## How to Run

### Prerequisites

- Ensure you have the following installed:
  - Node.js
  - pnpm (Package Manager)
  - Solana CLI

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/Seann2003/anectos.git
   cd anectos
   cd app
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. To build the programs run

```bash
anchor build
```

5. Configure surpool to run the programs in the client side locally

# macOS (Homebrew)

```bash
brew install txtx/taps/surfpool
surfpool start
```

6. Deploy contracts or run scripts as needed (refer to the `scripts/` directory for examples).
