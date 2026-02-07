AC server

Quick start:

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run DB migration:

```bash
psql "$DATABASE_URL" -f migrations/init.sql
```

3. Install and run server:

```bash
cd server
npm install
npm run dev
```

Endpoints:
- `POST /telemetry` — body { device_id, temperature, humidity, fan_rpm }
- `POST /command` — body { device_id, command_type, payload }
- `GET /telemetry/recent` — query params `device_id`, `limit`

WebSocket:
- Connect to `ws://HOST:PORT` and send `{type:'register', device_id:'your_id'}` to receive pending commands and telemetry broadcasts.
