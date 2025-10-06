# BaseBlaster (testnet)

Synthwave endless shooter on web (three.js) with Base Sepolia wallet actions.

## Quick start

```bash
npm i
npm run prepare # installs husky hook
npm run dev
```

Open http://localhost:5173

## Env
Create `.env` (never commit):

```
VITE_WC_PROJECT_ID=your_walletconnect_project_id
VITE_PASS_ADDR=0x0000000000000000000000000000000000000000
VITE_SCORE_ADDR=0x0000000000000000000000000000000000000000
pk=0xYOUR_PRIVATE_KEY
BASESCAN_API_KEY=your_basescan_key
```

## Deploy contracts (Base Sepolia)

```bash
npx hardhat run scripts/deploy.js --network basesepolia
# copy PASS and SCORE addresses into .env as VITE_PASS_ADDR / VITE_SCORE_ADDR
# optional verify
PASS_ADDR=0x... SCORE_ADDR=0x... npx hardhat run scripts/verify.js --network basesepolia
```

## Web deploy

```bash
npm run build
vercel --prod
```

## Gameplay
- Arrow keys / A,D to move, Space to shoot
- Connect wallet → Mint Pass → play → Submit Score


