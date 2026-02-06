# Tunnelbana – Next subway from Duvbo + weather

A small hallway display for “when is the next subway leaving” from **Duvbo**, with live weather. Runs entirely in the browser; no backend.

## Run locally (development)

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

### Access from other devices on your network

The dev server listens on all interfaces. On another device (e.g. phone or tablet), open:

**http://\<your-mac-ip\>:5173**

To find your Mac’s IP:

- **Terminal:** `ipconfig getifaddr en0` (Wi‑Fi) or `ipconfig getifaddr en1` (Ethernet)
- **System Settings → Network** → select your connection → check IP address

## Production build + serve on the network

```bash
npm run build
npm run serve
```

Then open **http://\<your-mac-ip\>:3000** on any device on the same network.

(`npm run serve` uses `serve` to serve the `dist` folder on port 3000, bound to all interfaces.)

## If SL Transport API is blocked by CORS in production

The app calls SL’s API directly from the browser. If you see CORS errors when using the built app (e.g. after `npm run serve`), use the dev server instead (`npm run dev`), which proxies SL requests and avoids CORS. For a permanent production setup with a proxy, you can run a small proxy server that forwards `/api/sl/*` to `https://transport.integration.sl.se` and serves the `dist` folder.

## APIs

- **SL Transport** – [Trafiklab](https://www.trafiklab.se/sv/api/our-apis/sl/transport/) (no API key). Used for sites and departures from Duvbo (metro only).
- **Open-Meteo** – [open-meteo.com](https://open-meteo.com/) (no API key) for current weather.
