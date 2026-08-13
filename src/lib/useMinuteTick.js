import { useState, useEffect } from 'react';

/**
 * Returns a Date that updates once a minute, scheduled on the minute boundary
 * rather than every 60s from mount — a plain interval drifts and can leave the
 * panel showing a time almost a full minute stale, which is very visible on a
 * wall clock and makes the departure countdowns lag too.
 */
export function useMinuteTick() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId;
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

  return now;
}
