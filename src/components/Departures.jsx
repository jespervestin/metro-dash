import { useState, useEffect, useMemo } from 'react';
import './Departures.css';

const COUNTDOWN_TICK_MS = 60 * 1000;

const WALK_MINUTES = 10;

/** Stockholm tunnelbana: blue 10/11, red 13/14, green 17/18/19. Returns a color token for CSS. */
function lineColorToken(designation) {
  const n = designation != null ? parseInt(designation, 10) : NaN;
  if (n === 10 || n === 11) return 'blue';
  if (n === 13 || n === 14) return 'red';
  if (n === 17 || n === 18 || n === 19) return 'green';
  return null;
}

function formatTime(iso) {
  if (!iso) return '–';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function minutesFromNow(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = (d - Date.now()) / 60000;
  if (diff < 0) return null;
  if (diff < 1) return 'Nu';
  const m = Math.floor(diff);
  return m === 1 ? '1 min' : `${m} min`;
}

/** Minutes until departure; null if in the past. */
function minutesUntilDeparture(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = (d - Date.now()) / 60000;
  return diff < 0 ? null : Math.floor(diff);
}

/** Minutes delayed (expected after scheduled); 0 if not delayed. */
function delayMinutes(d) {
  if (!d?.expected || !d?.scheduled) return 0;
  const diff = (new Date(d.expected) - new Date(d.scheduled)) / 60000;
  return diff > 0 ? Math.round(diff) : 0;
}

/** "Leave in X min" considering walk time; { leaveLabel, departLabel }. When train is 5 min or less away, show "Du missade detta". */
function leaveIn(iso) {
  const min = minutesUntilDeparture(iso);
  if (min == null) return { leaveLabel: null, departLabel: null };
  const departLabel = min < 1 ? 'Nu' : min === 1 ? '1 min' : `${min} min`;
  const leaveInMin = min - WALK_MINUTES;
  const leaveLabel =
    min <= WALK_MINUTES ? 'Hinner ej gå' : leaveInMin === 1 ? 'Gå om 1 min' : `Gå om ${leaveInMin} min`;
  return { leaveLabel, departLabel };
}

export default function Departures({ departures, loading, error, onRefresh }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), COUNTDOWN_TICK_MS);
    return () => clearInterval(t);
  }, []);

  const list = useMemo(() => {
    if (!Array.isArray(departures)) return [];
    const iso = (d) => d.expected || d.scheduled;
    return departures
      .filter((d) => minutesUntilDeparture(iso(d)) !== null)
      .slice(0, 3);
  }, [departures]);

  const next = useMemo(() => {
    const iso = (d) => d.expected || d.scheduled;
    const catchable = list.find((d) => (minutesUntilDeparture(iso(d)) ?? 0) > WALK_MINUTES);
    return catchable ?? list[0] ?? null;
  }, [list]);

  const nextLeave = next ? leaveIn(next.expected || next.scheduled) : null;
  const nextDelayed = next ? delayMinutes(next) : 0;

  if (loading) return <div className="departures departures--loading">Laddar avgångar…</div>;
  if (error) return <div className="departures departures--error">Avgångar: {error}</div>;

  return (
    <section
      className={`departures ${onRefresh ? 'departures--tappable' : ''}`}
      onClick={onRefresh || undefined}
      role={onRefresh ? 'button' : undefined}
      title={onRefresh ? 'Tryck för att uppdatera' : undefined}
    >
      <h2 className="departures__title">Nästa mot Kungsträdgården</h2>
      {list.length === 0 ? (
        <p className="departures__empty">Ingen tunnelbana mot Kungsträdgården just nu.</p>
      ) : (
        <>
          <div className="departures__next">
            <span className="departures__next-leave">{nextLeave?.leaveLabel ?? '–'}</span>
            <span className="departures__next-detail">
              mot Kungsträdgården · avgång {formatTime(next.expected || next.scheduled)}
              {nextDelayed > 0 && (
                <span className="departures__next-delay" title={`${nextDelayed} min försening`}>+{nextDelayed}</span>
              )}
            </span>
            <span className="departures__next-depart">
              Tåget går {nextLeave?.departLabel ?? '–'}
            </span>
          </div>
          <ul className="departures__list">
            {list.map((d, i) => {
              const lineColor = lineColorToken(d.line?.designation);
              const delayed = delayMinutes(d);
              return (
              <li key={d.journey?.id ?? i} className={`departures__item ${i === 0 ? 'departures__item--first' : ''} ${delayed > 0 ? 'departures__item--delayed' : ''}`}>
                <span className={`departures__line ${lineColor ? `departures__line--${lineColor}` : ''}`}>
                  {d.line?.designation ?? '–'}
                </span>
                <span className="departures__destination">{d.destination ?? d.direction ?? '–'}</span>
                <span className="departures__time-wrap">
                  <span className="departures__time">{formatTime(d.expected || d.scheduled)}</span>
                  {delayed > 0 && (
                    <span className="departures__delay" title={`${delayed} min försening`}>+{delayed}</span>
                  )}
                </span>
                <span className="departures__countdown">{minutesFromNow(d.expected || d.scheduled) ?? ''}</span>
              </li>
            );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
