# zerotek

## Overview

zerotek is a paper/perpetual-style trading simulator that runs entirely within the platform. It provides a risk-free environment for users to test trading strategies with real market data, automation rules, and performance analytics. The application is test-only with no mainnet execution, real trades, or external wallet connections.

Key features:
- Paper trading simulator with simulated positions and balances
- Real-time market data from CoinGecko and Binance APIs
- TradingView lightweight charts for visualization
- Automation agent system for rule-based trading
- Performance tracking with PnL snapshots and equity curves
- Faucet system for test balance allocation

## User Preferences

Preferred communication style: Simple, everyday language.

UI conventions:
- All UI text must be lowercase
- No emojis in the interface
- No hype words or "AI" terminology (use "automation", "signals", "rules" instead)
- Theme: green + white mix, clean, premium, minimal

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Charts**: TradingView lightweight-charts for candlestick visualization, Recharts for equity curves

The frontend is organized as:
- `/client/src/pages/` - Page components (landing, dashboard, markets, trade, agent, history, settings)
- `/client/src/components/` - Reusable components including shadcn/ui primitives
- `/client/src/hooks/` - Custom hooks for auth, toast, mobile detection
- `/client/src/lib/` - Utilities including query client configuration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Build**: esbuild for server bundling, Vite for client

The backend is organized as:
- `/server/index.ts` - Express server setup with middleware
- `/server/routes.ts` - API route definitions
- `/server/storage.ts` - Database abstraction layer (IStorage interface)
- `/server/services/` - Business logic (priceService for market data)
- `/server/replit_integrations/auth/` - Authentication module

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `/shared/schema.ts` with Zod validation via drizzle-zod
- **Migrations**: Drizzle Kit for schema management (`db:push` command)

Core database tables:
- `users` and `sessions` - Authentication (required for Replit Auth)
- `tokens` - Cached market data from external APIs
- `balances` - User test balances with faucet tracking
- `positions` - Open and closed trading positions
- `trades` - Trade history with PnL
- `agent_configs` - Automation rule configurations
- `pnl_snapshots` - Historical performance tracking
- `agent_events` - Activity feed for agent and trading events

### Authentication
- Privy Auth integration for Solana wallet login (solana-only mode)
- Server-side token verification via `@privy-io/node` SDK
- User data stored in PostgreSQL with `auth_provider` and `provider_user_id` columns
- Protected routes use `isPrivyAuthenticated` middleware in `/server/middleware/privyAuth.ts`
- Frontend sends `Authorization: Bearer <token>` header with all API requests
- Token refresh happens automatically every 5 minutes and on auth state changes

**Wallet Priority Configuration (Privy Dashboard)**:
- Wallet order is configured in the Privy Dashboard, NOT in code
- To set wallet order (Phantom > Backpack > Solflare): Go to Privy Dashboard > App Settings > Wallets > Reorder wallets
- Code config `walletChainType: "solana-only"` must be in `appearance` object of PrivyProvider
- IMPORTANT: Ethereum must be disabled in Privy Dashboard for Solana-only mode to work

### Market Data Pipeline
- Token listings: CoinGecko API (top coins by market cap, 60s cache)
- Real-time prices: Binance US API (`api.binance.us`) for PnL calculations (10s cache)
- Candlestick data: Binance US for supported pairs, CoinGecko OHLC as fallback
- Fallback chain: Binance US → CoinGecko → Database cache
- Server-side caching: 10 seconds for live prices, 30 seconds for candles
- Rate limit handling with exponential backoff

**Important**: Regular Binance API (`api.binance.com`) is geo-blocked from this server location. CoinGecko free tier has aggressive rate limits. The app uses Binance US API which works reliably.

### Live News Pipeline
- RSS feeds from major crypto news sources (no API keys required)
- Sources: CoinDesk, Decrypt, CoinTelegraph, Bitcoin Magazine, The Defiant
- Sentiment analysis based on headline keywords
- Currency extraction from headlines (BTC, ETH, SOL, etc.)
- Server-side caching: 60 seconds
- Fallback to static sample news if all feeds fail

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe database operations
- connect-pg-simple for session storage

### Authentication
- Privy Auth (email/social login)
- Required env vars: `VITE_PRIVY_APP_ID`, `PRIVY_APP_SECRET`

### Market Data APIs
- CoinGecko API (free tier) - Token listings, prices, volume, market cap
- Binance public API - Candlestick/OHLC data for trading pairs

### Frontend Libraries
- TradingView lightweight-charts - Candlestick chart rendering
- Recharts - Line charts for equity curves
- Radix UI - Accessible component primitives
- Tailwind CSS - Utility-first styling

### Agent Automation Runner
- Located in `/server/services/agentRunner.ts`
- Starts automatically with the server
- Runs every 30 seconds for signal scanning, 5 seconds for TP/SL checks, 2-minute trade cycles
- Respects config settings: maxOpenPositions, maxMarginPerTrade, maxLeverage, allowedPairs
- Uses storage APIs for consistent data handling (createPosition, createTrade, updateBalance)
- Improved momentum-based signal generation with trend detection and strategy support (trend/mean_reversion/breakout)
- Requires minimum 5 price points history before generating momentum signals
- Price fetch resilience: Batch API → Individual API → Database cache fallback
- Supports 50+ tokens with Binance US symbol mapping (BTC, ETH, SOL, TRX, BNB, UNI, DeFi tokens, etc.)

### Build & Development
- Vite with React plugin
- esbuild for server bundling
- TypeScript for type safety
- Replit-specific Vite plugins for development (cartographer, dev-banner, error overlay)

## Recent Changes (January 2026)
- Implemented backend agent automation runner with storage API integration
- Added SPA-friendly login prompt (no full-page redirects)
- Added daily PnL snapshot creation with proper response inclusion
- Fixed global CSS transitions to only apply to interactive elements
- Added fallback for empty chart candles data
- Ensured all text is lowercase per user preferences
- Premium UI overhaul with glassmorphism design system (.glass-card, .glass-nav, .glass-badge classes)
- Added scroll-reactive navbar (transparent to blurred on scroll)
- Added "how it works" section on landing page with 5-step flow
- Multi-column professional footer with product, resources, and legal links
- Created legal pages (terms, privacy, cookies, docs)
- Added agent_events table for activity tracking
- Dashboard activity feed showing position opens/closes, faucet claims, agent status changes
- Trade page improvements with chart loading states and glassmorphism cards
- Created shared Brand component (`/client/src/components/brand.tsx`) with logo image, used across landing navbar, app sidebar, and login prompt
- Added user-provided logo image (`attached_assets/images/zerotek-logo.jpg`) - geometric "ZERO" design with parallel lines
- Full Privy authentication integration - login modal with email/Google support
- Updated `use-auth.ts` hook to use Privy's usePrivy hook for authentication state
- All login buttons (navbar, hero, CTA) now trigger Privy login modal
- Centralized providers (QueryClient, Tooltip, Theme, Privy) in providers.tsx wrapper
- Server-side Privy token verification fully implemented with @privy-io/node SDK
- Created Privy authentication middleware with user upsert logic
- Updated users table schema with auth_provider and provider_user_id columns
- All protected API routes now use isPrivyAuthenticated middleware
- Frontend API requests include Authorization: Bearer token header via authStore
- Token refresh every 5 minutes and on auth state changes
- Enhanced grain/noise overlay visibility with theme-aware opacity (0.08 light, 0.15 dark)
- Theme management via localStorage + direct classList.toggle (no ThemeProvider component needed)