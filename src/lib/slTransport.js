/**
 * SL Transport API helpers. Always called through the relative /api/sl path:
 * - dev: proxied by Vite (vite.config.js)
 * - prod: proxied by server.js
 * This avoids CORS, since SL's API does not send CORS headers for browser calls.
 */
const SL_BASE = '/api/sl';

export const METRO_MODES = new Set(['METRO']);

// Filter on d.direction (the line's terminal station name, e.g.
// "Kungsträdgården") rather than d.destination (where the train actually
// stops, e.g. "T-Centralen" during station closures).
export const TOWARDS_DIRECTION = 'Kungsträdgården';

function towardsDirection(d) {
  const dir = (d.direction ?? '').toString().toLowerCase();
  return dir.includes(TOWARDS_DIRECTION.toLowerCase());
}

const SITE_CACHE_KEY = 'sl_site_id_cache';
const SITE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week — site IDs rarely change

function readSiteCache(name) {
  try {
    const raw = localStorage.getItem(SITE_CACHE_KEY);
    if (!raw) return null;
    const { n, id, ts } = JSON.parse(raw);
    if (n !== name) return null;
    if (Date.now() - ts > SITE_CACHE_TTL_MS) return null;
    return id;
  } catch {
    return null;
  }
}

function writeSiteCache(name, id) {
  try {
    localStorage.setItem(SITE_CACHE_KEY, JSON.stringify({ n: name, id, ts: Date.now() }));
  } catch { /* ignore storage errors */ }
}

/**
 * Fetch all sites and return the site id for the given name.
 * Result is cached in localStorage for 1 week to avoid a large API call on every load.
 * Prefers exact name match (e.g. "Duvbo" over "Duvbo torg") so we get the tunnelbana station, not the bus stop.
 * @param {string} name - e.g. "Duvbo"
 * @returns {Promise<number|null>} site id or null
 */
export async function findSiteIdByName(name) {
  const cached = readSiteCache(name);
  if (cached != null) return cached;

  const res = await fetch(`${SL_BASE}/v1/sites?expand=true`);
  if (!res.ok) throw new Error(`SL sites: ${res.status}`);
  const sites = await res.json();
  const needle = name.trim().toLowerCase();
  const exact = sites.find(
    (s) => s.name && String(s.name).toLowerCase() === needle
  );
  const match = exact ?? sites.find(
    (s) => s.name && String(s.name).toLowerCase().includes(needle)
  );
  const id = match ? match.id : null;
  if (id != null) writeSiteCache(name, id);
  return id;
}

/**
 * Fetch departures for a site and return only metro (tunnelbana) departures.
 * forecast=60 gives us departures up to 60 minutes ahead so the list
 * never runs dry between polls.
 * @param {number} siteId
 * @returns {Promise<{ departures: Array, stop_deviations?: Array }>}
 */
export async function getDepartures(siteId) {
  const res = await fetch(`${SL_BASE}/v1/sites/${siteId}/departures?forecast=60`);
  if (!res.ok) throw new Error(`SL departures: ${res.status}`);
  const data = await res.json();
  const departures = (data.departures || [])
    .filter((d) => METRO_MODES.has(d.line?.transport_mode))
    .filter(towardsDirection);
  return { departures, stop_deviations: data.stop_deviations };
}
