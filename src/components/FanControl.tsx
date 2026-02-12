import { API_URL } from "../config";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Telemetry = {
  device_id: string;
  temperature?: number;
  humidity?: number;
  voltage?: number;
  motion?: number;
  fan_speed?: number;
  fan_rpm?: number;
  received_at?: string;
  timestamp?: number;
};

export default function FanControl() {
  const [deviceId] = useState("esp01");
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Fetch recent telemetry once on mount
  useEffect(() => {
    fetch(`${API_URL}/telemetry/recent?device_id=${deviceId}&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rows && d.rows.length) setTelemetry(d.rows[0]);
      })
      .catch((err) => console.error("Failed to fetch recent telemetry:", err));
  }, [deviceId]);

  // Connect to Socket.IO for live telemetry
  useEffect(() => {
    // Connect to the NestJS server
    const socket = io(API_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket.IO connected");
      setWsConnected(true);
      
      // Register this client to receive updates for our device
      socket.emit("register", { device_id: deviceId });
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected");
      setWsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
      setWsConnected(false);
    });

    // Listen for telemetry events broadcast by the server
    socket.on("telemetry", (payload: { type: string; data: Telemetry }) => {
      if (payload.type === "telemetry") {
        setTelemetry(payload.data);
      }
    });

    return () => {
      socket.disconnect();
    };
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
        style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}
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
            {wsConnected ? "Live Socket.IO connected" : "Connecting..."}
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
                {telemetry?.temperature?.toFixed(1) ?? "—"}°C
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
                {telemetry?.humidity?.toFixed(1) ?? "—"}%
              </div>
            </div>
            {/* Voltage */}
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #f43f5e",
              }}
            >
              <small style={{ color: "#94a3b8" }}>⚡ Voltage</small>
              <div
                style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600 }}
              >
                {telemetry?.voltage?.toFixed(1) ?? "—"}V
              </div>
            </div>
             {/* Motion */}
             <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15,23,42,0.6)",
                borderRadius: 12,
                borderLeft: "4px solid #eab308",
              }}
            >
              <small style={{ color: "#94a3b8" }}>🚶 Motion</small>
              <div
                style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 600 }}
              >
                {telemetry?.motion === 1 ? "Yes" : "No"}
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
                      second: "2-digit"
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
            <div style={{ color: "#94a3b8" }}>Current Speed Level (0-255)</div>
          </div>
          <input
            type="range"
            min={0}
            max={255}
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
