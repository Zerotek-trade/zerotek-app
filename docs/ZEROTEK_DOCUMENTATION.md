# ZEROTEK Documentation

> premium solana perpetual trading simulator

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Platform Features](#platform-features)
4. [Trading Guide](#trading-guide)
5. [Automation Agent](#automation-agent)
6. [API Reference](#api-reference)
7. [Faucet System](#faucet-system)
8. [Analytics & Performance](#analytics--performance)
9. [Changelog](#changelog)
10. [Future Roadmap](#future-roadmap)
11. [FAQ](#faq)

---

## Introduction

### what is zerotek?

zerotek is a premium perpetual trading simulator designed for the solana ecosystem. it provides a risk-free environment to practice trading strategies with real market data, automation tools, and performance analytics - all without risking real funds.

### key features

| feature | description |
|---------|-------------|
| paper trading | simulated positions with real-time market prices |
| 25x leverage | practice leveraged trading safely |
| automation agent | rule-based trading with configurable parameters |
| live market data | real-time prices from coingecko and binance |
| performance analytics | track pnl, equity curves, and win rates |
| live news feed | rss-powered crypto news with sentiment analysis |

### supported assets

- bitcoin (btc)
- ethereum (eth)
- solana (sol)
- and 50+ top cryptocurrencies

---

## Getting Started

### creating an account

1. visit zerotek platform
2. click "get started" or "login"
3. connect with your preferred method

### authentication options

| priority | method | description |
|----------|--------|-------------|
| 1 | phantom wallet | recommended for solana users |
| 2 | backpack wallet | solana wallet with xnft support |
| 3 | solflare wallet | popular solana wallet |
| 4 | other wallets | any solana-compatible wallet |
| 5 | email/google | traditional login option |

### claiming test funds

1. navigate to dashboard or settings
2. locate the "claim faucet" button
3. receive 10,000 usdt test balance
4. faucet resets every 24 hours

---

## Platform Features

### dashboard

the central hub for your trading activity:

- **balance overview**: total balance, available margin, locked margin
- **positions summary**: open positions with live pnl
- **recent activity**: trade history, agent events, faucet claims
- **equity curve**: visual representation of portfolio performance

### markets page

browse and analyze all available assets:

- live ticker prices for all supported assets
- 24h price changes and volume
- market cap information
- quick access to trade any asset

### trade page

professional trading interface:

- **tradingview chart**: professional candlestick charts with indicators
- **order panel**: long/short positions with customizable leverage
- **position management**: take profit, stop loss, close positions
- **live ticker**: scrolling price updates

### history page

complete trade records:

- complete trade history
- realized pnl for each trade
- filter by date, asset, or trade type

### news page

stay informed with live market news:

- live rss news from major crypto outlets
- sentiment indicators (bullish/bearish/neutral)
- currency tags for relevant coins
- sources: coindesk, cointelegraph, decrypt, bitcoin magazine

---

## Trading Guide

### opening a position

#### step-by-step manual trading

1. select asset from markets or trade page
2. choose side: **long** (buy) or **short** (sell)
3. set **leverage** (1x to 25x)
4. enter **margin amount** (usdt)
5. optional: set take profit and stop loss percentages
6. click "open position"

#### position size calculation

```
position size = (margin × leverage) / entry price
```

**example:**
- margin: 100 usdt
- leverage: 10x
- btc price: $95,000

```
position size = (100 × 10) / 95,000 = 0.0105 btc
```

#### pnl calculation

**long position:**
```
pnl = (current price - entry price) × quantity
```

**short position:**
```
pnl = (entry price - current price) × quantity
```

**example (long):**
- entry price: $95,000
- current price: $96,000
- quantity: 0.01 btc

```
pnl = (96,000 - 95,000) × 0.01 = +$10
```

### closing a position

1. click "close" on any open position
2. position closes at current market price
3. margin + pnl returned to balance
4. 0.1% trading fee deducted

### take profit & stop loss

| feature | description | example |
|---------|-------------|---------|
| take profit | auto-close when target profit reached | 5% = close at +5% gain |
| stop loss | auto-close to limit losses | 3% = close at -3% loss |

---

## Automation Agent

### what is the automation agent?

the automation agent is an automated trading system that opens and manages positions based on configurable rules. it runs 24/7 and executes trades without manual intervention.

### agent configuration

#### basic settings

| setting | description | default |
|---------|-------------|---------|
| status | on/off toggle | off |
| allowed pairs | which assets to trade | btc, eth, sol |
| max open positions | limit simultaneous positions | 3 |
| trade frequency | minutes between trades | 5 |

#### margin settings

| setting | description | default |
|---------|-------------|---------|
| max margin per trade | maximum usdt per position | 300 |
| use random margin | randomize margin within limits | true |
| min margin | minimum margin when random | 50 |

#### risk settings

| setting | description | default |
|---------|-------------|---------|
| leverage | position leverage | 10x |
| take profit % | auto take profit level | 5% |
| stop loss % | auto stop loss level | 3% |

### how the agent works

#### signal generation cycle

```
every 30 seconds:
├── scan market conditions
├── analyze price momentum
├── check volume changes
└── generate signal (buy/sell/neutral)
```

#### position opening logic

```
when signal generated:
├── check if under max positions limit
├── verify sufficient balance
├── select asset from allowed pairs
├── calculate margin (fixed or random)
├── open long or short based on signal
└── set take profit and stop loss
```

#### position management cycle

```
every 5 seconds:
├── fetch current prices
├── calculate live pnl
├── check take profit conditions
├── check stop loss conditions
└── auto-close when targets hit
```

### agent event types

| event | description |
|-------|-------------|
| `agent_started` | agent activated |
| `agent_stopped` | agent deactivated |
| `position_opened` | new position created |
| `position_closed` | position closed with pnl |
| `take_profit_hit` | tp level triggered |
| `stop_loss_hit` | sl level triggered |

---

## API Reference

### authentication

all protected endpoints require bearer token authentication:

```
authorization: bearer <privy_token>
```

tokens are automatically managed by the privy sdk.

---

### user endpoints

#### GET /api/user

get current authenticated user information.

**response:**
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "privyUserId": "did:privy:xxx"
}
```

---

#### GET /api/balance

get user's current balance.

**response:**
```json
{
  "id": 1,
  "userId": "user_123",
  "amount": "10000.00",
  "lastFaucetClaim": "2026-01-29T12:00:00Z"
}
```

---

#### POST /api/faucet

claim faucet funds (24h cooldown).

**response (success):**
```json
{
  "success": true,
  "newBalance": "10000.00"
}
```

**response (cooldown active):**
```json
{
  "message": "faucet available in 12h 30m"
}
```

---

### trading endpoints

#### GET /api/positions

get user positions.

**query parameters:**

| param | type | description |
|-------|------|-------------|
| status | string | "open", "closed", or "all" |
| agentOnly | boolean | filter agent-only positions |

**response:**
```json
[
  {
    "id": 1,
    "tokenId": "bitcoin",
    "side": "long",
    "entryPrice": "95000.00",
    "quantity": "0.01",
    "margin": "100.00",
    "leverage": 10,
    "takeProfit": "5",
    "stopLoss": "3",
    "status": "open",
    "isAgentTrade": false,
    "createdAt": "2026-01-29T12:00:00Z"
  }
]
```

---

#### POST /api/positions

open a new position.

**request body:**
```json
{
  "tokenId": "bitcoin",
  "side": "long",
  "leverage": 10,
  "margin": 100,
  "takeProfit": 5,
  "stopLoss": 3
}
```

**response:**
```json
{
  "id": 1,
  "tokenId": "bitcoin",
  "side": "long",
  "entryPrice": "95000.00",
  "quantity": "0.01052",
  "margin": "100.00",
  "leverage": 10,
  "status": "open"
}
```

---

#### POST /api/positions/:id/close

close a specific position.

**response:**
```json
{
  "success": true,
  "pnl": 25.50,
  "newBalance": "10125.50"
}
```

---

#### POST /api/positions/close-all

close all open positions.

**response:**
```json
{
  "success": true,
  "closedCount": 3,
  "totalPnl": 150.25
}
```

---

#### GET /api/trades

get trade history.

**response:**
```json
[
  {
    "id": 1,
    "tokenId": "bitcoin",
    "side": "sell",
    "type": "market",
    "price": "96000.00",
    "quantity": "0.01",
    "fee": "0.10",
    "realizedPnl": "50.00",
    "isAgentTrade": false,
    "createdAt": "2026-01-29T14:00:00Z"
  }
]
```

---

### market data endpoints

#### GET /api/tokens

get all supported tokens with current prices.

**response:**
```json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "bitcoin",
    "currentPrice": "95000.00",
    "change24h": "2.5",
    "volume24h": "50000000000",
    "marketCap": "1800000000000"
  }
]
```

---

#### GET /api/candles/:tokenId

get candlestick/ohlc data for charting.

**query parameters:**

| param | type | options |
|-------|------|---------|
| interval | string | 1m, 5m, 15m, 1h, 4h, 1d |

**response:**
```json
[
  {
    "time": 1706529600,
    "open": 94500,
    "high": 95200,
    "low": 94300,
    "close": 95000
  }
]
```

---

#### GET /api/news

get live crypto news feed.

**response:**
```json
[
  {
    "title": "bitcoin reaches new high",
    "link": "https://coindesk.com/...",
    "source": "coindesk",
    "sentiment": "bullish",
    "currencies": ["btc"],
    "pubDate": "2026-01-29T12:00:00Z"
  }
]
```

---

### agent endpoints

#### GET /api/agent/config

get current agent configuration.

**response:**
```json
{
  "id": 1,
  "userId": "user_123",
  "status": "stopped",
  "allowedPairs": ["bitcoin", "ethereum", "solana"],
  "maxOpenPositions": 3,
  "tradeFrequencyMinutes": 5,
  "leverage": 10,
  "takeProfit": "5",
  "stopLoss": "3",
  "maxMarginPerTrade": "300",
  "useRandomMargin": true
}
```

---

#### PUT /api/agent/config

update agent configuration.

**request body:**
```json
{
  "status": "running",
  "allowedPairs": ["bitcoin", "ethereum"],
  "maxOpenPositions": 5,
  "leverage": 15,
  "takeProfit": 8,
  "stopLoss": 4,
  "maxMarginPerTrade": 500,
  "useRandomMargin": true
}
```

---

#### GET /api/agent/positions

get agent-managed positions with live pnl.

**response:**
```json
{
  "positions": [
    {
      "id": 5,
      "tokenId": "bitcoin",
      "side": "long",
      "entryPrice": "94500.00",
      "currentPrice": "95000.00",
      "quantity": "0.02",
      "margin": "200.00",
      "leverage": 10,
      "pnl": 10.00,
      "pnlPercent": 5.0
    }
  ],
  "summary": {
    "totalPositions": 1,
    "totalMargin": 200.00,
    "totalPnl": 10.00
  }
}
```

---

#### POST /api/agent/close-all

close all agent-managed positions.

**response:**
```json
{
  "success": true,
  "closedCount": 3
}
```

---

#### GET /api/agent/events

get agent activity log.

**response:**
```json
[
  {
    "id": 1,
    "type": "position_opened",
    "symbol": "bitcoin",
    "message": "opened long position on BTC with $200 margin",
    "createdAt": "2026-01-29T12:00:00Z"
  }
]
```

---

### analytics endpoints

#### GET /api/dashboard

get complete dashboard data.

**response:**
```json
{
  "balance": {
    "amount": "10500.00",
    "lastFaucetClaim": "2026-01-29T00:00:00Z"
  },
  "positions": [...],
  "recentTrades": [...],
  "recentEvents": [...],
  "stats": {
    "totalPnl": 500.00,
    "winRate": 65,
    "totalTrades": 20
  }
}
```

---

#### GET /api/pnl-snapshots

get historical pnl data for equity curve.

**response:**
```json
[
  {
    "date": "2026-01-28",
    "balance": "10000.00",
    "pnl": "0.00"
  },
  {
    "date": "2026-01-29",
    "balance": "10500.00",
    "pnl": "500.00"
  }
]
```

---

#### POST /api/pnl-snapshots

create a new daily pnl snapshot.

**response:**
```json
{
  "success": true,
  "snapshot": {
    "date": "2026-01-29",
    "balance": "10500.00"
  }
}
```

---

## Faucet System

### overview

the faucet provides test funds for paper trading.

| property | value |
|----------|-------|
| amount | 10,000 usdt |
| cooldown | 24 hours |
| resets balance | yes |

### how to claim

1. check if 24 hours passed since last claim
2. if eligible, click "claim faucet" button
3. balance resets to 10,000 usdt
4. all open positions remain unchanged

### faucet status

the faucet button shows:
- **"claim faucet"** - available to claim
- **"available in Xh Xm"** - countdown until next claim

---

## Analytics & Performance

### portfolio metrics

| metric | description |
|--------|-------------|
| total balance | current usdt balance |
| total pnl | all-time realized profit/loss |
| win rate | percentage of profitable trades |
| total trades | number of completed trades |

### equity curve

visual representation of your portfolio over time:

- daily snapshots of portfolio value
- tracks balance changes
- identifies performance trends
- helps evaluate strategy effectiveness

### position analytics

for each open position:

| data point | description |
|------------|-------------|
| live pnl | unrealized profit/loss |
| pnl % | percentage gain/loss |
| entry vs current | price comparison |
| margin & leverage | position details |
| duration | time since opened |

---

## Changelog

### version 1.0.0 - january 2026

#### initial release features

**trading**
- paper trading simulator with real market data
- 25x leverage trading on 50+ assets
- long and short positions
- take profit and stop loss orders
- position aggregation for same-side trades

**automation**
- configurable automation agent
- customizable margin settings
- allowed pairs configuration
- adjustable leverage and risk parameters
- 24/7 automated trading

**market data**
- real-time prices from coingecko
- candlestick data from binance
- live news feed with sentiment analysis
- tradingview chart integration

**authentication**
- privy auth integration
- phantom, backpack, solflare wallet support
- email and google login options
- solana-only wallet mode

**analytics**
- dashboard with live pnl
- equity curve tracking
- trade history
- agent activity log

**design**
- glassmorphism premium ui
- green + white theme
- dark/light mode support
- mobile responsive layout

#### bug fixes (january 2026)

- fixed price fetching for accurate pnl calculations
- fixed $0 entry price issue on agent trades
- improved ticker display with proper token names
- enhanced auto-refresh for live data
- corrected fetchTokenPrice return format handling

---

## Future Roadmap

### priority 1: mainnet integration

**target: q2 2026**

the highest priority is transitioning to real trading on solana mainnet.

**planned implementation:**
- drift protocol integration
- real solana wallet transactions
- actual leveraged perpetual positions
- production security measures
- real fund management

### phase 2: enhanced features

**target: q2-q3 2026**

| feature | description |
|---------|-------------|
| advanced indicators | technical analysis tools |
| strategy builder | custom trading strategies |
| backtesting | test strategies on historical data |
| telegram alerts | trade notifications |
| discord bot | community integration |

### phase 3: social trading

**target: q3-q4 2026**

| feature | description |
|---------|-------------|
| leaderboard | top trader rankings |
| copy trading | follow successful traders |
| public profiles | trader statistics |
| competitions | trading contests |

### phase 4: platform expansion

**target: 2027+**

| feature | description |
|---------|-------------|
| multi-chain | ethereum, arbitrum support |
| options trading | derivatives products |
| api access | developer tools |
| mobile app | ios and android |
| institutional | enterprise features |

### improvement priorities

1. **mainnet transition** - highest priority
2. performance optimization
3. additional trading pairs
4. enhanced analytics
5. mobile app development
6. api documentation expansion

---

## FAQ

### general questions

**q: is zerotek using real money?**

a: no. zerotek is a paper trading simulator. all funds are simulated test usdt for practice purposes only.

---

**q: what wallets are supported?**

a: phantom (recommended), backpack, solflare, and any solana-compatible wallet. email/google login is also available.

---

**q: how often does price data update?**

a: prices update every few seconds from coingecko and binance apis. the dashboard refreshes every 5 seconds.

---

**q: is my data secure?**

a: yes. we use privy authentication which provides secure wallet connection and session management.

---

### trading questions

**q: what is the maximum leverage?**

a: 25x leverage is available on all trading pairs.

---

**q: are there trading fees?**

a: yes, a simulated 0.1% fee is charged per trade to mimic real trading conditions.

---

**q: can i set take profit and stop loss?**

a: yes. both tp and sl can be set as percentages when opening a position or through the agent settings.

---

**q: can i have multiple positions on the same asset?**

a: positions on the same asset and same side (both long or both short) are aggregated into one position. opposite side positions remain separate.

---

### agent questions

**q: does the agent run 24/7?**

a: yes. when enabled, the agent runs continuously, scanning for signals every 30 seconds and checking positions every 5 seconds.

---

**q: can i control which coins the agent trades?**

a: yes. you can configure the "allowed pairs" in agent settings to specify which assets the agent can trade.

---

**q: how does the agent decide to buy or sell?**

a: the agent uses simulated signals based on market conditions including price momentum and volume changes.

---

**q: what happens if the agent loses money?**

a: since this is paper trading, no real funds are at risk. you can always claim the faucet to reset your balance.

---

### account questions

**q: how do i get test funds?**

a: use the faucet button on the dashboard or settings page to claim 10,000 usdt. you can claim every 24 hours.

---

**q: can i reset my account?**

a: claiming the faucet will reset your balance to 10,000 usdt. your trade history and positions will remain.

---

**q: when will mainnet trading be available?**

a: mainnet integration with drift protocol is our top priority, targeted for q2 2026.

---

## Support

for questions, issues, or feedback:

| channel | contact |
|---------|---------|
| email | support@zerotek.io |
| twitter | @zerotek_io |
| discord | discord.gg/zerotek |

---

## Legal

- [terms of service](/terms)
- [privacy policy](/privacy)
- [cookie policy](/cookies)

---

*documentation version 1.0.0*
*last updated: january 2026*

---

copyright 2026 zerotek. all rights reserved.
