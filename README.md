# Will it fit me?

A mobile app that answers one question before an online purchase: **will this item fit me — size, cut and color?**

You set up a body profile once (measurements + a selfie for your color type). Then paste a link from any shop, or a screenshot. The app reads the brand's size chart, fabric and model photos and gives a verdict: **Buy it / Conditional / Risky / Won't fit**, with the recommended size and the reasons. You can also build full looks on an avatar, save them in folders, and keep a wardrobe and wishlist.

The screens follow the clickable prototype from the design phase.

## Structure

```
app/      React Native + Expo (TypeScript, Expo Router) — the mobile app
server/   Node + Express API — talks to Claude, reads product pages, computes sizes
```

### How a check works

1. **Extract** (light model, `claude-haiku-5-5`): the server fetches the product page safely and pulls out facts — size chart, fabric, stretch, model height and size, color, returns. Nothing is invented; missing data stays empty.
2. **Compute** (plain code, `server/src/sizing.ts`): the size is matched against the brand's chart, and the hem length is recalculated from the model's height to yours. The numbers are never left to the model.
3. **Judge** (main model, `claude-sonnet-5-5`): a verdict on four axes (size, cut, color, fabric), with confidence and what's missing.

The color type comes from one selfie (`POST /api/colortype`). It returns the season, the detected skin/hair/eye colors, the palette, and a full color guide.

## Run it

### 1. API server

```bash
cd server
cp .env.example .env        # add your ANTHROPIC_API_KEY
npm install
npm run dev                 # http://localhost:8787  (check: /health)
npm test                    # sizing + safety unit tests
```

### 2. App

```bash
cd app
npm install
# A phone can't reach "localhost" on your computer — use your computer's local IP:
EXPO_PUBLIC_API_URL=http://192.168.1.20:8787 npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) on the same Wi-Fi network.

## Privacy rules (built in)

- **Selfie:** sent once for analysis, never stored on the server or the phone, never logged.
- **Screenshots:** kept in memory only while a check runs.
- **Measurements:** stored only on the phone (AsyncStorage). Requests send only the measurements needed — no name, no email.
- **Export / delete:** Profile → "Export my data" / "Delete my profile and all data".
- **Avatar:** always clothed — the chosen outfit or a neutral base layer, never a nude body.
- **Product fetching:** only public `http(s)` pages. Internal and private addresses are blocked, with size and time limits and a redirect cap.

## What's real and what's next

| Feature | Status |
|---|---|
| Profile, measurements wizard, measuring guide | ✅ |
| Color type from selfie + color guide | ✅ Claude vision |
| Item check by link or screenshot, verdict, size math | ✅ |
| Wishlist, recent checks, fit feedback, fit history per brand | ✅ |
| Outfit builder from wardrobe/wishlist/checks, AI look check | ✅ |
| Looks in folders (create, move, delete) | ✅ |
| Illustrated avatar using your selfie colors | ✅ |
| Photo-realistic try-on render | ⏳ `POST /api/avatar` returns 501 until an image-generation provider is added |
| "Share" from a shop app straight into this app | ⏳ needs a development build + share-intent plugin |
| Price-drop alerts | ⏳ setting exists; needs a scheduled job + push notifications |
| Shop search for missing outfit pieces | ⏳ |
| User accounts / sync between devices | ⏳ data is local to the phone for now |

## Deploying the API

Any Node 20+ host works (Render, Fly.io, Railway, a VPS):
`npm ci && npm run build && npm start`, with `ANTHROPIC_API_KEY` set. Put it behind HTTPS and point `EXPO_PUBLIC_API_URL` at it.

## web/
The working app that runs inside Claude (`web/will-it-fit-me.html`). See `web/README.md` — including the rule that shop photos are always fitted to the body.
