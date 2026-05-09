# Luftkvalitet Webapp

## Project Overview

Air quality monitoring PWA for Oslo/Bærum with special emphasis on Fornebu area. Dark-themed single-file SPA styled after share.variant.dev/luftkvalitet/.

## Architecture

```
luftkvalitet_webapp/
├── index.html                    # Full SPA (HTML + CSS + inline JS)
├── functions/api/
│   ├── aq-current.js            # Proxies MET.no → all Oslo/Bærum stations
│   └── aq-history.js            # Proxies MET.no → 24h forecast for one station
├── .gitignore
└── CLAUDE.md
```

**No build step. No framework. No dependencies.** Just static HTML + Cloudflare Pages Functions.

## Data Source

**MET.no Air Quality Forecast API** (public, no auth):
- Stations list: `https://api.met.no/weatherapi/airqualityforecast/0.1/stations`
- Station forecast: `https://api.met.no/weatherapi/airqualityforecast/0.1/?station={eoi}`
- Returns: AQI, NO2, PM10, PM2.5, O3 concentrations + 55h forecast
- Requires `User-Agent` header

Note: NILU API (api.nilu.no) now requires auth — that's why we use MET.no instead.

## Hosting & Deployment

- **GitHub**: https://github.com/Hoemgruppen/luftkvalitet_webapp
- **Hosting**: Cloudflare Pages (auto-deploy on push to `main`)
- **Functions**: Auto-detected from `functions/` directory
- **No env vars needed** — MET.no API is public

## Local Development

```bash
npx wrangler pages dev .
```

Opens at http://localhost:8788. The Pages Functions proxy MET.no so the frontend can fetch from `/api/aq-current` and `/api/aq-history`.

## Key Design Decisions

- **Fornebu-first**: Default zone is "Nær Fornebu" (5km radius), stations sorted by distance to 59.895°N, 10.605°E
- **Zone pills**: Nær Fornebu | Bærum | Oslo | Alle
- **Forecast, not historical**: MET.no provides forecast data (current + next 55h), not past measurements
- **Chart.js 4.4.1** loaded from cdnjs for the 24h forecast bar chart in detail view
- **PWA-ready**: Apple mobile web app meta tags, safe-area handling

## Station Coverage

24 stations in Oslo/Bærum including:
- **Near Fornebu**: E18 Høvik kirke (NO0142A), E18 Høvik stasjon (NO0153A), Eilif Dues vei (NO0099A), Bekkestua (NO0114A)
- **Oslo**: Alnabru, Manglerud, Skøyen, Kirkeveien, Sofienbergparken, etc.

## Common Tasks

- **Add a station**: The function fetches ALL stations from MET.no filtered to Oslo/Bærum municipality. To expand coverage, edit the `OSLO_BARUM_MUNICIPALITIES` array in `functions/api/aq-current.js`.
- **Change Fornebu coordinates**: Edit `FORNEBU_LAT`/`FORNEBU_LON`/`FORNEBU_RADIUS_KM` at top of `<script>` in `index.html`.
- **Adjust cache TTL**: Edit `Cache-Control` headers in the functions (currently 10min for current, 1h for forecast).
