/**
 * SL Transport API helpers. Uses Vite proxy in dev to avoid CORS; direct URL in production.
 */
const SL_BASE = import.meta.env.DEV
  ? '/api/sl'
  : 'https://transport.integration.sl.se';

export const METRO_MODES = new Set(['METRO']);

/** Only show departures towards this destination (Duvbo blue line → Kungsträdgården). */
export const TOWARDS_DESTINATION = 'Kungsträdgården';

function towardsDestination(d) {
  const dest = (d.destination ?? d.direction ?? '').toString().toLowerCase();
  return dest.includes(TOWARDS_DESTINATION.toLowerCase());
}

/**
 * Fetch all sites and return the site id for the given name.
 * Prefers exact name match (e.g. "Duvbo" over "Duvbo torg") so we get the tunnelbana station, not the bus stop.
 * @param {string} name - e.g. "Duvbo"
 * @returns {Promise<number|null>} site id or null
 */
export async function findSiteIdByName(name) {
  const res = await fetch(`${SL_BASE}/v1/sites?expand=true`);
  if (!res.ok) throw new Error(`SL sites: ${res.status}`);
  const sites = await res.json();
  const needle = name.trim().toLowerCase();
  const exact = sites.find(
    (s) => s.name && String(s.name).toLowerCase() === needle
  );
  if (exact) return exact.id;
  const partial = sites.find(
    (s) => s.name && String(s.name).toLowerCase().includes(needle)
  );
  return partial ? partial.id : null;
}

/**
 * Fetch departures for a site and return only metro (tunnelbana) departures.
 * @param {number} siteId
 * @returns {Promise<{ departures: Array, stop_deviations?: Array }>}
 */
export async function getDepartures(siteId) {
  const res = await fetch(`${SL_BASE}/v1/sites/${siteId}/departures`);
  if (!res.ok) throw new Error(`SL departures: ${res.status}`);
  const data = await res.json();
  const departures = (data.departures || [])
    .filter((d) => METRO_MODES.has(d.line?.transport_mode))
    .filter(towardsDestination);
  return { departures, stop_deviations: data.stop_deviations };
}
