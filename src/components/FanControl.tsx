import { API_URL } from "../config";
import { useEffect, useRef, useState } from "react";

type Telemetry = {
  device_id: string;
  temperature?: number;
  humidity?: number;
  fan_rpm?: number;
  received_at?: string;
};

export default function FanControl() {
  const [deviceId] = useState("esp01");
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch recent telemetry once on mount
  useEffect(() => {
    fetch(`${API_URL}/telemetry/recent?device_id=${deviceId}&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rows && d.rows.length) setTelemetry(d.rows[0]);
      })
      .catch((err) => console.error("Failed to fetch recent telemetry:", err));
  }, [deviceId]);

  // Open WebSocket for live telemetry
  useEffect(() => {
    const wsUrl = `${API_URL.replace(/^https/, "wss")}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      // Register device
      ws.send(JSON.stringify({ type: "register", device_id: deviceId }));
    });

    ws.addEventListener("close", () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    });

    ws.addEventListener("error", (err) => {
      console.error("WebSocket error:", err);
      setWsConnected(false);
    });

    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "telemetry") setTelemetry(msg.data);
      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    });

    return () => ws.close();
  }, [deviceId]);

  // Send fan speed command
  const sendCommand = async (value: number) => {
    setSpeed(value);
    try {
      await fetch(`${API_URL}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          command_type: "set_fan_speed",
          payload: { speed: value },
        }),
      });
    } catch (err) {
      console.error("Failed to send command:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1rem",
        backgroundColor: "#0f172a",
        color: "#f1f5f9",
      }}
    >
      <div
        style={{ maxWidth: "480px", margin: "0 auto", padding: "1.5rem 1rem" }}
      >
        <h1
          style={{
            color: "#0ea5e9",
            textAlign: "center",
            marginBottom: "1rem",
          }}
        >
          AC Controller
        </h1>
        <p style={{ textAlign: "center", color: "#94a3b8" }}>
          Device: {deviceId}
        </p>

        {/* Connection Status */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            margin: "1rem 0",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: wsConnected ? "#10b981" : "#ef4444",
              animation: wsConnected ? "pulse 2s infinite" : "none",
            }}
          />
          <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
            {wsConnected ? "Live data connected" : "Connecting..."}
          </span>
        </div>

        {/* Telemetry Card */}
        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(30,41,59,0.8)",
            borderRadius: 20,
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ color: "#7dd3fc", marginBottom: "1rem" }}>
            📊 Live Telemetry
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: "0.75rem",
            }}
          >
            {/* Temperature */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #0ea5e9",
              }}
            >
              <small style={{ color: "#94a3b8" }}>🌡️ Temp</small>
              <div
                style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600 }}
              >
                {telemetry?.temperature ?? "—"}°C
              </div>
            </div>
            {/* Humidity */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #10b981",
              }}
            >
              <small style={{ color: "#94a3b8" }}>💧 Humidity</small>
              <div
                style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600 }}
              >
                {telemetry?.humidity ?? "—"}%
              </div>
            </div>
            {/* Fan RPM */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <small style={{ color: "#94a3b8" }}>🌀 RPM</small>
              <div
                style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600 }}
              >
                {telemetry?.fan_rpm ?? "—"}
              </div>
            </div>
            {/* Last Update */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #8b5cf6",
              }}
            >
              <small style={{ color: "#94a3b8" }}>⏱️ Updated</small>
              <div style={{ color: "#fff", fontSize: "0.75rem" }}>
                {telemetry?.received_at
                  ? new Date(telemetry.received_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Fan Control */}
        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(30,41,59,0.8)",
            borderRadius: 20,
            padding: "1.5rem",
          }}
        >
          <h2 style={{ color: "#7dd3fc", marginBottom: "1rem" }}>
            🎛️ Speed Control
          </h2>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div
              style={{ fontSize: "3rem", fontWeight: 800, color: "#0ea5e9" }}
            >
              {speed}
            </div>
            <div style={{ color: "#94a3b8" }}>Current Speed Level</div>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            value={speed}
            onChange={(e) => {
              const value = Number(e.target.value);
              setSpeed(value);
              clearTimeout((window as any).speedTimeout);
              (window as any).speedTimeout = setTimeout(
                () => sendCommand(value),
                300,
              );
            }}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
