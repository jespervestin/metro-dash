/**
 * Fetch and parse a public iCal (ICS) feed.
 * In dev: uses Vite proxy (/api/calendar.ics) to avoid CORS.
 * In production: fetches directly from Google Calendar URL (from env var).
 */

const CALENDAR_URL = import.meta.env.VITE_CALENDAR_ICAL_URL || '/api/calendar.ics';
const REFRESH_MS = 5 * 60 * 1000; // 5 min

/**
 * Unfold ICS lines (continuation lines start with space/tab per RFC 5545).
 */
function unfoldIcs(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

/**
 * Parse ICS text into events with { summary, startDate, endDate, allDay }.
 * Handles VALUE=DATE (all-day) and datetime format.
 */
function parseIcs(icsText) {
  const unfolded = unfoldIcs(icsText);
  const events = [];
  const blocks = unfolded.split(/\r?\nBEGIN:VEVENT\r?\n/i);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split(/\r?\nEND:VEVENT\r?\n/i)[0] || '';
    // Match at start of block (^) or after newline – first line of block has no preceding \n
    const summary = block.match(/(?:^|\r?\n)SUMMARY:(.*?)(?:\r?\n|$)/i)?.[1]?.trim().replace(/\\,/g, ',') ?? '';
    const dtStart = block.match(/(?:^|\r?\n)DTSTART(?:;[^:]*)?:(\d{8}(?:T\d{6}Z?)?)/i)?.[1];
    const dtEnd = block.match(/(?:^|\r?\n)DTEND(?:;[^:]*)?:(\d{8}(?:T\d{6}Z?)?)/i)?.[1];
    if (!dtStart) continue;

    const allDay = dtStart.length === 8; // YYYYMMDD (interpret as local calendar date)
    const startDate = allDay
      ? new Date(+dtStart.slice(0, 4), +dtStart.slice(4, 6) - 1, +dtStart.slice(6, 8))
      : parseIcsDateTime(dtStart);
    const endDate = dtEnd
      ? allDay
        ? new Date(+dtEnd.slice(0, 4), +dtEnd.slice(4, 6) - 1, +dtEnd.slice(6, 8))
        : parseIcsDateTime(dtEnd)
      : startDate;

    events.push({
      summary: summary || 'Namnlös',
      startDate,
      endDate,
      allDay,
    });
  }
  return events;
}

function parseIcsDateTime(str) {
  if (str.length === 8) {
    return new Date(Date.UTC(+str.slice(0, 4), +str.slice(4, 6) - 1, +str.slice(6, 8)));
  }
  const y = +str.slice(0, 4);
  const m = +str.slice(4, 6) - 1;
  const d = +str.slice(6, 8);
  const h = +str.slice(9, 11);
  const min = +str.slice(11, 13);
  const sec = +str.slice(13, 15) || 0;
  return new Date(Date.UTC(y, m, d, h, min, sec));
}

/** Normalise to date-only in local time for comparison */
function toLocalDate(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const UPCOMING_DAYS = 31;

/** Events that start on or after today (local time), up to UPCOMING_DAYS */
function filterUpcoming(events) {
  const now = Date.now();
  const todayStart = toLocalDate(now);
  const endLimit = todayStart + UPCOMING_DAYS * ONE_DAY_MS;

  return events.filter((ev) => {
    const endTime = ev.endDate.getTime();
    if (endTime <= todayStart) return false;
    const startTime = ev.startDate.getTime();
    return startTime < endLimit;
  });
}

/** Events that fall on a given day (midnight-to-midnight local) */
function eventsOnDay(events, dayStartMs) {
  const dayEndMs = dayStartMs + ONE_DAY_MS;
  return events.filter((ev) => {
    const start = toLocalDate(ev.startDate);
    return start === dayStartMs;
  });
}

/** Format a day as short Swedish date, e.g. "Mån 27 jan" */
function formatDayLabel(dayStartMs) {
  const d = new Date(dayStartMs);
  const weekday = d.toLocaleDateString('sv-SE', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(weekday)} ${day} ${cap(month)}`;
}

/**
 * Returns { dateLabel, events, isToday }.
 * If there are events today, returns today's events with dateLabel "Idag".
 * If no events today, returns the next day that has events, with dateLabel e.g. "Mån 27 jan".
 * If no events in the next UPCOMING_DAYS, returns { dateLabel: null, events: [], isToday: false }.
 */
export async function fetchCalendarEvents() {
  try {
    const res = await fetch(CALENDAR_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Kalender: ${res.status}`);
    let text = await res.text();
    text = text.replace(/^\uFEFF/, ''); // BOM
    if (!/BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(text)) {
      throw new Error('Kalendern returnerade inte en giltig ICS-fil');
    }
    const events = parseIcs(text);
    const upcoming = filterUpcoming(events);
    const todayStart = toLocalDate(Date.now());

    const todays = eventsOnDay(upcoming, todayStart);
    if (todays.length > 0) {
      return { dateLabel: 'Idag', events: todays, isToday: true };
    }

    for (let day = 1; day < UPCOMING_DAYS; day++) {
      const dayStart = todayStart + day * ONE_DAY_MS;
      const onDay = eventsOnDay(upcoming, dayStart);
      if (onDay.length > 0) {
        return { dateLabel: formatDayLabel(dayStart), events: onDay, isToday: false };
      }
    }

    return { dateLabel: null, events: [], isToday: false };
  } catch (error) {
    // Handle CORS or network errors
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      throw new Error('Kalendern kunde inte nås. Kontrollera CORS-inställningar eller använd en proxy.');
    }
    throw error;
  }
}

export { REFRESH_MS as CALENDAR_REFRESH_MS };
