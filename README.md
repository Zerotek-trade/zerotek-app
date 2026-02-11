# ZeroTek

> Premium Solana Perpetual Trading Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
[![Solana](https://img.shields.io/badge/Solana-Compatible-9945ff.svg)](https://solana.com/)

## 🚀 Overview

ZeroTek is a premium perpetual trading simulator designed for the Solana ecosystem. Practice trading strategies with real market data, automation tools, and performance analytics - all without risking real funds.

### ✨ Key Features

- **📊 Paper Trading** - Simulated positions with real-time market prices
- **⚡ 25x Leverage** - Practice leveraged trading safely
- **🤖 Automation Agent** - Rule-based trading with configurable parameters
- **📈 Live Market Data** - Real-time prices from CoinGecko and Binance
- **📉 Performance Analytics** - Track P&L, equity curves, and win rates
- **📰 Live News Feed** - RSS-powered crypto news with sentiment analysis
- **🎯 50+ Assets** - Trade BTC, ETH, SOL, and more

## 🛠️ Tech Stack

### Frontend
- **React 18.3+** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **shadcn/ui** component library
- **TanStack Query** for data fetching
- **Privy** for Web3 authentication
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database management
- **PostgreSQL** database
- **Node.js** runtime

### Blockchain Integration
- **Solana Web3.js** for blockchain interactions
- **Phantom, Backpack, Solflare** wallet support

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zerotek-trade/ZeroTek.git
   cd ZeroTek
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   PRIVY_APP_ID=your_privy_app_id
   PRIVY_APP_SECRET=your_privy_app_secret
   NODE_ENV=development
   ```

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## 🎯 Usage

### Getting Started

1. **Connect Wallet** - Use Phantom, Backpack, or any Solana-compatible wallet
2. **Claim Test Funds** - Get 10,000 USDT test balance from the faucet
3. **Start Trading** - Open positions on 50+ crypto assets
4. **Enable Automation** - Set up the trading agent with custom rules
5. **Track Performance** - Monitor your equity curve and P&L

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run check      # Type checking
npm run db:push    # Push database schema changes
```

## 📖 Documentation

For detailed documentation, see [ZEROTEK_DOCUMENTATION.md](docs/ZEROTEK_DOCUMENTATION.md)

Topics covered:
- Platform features
- Trading guide
- Automation agent setup
- API reference
- Faucet system
- Analytics & performance tracking

## 🏗️ Project Structure

```
zerotek-source/
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── routes.ts        # API routes
│   ├── db.ts            # Database configuration
│   ├── services/        # Business logic
│   └── middleware/      # Express middleware
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema
└── docs/                # Documentation
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: [zerotek.trade](https://zerotek.trade)
- **Documentation**: [Full Docs](docs/ZEROTEK_DOCUMENTATION.md)
- **GitHub**: [Zerotek-trade/ZeroTek](https://github.com/Zerotek-trade/ZeroTek)

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Privy](https://privy.io/)
- Market data from [CoinGecko](https://www.coingecko.com/)
- Powered by [Solana](https://solana.com/)

---
**⚠️ Disclaimer**: ZeroTek is a trading simulator for educational purposes only. No real funds are involved. Always do your own research before trading with real money.
