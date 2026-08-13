import { WALK_MINUTES } from '../lib/metroState';
import './Departures.css';

/* The panel is a fixed 1024px with no scroll, so the list and the calendar
   share one budget. 4 departure rows + 4 calendar events overflows by ~95px,
   which `overflow:hidden` would silently swallow. 3 rows here and 3 events in
   the calendar is the widest combination that always fits, and the hero has
   already answered the question the list only supports. */
const MAX_ROWS = 3;

function formatClock(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function minuteLabel(m) {
  if (m == null) return '–';
  return m < 1 ? 'Nu' : `${m} min`;
}

/** The section marker: a solid square, the only graphic element in the design. */
function Marker() {
  return <span className="metro__marker" aria-hidden="true" />;
}

function SectionLabel() {
  return (
    <div className="metro__section-label">
      <Marker />
      <span>DUVBO → STAN</span>
    </div>
  );
}

function DepartureRows({ rows }) {
  return (
    <ul className="metro__list">
      {rows.slice(0, MAX_ROWS).map((r, i) => (
        <li className="metro__row" key={r.raw.journey?.id ?? i}>
          <span className="metro__badge">{r.raw.line?.designation ?? '–'}</span>
          <span className="metro__dest">
            {r.raw.destination ?? r.raw.direction ?? '–'}
          </span>
          <span className="metro__delay">{r.delay > 0 ? `+${r.delay}` : ''}</span>
          <span className="metro__time">{formatClock(r.iso)}</span>
          <span className="metro__countdown">{minuteLabel(r.minutes)}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Renders the metro hero plus the upcoming list. `state` comes from
 * deriveMetro(). Exactly one black mass per panel: in 'go' it is the
 * NÄSTA AVGÅNGAR band, in 'missed' it is the hero itself, so the band
 * de-inverts to a plain label.
 */
export default function Departures({ state, loading, error }) {
  if (loading) {
    return <div className="metro__note">Laddar avgångar…</div>;
  }

  if (error) {
    return (
      <section className="metro__notice">
        <SectionLabel />
        <p className="metro__notice-text">Avgångar kunde inte hämtas.</p>
      </section>
    );
  }

  if (state.kind === 'none') {
    return (
      <section className="metro__notice">
        <SectionLabel />
        <p className="metro__notice-text">
          Ingen tunnelbana
          <br />
          mot stan just nu.
        </p>
      </section>
    );
  }

  if (state.kind === 'missed') {
    const c = state.catchable;
    return (
      <>
        <section className="metro__hero metro__hero--missed">
          <SectionLabel />
          <p className="metro__answer">
            Hinner
            <br />
            ej gå
          </p>
          {c && (
            <div className="metro__detail">
              <span className="metro__detail-strong">Nästa {formatClock(c.iso)}</span>
              <span className="metro__detail-muted">
                Gå om {c.minutes - WALK_MINUTES} min
              </span>
            </div>
          )}
        </section>
        <div className="metro__list-wrap">
          <div className="metro__band metro__band--plain">NÄSTA AVGÅNGAR</div>
          <DepartureRows rows={state.rows} />
        </div>
      </>
    );
  }

  // kind === 'go'
  const f = state.first;
  return (
    <>
      <section className="metro__hero">
        <SectionLabel />
        <p className="metro__answer">
          Gå om
          <br />
          {f.minutes - WALK_MINUTES} min
        </p>
        <div className="metro__detail">
          <span className="metro__detail-strong">Avgång {formatClock(f.iso)}</span>
          <span className="metro__detail-muted">Tåget går {f.minutes} min</span>
        </div>
      </section>
      <div className="metro__band">NÄSTA AVGÅNGAR</div>
      <div className="metro__list-wrap">
        <DepartureRows rows={state.rows} />
      </div>
    </>
  );
}
