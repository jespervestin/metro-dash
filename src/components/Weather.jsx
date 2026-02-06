import { getWeatherTheme } from '../lib/weather';
import './Weather.css';

const FALLBACK_GRADIENT = 'linear-gradient(180deg, #455a64 0%, #546e7a 100%)';

function formatDateLine(date = new Date()) {
  const weekday = date.toLocaleDateString('sv-SE', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('sv-SE', { month: 'short' }).replace('.', '');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(weekday)} ${day} ${cap(month)}`;
}

export default function Weather({ data, loading, error, devMode, onCycleScenario, onUseLiveData, scenarioLabel }) {
  const isLoading = !!loading;
  const isError = !!error;
  const theme = data ? getWeatherTheme(data.code, data.isDay) : null;
  const gradient = theme ? theme.gradient : FALLBACK_GRADIENT;

  const handleBadgeClick = (e) => {
    e.stopPropagation();
    onUseLiveData?.();
  };

  return (
    <section
      className={`weather-panel ${theme?.light ? 'weather-panel--light' : ''} ${isLoading ? 'weather-panel--loading' : ''} ${isError ? 'weather-panel--error' : ''} ${devMode ? 'weather-panel--dev' : ''}`}
      style={{ '--weather-bg': gradient }}
      aria-label={data ? `Weather: ${data.label}, ${data.temp != null ? Math.round(data.temp) : '–'} degrees` : 'Weather'}
      onClick={devMode && onCycleScenario ? onCycleScenario : undefined}
      role={devMode && onCycleScenario ? 'button' : undefined}
      title={devMode && onCycleScenario ? 'Tap to cycle weather (dev)' : undefined}
    >
      <div className="weather-panel__bg" aria-hidden />
      <div className="weather-panel__inner">
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
        {isLoading && (
          <>
            <p className="weather-panel__loading-text">Laddar väder…</p>
            <p className="weather-panel__date weather-panel__date--standalone" aria-label={new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}>
              {formatDateLine()}
            </p>
          </>
        )}
        {isError && (
          <>
            <p className="weather-panel__error-text">Väder: {error}</p>
            <p className="weather-panel__date weather-panel__date--standalone" aria-label={new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}>
              {formatDateLine()}
            </p>
          </>
        )}
        {!isLoading && !isError && data && (
          <div className="weather-panel__content">
            <p className="weather-panel__temp">
              {data.temp != null ? `${Math.round(data.temp)}°` : '–'}
            </p>
            <p className="weather-panel__label">{data.label}</p>
            <div className="weather-panel__meta-row">
              {data.humidity != null && (
                <>
                  <span className="weather-panel__meta">{data.humidity}% luftfuktighet</span>
                  <span className="weather-panel__meta-sep" aria-hidden>·</span>
                </>
              )}
              <span className="weather-panel__date" aria-label={new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}>
                {formatDateLine()}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
