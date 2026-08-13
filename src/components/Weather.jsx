import './Weather.css';

export default function Weather({ data, loading, error, devMode, onCycleScenario, onUseLiveData, scenarioLabel }) {
  const isLoading = !!loading;
  const isError = !!error;

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    onUseLiveData?.();
  };

  return (
    <section
      className={`weather-panel ${isLoading ? 'weather-panel--loading' : ''} ${isError ? 'weather-panel--error' : ''} ${devMode ? 'weather-panel--dev' : ''}`}
      aria-label={data ? `Väder: ${data.label}, ${data.temp != null ? Math.round(data.temp) : '–'} grader` : 'Väder'}
      onClick={devMode && onCycleScenario ? onCycleScenario : undefined}
      role={devMode && onCycleScenario ? 'button' : undefined}
      title={devMode && onCycleScenario ? 'Tryck för att byta väder (dev)' : undefined}
    >
      {isLoading && <p className="weather-panel__loading-text">Laddar väder…</p>}
      {isError && <p className="weather-panel__error-text">Väder: {error}</p>}
      {!isLoading && !isError && data && (
        <>
          <p className="weather-panel__temp">
            {data.temp != null ? `${Math.round(data.temp)}°` : '–'}
          </p>
          <p className="weather-panel__label">{data.label}</p>
          {data.humidity != null && (
            <p className="weather-panel__meta">{data.humidity}% luftfuktighet</p>
          )}
        </>
      )}
      {devMode && scenarioLabel != null && (
        <button
          type="button"
          className="weather-panel__dev-badge"
          onClick={handleBadgeClick}
          title="Visa liveväder"
        >
          Dev · {scenarioLabel}
        </button>
      )}
    </section>
  );
}
