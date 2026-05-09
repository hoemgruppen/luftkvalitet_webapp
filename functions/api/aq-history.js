const MET_BASE = 'https://api.met.no/weatherapi/airqualityforecast/0.1';
const UA = 'luftkvalitet-webapp/1.0 github.com/Hoemgruppen/luftkvalitet_webapp';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const station = url.searchParams.get('station');

  if (!station) {
    return new Response(JSON.stringify({ error: 'Missing param: station (eoi code)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const resp = await fetch(`${MET_BASE}/?station=${encodeURIComponent(station)}`, {
    headers: { 'User-Agent': UA }
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: 'MET API error', status: resp.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const forecast = await resp.json();
  const times = forecast?.data?.time || [];

  const compMap = {
    'no2_concentration': { name: 'NO2', aqiKey: 'AQI_no2' },
    'pm10_concentration': { name: 'PM10', aqiKey: 'AQI_pm10' },
    'pm25_concentration': { name: 'PM2.5', aqiKey: 'AQI_pm25' },
    'o3_concentration': { name: 'O3', aqiKey: 'AQI_o3' }
  };

  const series = [];
  for (const t of times.slice(0, 24)) {
    const vars = t.variables || {};
    for (const [key, info] of Object.entries(compMap)) {
      if (vars[key]) {
        series.push({
          time: t.from,
          component: info.name,
          value: vars[key].value,
          unit: vars[key].units || 'µg/m³',
          index: Math.ceil(vars[info.aqiKey]?.value || 1),
          isValid: true
        });
      }
    }
  }

  return new Response(JSON.stringify(series), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
