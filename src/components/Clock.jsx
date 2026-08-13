import { useMinuteTick } from '../lib/useMinuteTick';
import './Clock.css';

/** Manual pad — String.prototype.padStart is ES2017 and absent in this WebView. */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateLine(date) {
  const weekday = date.toLocaleDateString('sv-SE', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(weekday)} ${day} ${cap(month)}`;
}

/**
 * @param {'header'|'hero'} variant - 'hero' is the large treatment used when
 *   there is no departure to lead with and the clock takes the top slot.
 */
export default function Clock({ variant = 'header' }) {
  const now = useMinuteTick();

  return (
    <div className={`clock clock--${variant}`}>
      <p className="clock__time" aria-label={`Klockan är ${formatTime(now)}`}>
        {formatTime(now)}
      </p>
      <p className="clock__date">{formatDateLine(now)}</p>
    </div>
  );
}
