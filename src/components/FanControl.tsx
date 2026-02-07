/* eslint-disable react-hooks/refs */
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
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // fetch recent telemetry
    fetch(
      "http://localhost:4000/telemetry/recent?device_id=" +
        deviceId +
        "&limit=1",
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.rows && d.rows.length) setTelemetry(d.rows[0]);
      })
      .catch(() => {});

    // open websocket to receive live telemetry
    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "register", device_id: deviceId }));
    });
    ws.addEventListener("message", (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "telemetry") setTelemetry(msg.data);
      } catch (e) {}
    });
    return () => ws.close();
  }, [deviceId]);

  const sendCommand = async (value: number) => {
    setSpeed(value);
    await fetch("http://localhost:4000/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        command_type: "set_fan_speed",
        payload: { speed: value },
      }),
    });
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "2rem auto",
        padding: "2rem",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(15, 23, 42, 0.7)",
        borderRadius: "24px",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        boxShadow:
          "0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        color: "#f1f5f9",
      }}
    >
      <h2
        style={{
          color: "#0EA5E9",
          textAlign: "center",
          marginBottom: "2rem",
          fontSize: "1.875rem",
          fontWeight: "700",
          textShadow: "0 2px 10px rgba(14, 165, 233, 0.3)",
        }}
      >
        AC Controller — Device {deviceId}
      </h2>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "2rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Telemetry Card */}
        <div
          style={{
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(30, 41, 59, 0.6)",
            borderRadius: "20px",
            padding: "1.75rem",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            minWidth: "280px",
            flex: 1,
          }}
        >
          <h3
            style={{
              color: "#7dd3fc",
              marginBottom: "1.5rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📊 Telemetry Data
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                borderLeft: "4px solid #0ea5e9",
              }}
            >
              <span
                style={{
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                🌡️ Temperature
              </span>
              <strong style={{ color: "#ffffff", fontSize: "1.25rem" }}>
                {telemetry?.temperature ?? "—"}°C
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                borderLeft: "4px solid #10b981",
              }}
            >
              <span
                style={{
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                💧 Humidity
              </span>
              <strong style={{ color: "#ffffff", fontSize: "1.25rem" }}>
                {telemetry?.humidity ?? "—"}%
              </strong>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.875rem",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <span
                style={{
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                🌀 Fan RPM
              </span>
              <strong style={{ color: "#ffffff", fontSize: "1.25rem" }}>
                {telemetry?.fan_rpm ?? "—"}
              </strong>
            </div>

            <div
              style={{
                padding: "0.875rem",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                borderRadius: "12px",
                borderLeft: "4px solid #8b5cf6",
              }}
            >
              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                ⏱️ Last Updated
              </div>
              <div style={{ color: "#ffffff", fontSize: "0.95rem" }}>
                {telemetry?.received_at
                  ? new Date(telemetry.received_at).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Control Card */}
        <div
          style={{
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(30, 41, 59, 0.6)",
            borderRadius: "20px",
            padding: "1.75rem",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            minWidth: "320px",
            flex: 1,
          }}
        >
          <h3
            style={{
              color: "#7dd3fc",
              marginBottom: "1.5rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            🎛️ Speed Control
          </h3>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "#0ea5e9",
                textShadow: "0 0 20px rgba(14, 165, 233, 0.5)",
                marginBottom: "1.5rem",
                height: "80px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {speed}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
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
                style={{
                  width: "100%",
                  height: "12px",
                  WebkitAppearance: "none",
                  appearance: "none",
                  background: "linear-gradient(to right, #0ea5e9, #a855f7)",
                  borderRadius: "10px",
                  outline: "none",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.75rem",
                  padding: "0 0.25rem",
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <small
                    key={num}
                    style={{
                      color: speed === num ? "#0ea5e9" : "#94a3b8",
                      fontWeight: speed === num ? "bold" : "normal",
                      fontSize: "0.875rem",
                    }}
                  >
                    {num}
                  </small>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                marginTop: "2rem",
              }}
            >
              {[0, 3, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => sendCommand(value)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor:
                      speed === value
                        ? "rgba(14, 165, 233, 0.2)"
                        : "rgba(255, 255, 255, 0.1)",
                    border: `2px solid ${speed === value ? "#0ea5e9" : "rgba(255, 255, 255, 0.2)"}`,
                    borderRadius: "12px",
                    color: speed === value ? "#0ea5e9" : "#cbd5e1",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(14, 165, 233, 0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      speed === value
                        ? "rgba(14, 165, 233, 0.2)"
                        : "rgba(255, 255, 255, 0.1)")
                  }
                >
                  {value === 0 ? "🛑" : value === 3 ? "🌬️" : "💨"}
                  Speed {value}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "0.875rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                wsRef.current?.readyState === WebSocket.OPEN
                  ? "#10b981"
                  : "#ef4444",
            }}
          />
          {wsRef.current?.readyState === WebSocket.OPEN
            ? "Connected"
            : "Disconnected"}
        </div>
      </div>
    </div>
  );
}
