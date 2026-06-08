# Tunnelbana – Next subway from Duvbo + weather

A small hallway display for “when is the next subway leaving” from **Duvbo**, with live weather. Runs entirely in the browser; no backend.

## Display target: e-ink 758×1024

The UI is designed for a **portrait e-ink panel at 758×1024**: pure black-on-white,
high contrast, no gradients/shadows/transparency, and all animations and transitions
disabled (e-ink refresh is slow and partial updates ghost). The weather color theme is
not used — the page is always plain white. The layout is fixed to 758×1024 px.

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

Then open **http://\<host-ip\>:3000** on any device on the same network.

`npm run serve` runs [`server.js`](server.js): a zero-dependency Node server that
serves the `dist/` build **and** reverse-proxies `/api/sl/*` to SL. The SL API does
not send CORS headers, so the proxy is what makes departures work in production —
the browser only ever talks to this server, never to SL directly. The server binds
to `0.0.0.0`, so it is reachable from other devices on the LAN. Override the port
with `PORT=8080 npm run serve` if needed.

## Hosting on a Raspberry Pi (LAN, no display attached)

The Pi only needs to serve the site; a separate device on the network opens it in a browser.

```bash
# On the Pi (needs Node 20+ and git)
sudo apt update && sudo apt install -y git nodejs npm
git clone https://github.com/jespervestin/metro-dash.git
cd metro-dash
npm install
npm run build
npm run serve            # test: open http://<pi-ip>:3000 from another device
```

Find the Pi's IP with `hostname -I`. For a stable address, set a **DHCP reservation**
in your router (or a static IP) so the URL doesn't change after reboots.

Run it automatically on boot with **systemd** — create `/etc/systemd/system/metro-dash.service`:

```ini
[Unit]
Description=metro-dash
After=network-online.target
Wants=network-online.target

[Service]
WorkingDirectory=/home/pi/metro-dash
ExecStart=/usr/bin/node server.js
Environment=PORT=3000
Restart=always
User=pi

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now metro-dash
sudo systemctl status metro-dash      # check it's running
```

To update later: `git pull && npm install && npm run build && sudo systemctl restart metro-dash`.

## APIs

- **SL Transport** – [Trafiklab](https://www.trafiklab.se/sv/api/our-apis/sl/transport/) (no API key). Used for sites and departures from Duvbo (metro only).
- **Open-Meteo** – [open-meteo.com](https://open-meteo.com/) (no API key) for current weather.
