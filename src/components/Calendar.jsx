import { useState, useEffect, useCallback } from 'react';
import { fetchCalendarEvents, CALENDAR_REFRESH_MS } from '../lib/calendar';
import './Calendar.css';

const timeOpts = { hour: '2-digit', minute: '2-digit', hour12: false };

function formatEventTime(ev) {
  if (ev.allDay) return 'Hela dagen';
  const start = ev.startDate.toLocaleTimeString('sv-SE', timeOpts);
  const end = ev.endDate.toLocaleTimeString('sv-SE', timeOpts);
  return start === end ? start : `${start} – ${end}`;
}

function EventList({ events, dateLabel }) {
  if (!events?.length) return null;
  return (
    <div className="calendar__day">
      <span className="calendar__day-label">{dateLabel}</span>
      <ul className="calendar__list" aria-label={`Kalender ${dateLabel}`}>
        {events.map((ev, i) => (
          <li key={i} className="calendar__event">
            <span className="calendar__event-time" aria-hidden>{formatEventTime(ev)}</span>
            <span className="calendar__event-summary">{ev.summary}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Calendar() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await fetchCalendarEvents();
      setData(result);
    } catch (e) {
      setError(e.message || 'Kunde inte ladda kalendern');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    load();
    const t = setInterval(load, CALENDAR_REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const sectionProps = {
    className: 'calendar calendar--tappable',
    'aria-label': 'Kalender',
    onClick: handleRefresh,
    role: 'button',
    title: 'Tryck för att uppdatera',
  };

  if (loading && !data) {
    return (
      <section {...sectionProps}>
        <p className="calendar__loading">Laddar kalender…</p>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section {...sectionProps} className="calendar calendar--tappable calendar--error">
        <p className="calendar__error">{error}</p>
      </section>
    );
  }

  if (!data?.events?.length) {
    return (
      <section {...sectionProps}>
        <p className="calendar__empty">Inga kommande händelser</p>
      </section>
    );
  }

  return (
    <section {...sectionProps}>
      <EventList events={data.events} dateLabel={data.dateLabel} />
    </section>
  );
}
