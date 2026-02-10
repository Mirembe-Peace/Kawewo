import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { query } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Extend WebSocket type


// Root route
app.get('/', (req, res) => res.send('Backend is running!'));

// Receive telemetry from ESP32
app.post('/telemetry', async (req, res) => {
  try {
    const { device_id, temperature, humidity, fan_rpm } = req.body;
    await query(
      'INSERT INTO telemetry (device_id, temperature, humidity, fan_rpm) VALUES ($1,$2,$3,$4)',
      [device_id, temperature, humidity, fan_rpm]
    );

    const payload = JSON.stringify({ type: 'telemetry', data: req.body });
    wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.send(payload);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Post command from frontend
app.post('/command', async (req, res) => {
  try {
    const { device_id, command_type, payload } = req.body;
    const r = await query(
      'INSERT INTO commands (device_id, command_type, payload) VALUES ($1,$2,$3) RETURNING *',
      [device_id, command_type, payload]
    );

    const message = JSON.stringify({ type: 'command', data: r.rows[0] });
    wss.clients.forEach((c) => {
      if (c.readyState === WebSocket.OPEN) c.send(message);
    });

    res.json({ ok: true, command: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Get recent telemetry
app.get('/telemetry/recent', async (req, res) => {
  const device = req.query.device_id;
  const limit = parseInt(String(req.query.limit) || '50', 10);
  try {
    const q = device
      ? await query(
          'SELECT * FROM telemetry WHERE device_id=$1 ORDER BY received_at DESC LIMIT $2',
          [device, limit]
        )
      : await query('SELECT * FROM telemetry ORDER BY received_at DESC LIMIT $1', [limit]);
    res.json({ rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// WebSocket connection
wss.on('connection', function (socket) {
    console.log('ws connected');

    socket.on('message', async (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'register') {
          socket.device_id = parsed.device_id;

          const r = await query(
            'SELECT * FROM commands WHERE device_id=$1 AND delivered=false ORDER BY created_at ASC',
            [socket.device_id]
          );

          for (const cmd of r.rows) {
            socket.send(JSON.stringify({ type: 'command', data: cmd }));
            await query('UPDATE commands SET delivered=true WHERE id=$1', [cmd.id]);
          }
        }

        if (parsed.type === 'ack') {
          await query('UPDATE commands SET delivered=true WHERE id=$1', [parsed.id]);
        }
      } catch (e) {
        console.error('ws message error', e);
      }
    });
  });

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
