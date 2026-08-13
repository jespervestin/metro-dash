import './Weather.css';

/**
 * @param {'header'|'large'} variant - 'large' is used in the no-departures
 *   state, where the weather moves up into the space the metro block vacated.
 */
export default function Weather({ data, loading, error, variant = 'header', onCycleScenario }) {
  const body = (() => {
    if (loading) return <p className="weather__note">Laddar väder…</p>;
    if (error) return <p className="weather__note">Väder: {error}</p>;
    if (!data) return null;
    return (
      <>
        <p className="weather__temp">
          {data.temp != null ? `${Math.round(data.temp)}°` : '–'}
        </p>
        <div className="weather__detail">
          <p className="weather__condition">{data.label}</p>
          {data.humidity != null && (
            <p className="weather__humidity">{data.humidity}% luftfuktighet</p>
          )}
        </div>
      </>
    );
  })();

  return (
    <section
      className={`weather weather--${variant}`}
      aria-label={
        data
          ? `Väder: ${data.label}, ${data.temp != null ? Math.round(data.temp) : '–'} grader`
          : 'Väder'
      }
      onClick={onCycleScenario || undefined}
    >
      {body}
    </section>
  );
}
