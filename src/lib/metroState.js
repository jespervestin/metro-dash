/**
 * Derives which panel state the metro block should render, per the design:
 *
 *   no departures            -> 'none'   (black notice, clock takes the top slot)
 *   soonest is < WALK away   -> 'missed' ("Hinner ej gå", hero is the black mass)
 *   otherwise                -> 'go'     ("Gå om X min")
 *
 * Kept as a pure function so the three states can be reasoned about and
 * exercised without rendering.
 */
export const WALK_MINUTES = 10;

/** Whole minutes until `iso`, or null if it is in the past / unparseable. */
export function minutesUntil(iso, now = Date.now()) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const diff = (t - now) / 60000;
  return diff < 0 ? null : Math.floor(diff);
}

/** Minutes a departure is running late; 0 when on time. */
export function delayMinutes(d) {
  if (!d || !d.expected || !d.scheduled) return 0;
  const diff = (new Date(d.expected).getTime() - new Date(d.scheduled).getTime()) / 60000;
  return diff > 0 ? Math.round(diff) : 0;
}

export function deriveMetro(departures, now = Date.now()) {
  if (!Array.isArray(departures)) return { kind: 'none', rows: [] };

  const rows = departures
    .map((d) => {
      const iso = d.expected || d.scheduled;
      return { raw: d, iso, minutes: minutesUntil(iso, now), delay: delayMinutes(d) };
    })
    .filter((r) => r.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  if (rows.length === 0) return { kind: 'none', rows: [] };

  const first = rows[0];
  if (first.minutes < WALK_MINUTES) {
    // The soonest train is unreachable on foot. The supporting lines should
    // describe the next one you actually *can* make — which may not exist if
    // every listed departure is within the walk time.
    const catchable = rows.find((r) => r.minutes >= WALK_MINUTES) || null;
    return { kind: 'missed', rows, first, catchable };
  }

  return { kind: 'go', rows, first };
}
