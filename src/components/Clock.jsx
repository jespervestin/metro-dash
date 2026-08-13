import { useState, useEffect } from 'react';
import './Clock.css';

/** Manual pad — String.prototype.padStart is ES2017 and absent in Chrome 53. */
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

export default function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId;
    // Re-tick exactly on the minute boundary rather than every 60s from mount:
    // a plain interval drifts and can leave the panel showing a time that is
    // almost a full minute stale, which is very visible on a wall clock.
    function scheduleNextTick() {
      const d = new Date();
      const msToNextMinute = 60000 - (d.getSeconds() * 1000 + d.getMilliseconds());
      timeoutId = setTimeout(() => {
        setNow(new Date());
        scheduleNextTick();
      }, msToNextMinute);
    }
    scheduleNextTick();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="clock">
      <p className="clock__date">{formatDateLine(now)}</p>
      <p
        className="clock__time"
        aria-label={`Klockan är ${formatTime(now)}`}
      >
        {formatTime(now)}
      </p>
    </div>
  );
}
