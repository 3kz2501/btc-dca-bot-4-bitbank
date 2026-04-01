# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

BTC DCA (Dollar-Cost Averaging) bot deployed as a Cloudflare Worker. Uses Cron Triggers to periodically buy BTC on Bitbank exchange via their REST API. Zero runtime npm dependencies — all crypto operations use Web Crypto API, HTTP via native fetch.

## Commands

```bash
npm run dev        # Local dev server (wrangler dev)
npm run deploy     # Deploy to Cloudflare Workers
npm test           # Run tests (vitest with Cloudflare Workers pool)
npm run cf-typegen # Generate Cloudflare types (worker-configuration.d.ts)
```

Secrets are managed via wrangler, not committed:
```bash
wrangler secret put BITBANK_API_KEY
wrangler secret put BITBANK_API_SECRET
```

## Architecture

Single-file Worker (`src/index.ts`) exporting a `scheduled` handler triggered by Cron (`wrangler.toml` → `[triggers] crons`).

**Execution flow:**
1. Fetch BTC/JPY pair info (validates purchase amount against min/max)
2. Get current BTC price
3. Check JPY balance
4. Place market buy order

**API authentication:** HMAC-SHA256 signature via Web Crypto API (`createSignature`). Private endpoints require `ACCESS-KEY`, `ACCESS-NONCE`, `ACCESS-SIGNATURE` headers. Public endpoints (ticker, pairs) need no auth.

**Types** (`src/types.ts`): Response types for Bitbank API (order, ticker, assets, pairs). Based on https://github.com/bitbankinc/bitbank-api-docs

## Configuration

- `wrangler.toml` → `PURCHASE_AMOUNT_BTC`: BTC amount per purchase (env var, not a secret)
- `wrangler.toml` → `crons`: Execution schedule (default: `0 1 * * *` = 10:00 JST daily)
- `compatibility_date`: Cloudflare Workers runtime version

## Stopping the Bot

- **Disable Worker**: Cloudflare Dashboard → Workers → `bitcoin-dca-bot` → Settings → Disable
- **Remove Cron**: Delete the `[triggers]` section and redeploy
- **Delete entirely**: `wrangler delete`

## Code Style

- Tabs for indentation, LF line endings (`.editorconfig`)
- Prettier: `printWidth: 140`, `singleQuote: true`, `useTabs: true`
- TypeScript strict mode, target es2021
