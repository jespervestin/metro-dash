/**
 * Derives which panel state the metro block should render:
 *
 *   no departures at all      -> 'none'   (black notice, clock takes the top slot)
 *   something is catchable    -> 'go'     ("Gå om X min", anchored on that train)
 *   nothing is catchable      -> 'missed' ("Hinner ej gå", hero is the black mass)
 *
 * The hero anchors on the first departure you can actually reach on foot, not
 * on the soonest one. Anchoring on the soonest made the panel useless on this
 * line: with ~10 minute headways and a 10 minute walk, the next train is
 * almost always just inside the walk time, so it sat on "Hinner ej gå"
 * permanently while the answer the reader wants — when to leave for the train
 * they *can* make — was never shown. 'missed' is now the genuinely rare case
 * of nothing reachable left, e.g. the last train of the night.
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

  // The train the reader should actually plan around: the soonest one still
  // far enough out to walk to.
  const target = rows.find((r) => r.minutes >= WALK_MINUTES) || null;
  if (target) return { kind: 'go', rows, target };

  // Every listed departure is inside the walk time — nothing left to catch.
  return { kind: 'missed', rows, first: rows[0] };
}
