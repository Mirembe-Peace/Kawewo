import { useEffect, useRef, useState } from 'react';


type Telemetry = {
  device_id: string;
  temperature?: number;
  humidity?: number;
  fan_rpm?: number;
  received_at?: string;
};

export default function FanControl() {
  const [deviceId] = useState('esp01');
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // fetch recent telemetry
    fetch('http://localhost:4000/telemetry/recent?device_id=' + deviceId + '&limit=1')
      .then((r) => r.json())
      .then((d) => {
        if (d.rows && d.rows.length) setTelemetry(d.rows[0]);
      })
      .catch(() => {});

    // open websocket to receive live telemetry
    const ws = new WebSocket('ws://localhost:4000');
    wsRef.current = ws;
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'register', device_id: deviceId }));
    });
    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'telemetry') setTelemetry(msg.data);
      } catch (e) {}
    });
    return () => ws.close();
  }, [deviceId]);

  const sendCommand = async (value: number) => {
    setSpeed(value);
    await fetch('http://localhost:4000/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, command_type: 'set_fan_speed', payload: { speed: value } }),
    });
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", color: "#0b3d91" }}>
      <h2 style={{ color: "#0EA5E9" }}>AC Controller — Device {deviceId}</h2>
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ marginBottom: 8, color: "#ffffff" }}>
            Temperature: <strong>{telemetry?.temperature ?? "—"}</strong> °C
          </div>
          <div style={{ marginBottom: 8, color: "#ffffff" }}>
            Humidity: <strong>{telemetry?.humidity ?? "—"}</strong> %
          </div>
          <div style={{ marginBottom: 8, color: "#ffffff" }}>
            Fan RPM: <strong>{telemetry?.fan_rpm ?? "—"}</strong>
          </div>
          <div style={{ marginBottom: 8, color: "#ffffff" }}>
            Last:{" "}
            <strong>
              {telemetry?.received_at
                ? new Date(telemetry.received_at).toLocaleString()
                : "—"}
            </strong>
          </div>
        </div>
        <div style={{ width: 320 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Fan Speed: {speed}
          </label>
          <input
            type="range"
            min={0}
            max={5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            onMouseUp={(e) =>
              sendCommand(Number((e.target as HTMLInputElement).value))
            }
            onTouchEnd={(e) =>
              sendCommand(Number((e.target as HTMLInputElement).value))
            }
            style={{ width: "100%" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <small>0</small>
            <small>1</small>
            <small>2</small>
            <small>3</small>
            <small>4</small>
            <small>5</small>
          </div>
        </div>
      </div>
    </div>
  );
}
