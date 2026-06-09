/**
 * Production server for metro-dash, intended to run on a Raspberry Pi and be
 * reachable from other devices on the LAN (the e-ink display points its browser
 * at http://<pi-ip>:3000).
 *
 * Zero dependencies (Node built-ins only). It does two things:
 *   1. Serves the static build in ./dist
 *   2. Reverse-proxies /api/sl/*      -> https://transport.integration.sl.se
 *      and          /api/weather/* -> https://api.open-meteo.com
 *      so the browser only ever makes same-origin HTTP calls. This avoids CORS
 *      and, importantly, lets the (modern-TLS) Pi do the HTTPS handshake — old
 *      WebViews with stale root certs can't reach these APIs directly.
 *
 * Binds to 0.0.0.0 so it is accessible over the network, not just localhost.
 */
import http from 'node:http';
import https from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const SL_HOST = 'transport.integration.sl.se';
const WEATHER_HOST = 'api.open-meteo.com';
// Set CALENDAR_ICAL_URL as an environment variable on the Pi — never hard-code it here.
const CALENDAR_ICAL_URL = process.env.CALENDAR_ICAL_URL || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

/** Proxy the Google Calendar ICS feed — the full URL comes from CALENDAR_ICAL_URL env var. */
function proxyCalendar(req, res) {
  if (!CALENDAR_ICAL_URL) {
    res.writeHead(503, { 'Content-Type': 'text/plain' });
    return res.end('CALENDAR_ICAL_URL env var not set on the server');
  }
  let parsed;
  try { parsed = new URL(CALENDAR_ICAL_URL); } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    return res.end('CALENDAR_ICAL_URL is not a valid URL');
  }
  const upstream = https.request(
    { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers: { host: parsed.hostname } },
    (up) => {
      res.writeHead(up.statusCode || 502, { 'Content-Type': 'text/calendar; charset=utf-8' });
      up.pipe(res);
    }
  );
  upstream.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`calendar proxy error: ${e.message}`);
  });
  req.pipe(upstream);
}

/** Reverse-proxy an /api/* path to an upstream HTTPS host. */
function proxy(req, res, host, prefix) {
  const path = req.url.replace(prefix, '') || '/';
  const upstream = https.request(
    { hostname: host, path, method: req.method, headers: { host, accept: 'application/json' } },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    }
  );
  upstream.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`proxy error (${host}): ${e.message}`);
  });
  req.pipe(upstream);
}

/** Serve a file from ./dist, falling back to index.html (SPA). */
async function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = normalize(join(DIST, urlPath === '/' ? '/index.html' : urlPath));

  // Prevent path traversal outside DIST.
  if (filePath !== DIST && !filePath.startsWith(DIST + sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, 'index.html');
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    return res.end(data);
  } catch {
    try {
      const data = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME['.html'] });
      return res.end(data);
    } catch {
      res.writeHead(404);
      return res.end('Not found');
    }
  }
}

http
  .createServer((req, res) => {
    const url = req.url || '';
    if (url.startsWith('/api/sl')) return proxy(req, res, SL_HOST, /^\/api\/sl/);
    if (url.startsWith('/api/weather')) return proxy(req, res, WEATHER_HOST, /^\/api\/weather/);
    if (url.startsWith('/api/calendar')) return proxyCalendar(req, res);
    serveStatic(req, res);
  })
  .listen(PORT, HOST, () => {
    console.log(`metro-dash listening on http://${HOST}:${PORT} (reachable on the LAN)`);
  });
