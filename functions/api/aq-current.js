const MET_BASE = 'https://api.met.no/weatherapi/airqualityforecast/0.1';
const UA = 'luftkvalitet-webapp/1.0 github.com/Hoemgruppen/luftkvalitet_webapp';

const OSLO_BARUM_MUNICIPALITIES = ['oslo', 'bærum'];

export async function onRequestGet(context) {
  const stationsResp = await fetch(`${MET_BASE}/stations`, {
    headers: { 'User-Agent': UA }
  });

  if (!stationsResp.ok) {
    return new Response(JSON.stringify({ error: 'Could not fetch stations' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const allStations = await stationsResp.json();
  const stations = allStations.filter(s =>
    OSLO_BARUM_MUNICIPALITIES.includes((s.kommune?.name || '').toLowerCase())
  );

  const results = await Promise.allSettled(
    stations.map(async (st) => {
      const resp = await fetch(`${MET_BASE}/?station=${st.eoi}`, {
        headers: { 'User-Agent': UA }
      });
      if (!resp.ok) return null;
      const forecast = await resp.json();
      const times = forecast?.data?.time;
      if (!times || !times.length) return null;

      const current = times[0];
      const vars = current.variables || {};

      const components = [];
      const compMap = {
        'no2_concentration': { name: 'NO2', aqiKey: 'AQI_no2' },
        'pm10_concentration': { name: 'PM10', aqiKey: 'AQI_pm10' },
        'pm25_concentration': { name: 'PM2.5', aqiKey: 'AQI_pm25' },
        'o3_concentration': { name: 'O3', aqiKey: 'AQI_o3' }
      };

      for (const [key, info] of Object.entries(compMap)) {
        if (vars[key]) {
          components.push({
            component: info.name,
            value: vars[key].value,
            unit: vars[key].units || 'µg/m³',
            index: Math.ceil(vars[info.aqiKey]?.value || 1),
            isValid: true
          });
        }
      }

      const aqi = vars.AQI?.value || 1;

      return {
        station: st.name,
        eoi: st.eoi,
        municipality: st.kommune?.name || '',
        area: st.delomrade?.name || '',
        latitude: parseFloat(st.latitude),
        longitude: parseFloat(st.longitude),
        index: Math.ceil(aqi),
        isValid: true,
        time: current.from,
        components
      };
    })
  );

  const data = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value);

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
