(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cfg = { city: null, unit: 'c', city2: null };
  var weatherSeq = 0, citySeq = 0, clockSeq = 0;

  var CODES = {
    0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
  };
  function save() { chrome.storage.local.set({ weather: cfg }); }
  function short(name) { return String(name || '').split(',')[0]; }

  function geocode(name) {
    name = String(name || '').trim().slice(0, 100);
    if (!name) return Promise.resolve(null);
    return fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(name))
      .then(function (r) { if (!r.ok) throw new Error('lookup'); return r.json(); })
      .then(function (d) {
        var x = d.results && d.results[0];
        if (!x) return null;
        return { name: x.name + (x.country ? ', ' + x.country : ''), lat: x.latitude, lon: x.longitude, tz: x.timezone };
      });
  }

  /* ---------- Weather ---------- */
  function show(c) {
    var el = $('weather');
    var u = cfg.unit === 'f' ? '\u00B0F' : '\u00B0C';
    el.className = 'weather';
    el.textContent = short(cfg.city.name) + ' \u2022 ' + Math.round(c.cur) + u + ' \u2022 ' + (CODES[c.code] || 'Weather') +
      ' \u2022 H ' + Math.round(c.hi) + '\u00B0 L ' + Math.round(c.lo) + '\u00B0';
  }
  function loadWeather() {
    var requestId = ++weatherSeq;
    var el = $('weather');
    if (!cfg.city) {
      el.className = 'weather muted';
      el.textContent = 'Add your city in Settings to see the weather.';
      return;
    }
    var key = cfg.city.lat + ',' + cfg.city.lon + ',' + cfg.unit;
    chrome.storage.local.get('weatherCache', function (d) {
      var c = d.weatherCache;
      var same = c && c.key === key;
      if (same) show(c);
      else el.textContent = '';
      if (same && Date.now() - c.t < 20 * 60000) return;
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + cfg.city.lat + '&longitude=' + cfg.city.lon +
        '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto' +
        (cfg.unit === 'f' ? '&temperature_unit=fahrenheit' : '');
      fetch(url).then(function (r) { if (!r.ok) throw new Error('weather'); return r.json(); }).then(function (w) {
        if (requestId !== weatherSeq || !cfg.city || key !== (cfg.city.lat + ',' + cfg.city.lon + ',' + cfg.unit)) return;
        if (!w.current || !w.daily || !Array.isArray(w.daily.temperature_2m_max) || !Array.isArray(w.daily.temperature_2m_min)) throw new Error('weather');
        var n = {
          key: key, t: Date.now(), cur: w.current.temperature_2m, code: w.current.weather_code,
          hi: w.daily.temperature_2m_max[0], lo: w.daily.temperature_2m_min[0]
        };
        chrome.storage.local.set({ weatherCache: n });
        show(n);
      }).catch(function () {
        if (requestId === weatherSeq && !same) { el.className = 'weather muted'; el.textContent = 'Weather unavailable right now.'; }
      });
    });
  }

  /* ---------- Second clock ---------- */
  function tickClock2() {
    var el = $('clock2');
    if (!cfg.city2) { el.hidden = true; return; }
    try {
      var t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: cfg.city2.tz });
      el.textContent = short(cfg.city2.name) + ' ' + t;
      el.hidden = false;
    } catch (e) { el.hidden = true; }
  }

  /* ---------- Settings ---------- */
  function wsay(id, msg, err) { var s = $(id); s.textContent = msg || ''; s.className = 'status' + (err ? ' err' : ''); }

  $('wSet').addEventListener('click', function () {
    var name = $('wCity').value.trim().slice(0, 100), requestId = ++citySeq;
    if (!name) { cfg.city = null; save(); wsay('wStatus', 'Weather turned off.'); loadWeather(); return; }
    wsay('wStatus', 'Looking up\u2026');
    geocode(name).then(function (r) {
      if (requestId !== citySeq) return;
      if (!r) { wsay('wStatus', 'City not found. Try just the city name.', true); return; }
      cfg.city = r; save();
      wsay('wStatus', 'Weather set for ' + r.name + '.');
      loadWeather();
    }).catch(function () { if (requestId === citySeq) wsay('wStatus', 'Could not look that up. Check your internet connection.', true); });
  });
  $('wUnit').addEventListener('change', function () {
    cfg.unit = $('wUnit').value === 'f' ? 'f' : 'c'; save(); loadWeather();
  });
  $('c2Set').addEventListener('click', function () {
    var name = $('c2City').value.trim().slice(0, 100), requestId = ++clockSeq;
    if (!name) return;
    wsay('c2Status', 'Looking up\u2026');
    geocode(name).then(function (r) {
      if (requestId !== clockSeq) return;
      if (!r) { wsay('c2Status', 'City not found. Try just the city name.', true); return; }
      cfg.city2 = { name: r.name, tz: r.tz }; save();
      wsay('c2Status', 'Second clock set to ' + r.name + '.');
      tickClock2();
    }).catch(function () { if (requestId === clockSeq) wsay('c2Status', 'Could not look that up. Check your internet connection.', true); });
  });
  $('c2Clear').addEventListener('click', function () {
    clockSeq++;
    cfg.city2 = null; save(); $('c2City').value = ''; wsay('c2Status', 'Second clock removed.'); tickClock2();
  });

  chrome.storage.local.get('weather', function (d) {
    var w = d.weather && typeof d.weather === 'object' ? d.weather : {};
    function validCity(c, withCoords) {
      return c && typeof c.name === 'string' && typeof c.tz === 'string' &&
        (!withCoords || isFinite(+c.lat) && isFinite(+c.lon));
    }
    cfg = {
      city: validCity(w.city, true) ? { name: w.city.name.slice(0, 100), lat: +w.city.lat, lon: +w.city.lon, tz: w.city.tz.slice(0, 80) } : null,
      unit: w.unit === 'f' ? 'f' : 'c',
      city2: validCity(w.city2, false) ? { name: w.city2.name.slice(0, 100), tz: w.city2.tz.slice(0, 80) } : null
    };
    $('wUnit').value = cfg.unit;
    if (cfg.city) $('wCity').value = short(cfg.city.name);
    if (cfg.city2) $('c2City').value = short(cfg.city2.name);
    loadWeather();
    tickClock2();
  });
  /* A minute-resolution clock does not need four updates per minute. */
  setInterval(function () { if (!document.hidden) tickClock2(); }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tickClock2();
  });
})();
