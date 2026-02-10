import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'https';
import { WebSocketServer } from 'wss';
import { query } from './db.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Telemetry from ESP32 -> store
app.post('/telemetry', async (req, res) => {
  try {
    const { device_id, temperature, humidity, fan_rpm } = req.body;
    await query(
      'INSERT INTO telemetry (device_id, temperature, humidity, fan_rpm) VALUES ($1,$2,$3,$4)',
      [device_id, temperature, humidity, fan_rpm]
    );

    // broadcast to connected websocket clients (frontend)
    const payload = JSON.stringify({ type: 'telemetry', data: req.body });
    wss.clients.forEach((c) => {
      if (c.readyState === 1) c.send(payload);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Frontend posts a command to control fan speed
app.post('/command', async (req, res) => {
  try {
    const { device_id, command_type, payload } = req.body;
    const r = await query(
      'INSERT INTO commands (device_id, command_type, payload) VALUES ($1,$2,$3) RETURNING *',
      [device_id, command_type, payload]
    );

    // broadcast to ESP32 clients
    const message = JSON.stringify({ type: 'command', data: r.rows[0] });
    // mark delivered optimistically when sent
    wss.clients.forEach((c) => {
      if (c.readyState === 1) c.send(message);
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
  const limit = parseInt(req.query.limit || '50', 10);
  try {
    const q = device
      ? await query('SELECT * FROM telemetry WHERE device_id=$1 ORDER BY received_at DESC LIMIT $2', [device, limit])
      : await query('SELECT * FROM telemetry ORDER BY received_at DESC LIMIT $1', [limit]);
    res.json({ rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => {
  console.log('ws connected');
  socket.on('message', async (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      // device can register itself: {type:'register', device_id:'esp01'}
      if (parsed.type === 'register') {
        socket.device_id = parsed.device_id;
        console.log('registered device', socket.device_id);
        // optionally send undelivered commands
        const r = await query('SELECT * FROM commands WHERE device_id=$1 AND delivered=false ORDER BY created_at ASC', [socket.device_id]);
        for (const cmd of r.rows) {
          socket.send(JSON.stringify({ type: 'command', data: cmd }));
          await query('UPDATE commands SET delivered=true WHERE id=$1', [cmd.id]);
        }
      }
      // ESP can ACK delivered commands
      if (parsed.type === 'ack') {
        await query('UPDATE commands SET delivered=true WHERE id=$1', [parsed.id]);
      }
    } catch (e) {
      console.error('ws message error', e);
    }
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
