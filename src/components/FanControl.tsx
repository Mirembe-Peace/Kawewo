/* eslint-disable react-hooks/refs */
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
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // fetch recent telemetry
    fetch(
      `${API_URL}/telemetry/recent?device_id=${deviceId}&limit=1`
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.rows && d.rows.length) setTelemetry(d.rows[0]);
      })
      .catch(() => {});

    // open websocket to receive live telemetry
    const wsUrl = API_URL.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
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
    await fetch(`${API_URL}/command`, {
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
        minHeight: "100vh",
        padding: "1rem",
        backgroundColor: "rgba(15, 23, 42, 1)",
        color: "#f1f5f9",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          padding: "1.5rem 1rem",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1
            style={{
              color: "#0EA5E9",
              fontSize: "1.75rem",
              fontWeight: "700",
              marginBottom: "0.25rem",
              textShadow: "0 2px 10px rgba(14, 165, 233, 0.3)",
            }}
          >
            AC Controller
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
            Device: {deviceId}
          </p>
        </div>

        {/* Connection Status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem",
            padding: "0.75rem",
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor:
                wsRef.current?.readyState === WebSocket.OPEN
                  ? "#10b981"
                  : "#ef4444",
              animation:
                wsRef.current?.readyState === WebSocket.OPEN
                  ? "pulse 2s infinite"
                  : "none",
            }}
          />
          <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>
            {wsRef.current?.readyState === WebSocket.OPEN
              ? "Live data connected"
              : "Connecting..."}
          </span>
        </div>

        {/* Telemetry Card */}
        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              color: "#7dd3fc",
              marginBottom: "1.25rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📊 Live Telemetry
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: "12px",
                borderLeft: "4px solid #0ea5e9",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                🌡️ Temp
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  lineHeight: "1",
                }}
              >
                {telemetry?.temperature ?? "—"}°C
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: "12px",
                borderLeft: "4px solid #10b981",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                💧 Humidity
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  lineHeight: "1",
                }}
              >
                {telemetry?.humidity ?? "—"}%
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: "12px",
                borderLeft: "4px solid #f59e0b",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                🌀 RPM
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  lineHeight: "1",
                }}
              >
                {telemetry?.fan_rpm ?? "—"}
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                borderRadius: "12px",
                borderLeft: "4px solid #8b5cf6",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                ⏱️ Updated
              </div>
              <div
                style={{
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  lineHeight: "1.2",
                }}
              >
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

        {/* Control Card */}
        <div
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            borderRadius: "20px",
            padding: "1.5rem",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          }}
        >
          <h2
            style={{
              color: "#7dd3fc",
              marginBottom: "1.25rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            🎛️ Speed Control
          </h2>

          {/* Speed Display */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              padding: "1.5rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "16px",
              border: "2px solid rgba(14, 165, 233, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: "800",
                color: "#0ea5e9",
                textShadow: "0 0 30px rgba(14, 165, 233, 0.5)",
                lineHeight: "1",
                marginBottom: "0.5rem",
              }}
            >
              {speed}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Current Speed Level
            </div>
          </div>

          {/* Slider */}
          <div style={{ marginBottom: "2rem" }}>
            <input
              type="range"
              min={0}
              max={5}
              value={speed}
              onChange={(e) => {
                const value = Number(e.target.value);
                setSpeed(value);
                // Debounce the command sending
                clearTimeout((window as any).speedTimeout);
                (window as any).speedTimeout = setTimeout(() => {
                  sendCommand(value);
                }, 300);
              }}
              style={{
                width: "100%",
                height: "16px",
                WebkitAppearance: "none",
                appearance: "none",
                background: "rgba(30, 41, 59, 0.8)",
                borderRadius: "8px",
                outline: "none",
                cursor: "pointer",
                padding: "0 4px",
              }}
            />
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "16px",
                marginTop: "-16px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  right: "0",
                  height: "100%",
                  background: `linear-gradient(to right, #0ea5e9 ${(speed / 5) * 100}%, transparent ${(speed / 5) * 100}%)`,
                  borderRadius: "8px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "0.75rem",
                padding: "0 0.25rem",
              }}
            >
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor:
                        speed >= num ? "#0ea5e9" : "rgba(148, 163, 184, 0.3)",
                    }}
                  />
                  <span
                    style={{
                      color: speed === num ? "#0ea5e9" : "#94a3b8",
                      fontWeight: speed === num ? "600" : "400",
                      fontSize: "0.75rem",
                    }}
                  >
                    {num}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Controls */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.75rem",
            }}
          >
            {[
              { value: 0, label: "Off", icon: "🛑", color: "#ef4444" },
              { value: 2, label: "Low", icon: "🌬️", color: "#0ea5e9" },
              { value: 5, label: "High", icon: "💨", color: "#8b5cf6" },
            ].map(({ value, label, icon, color }) => (
              <button
                key={value}
                onClick={() => sendCommand(value)}
                style={{
                  padding: "1rem 0.5rem",
                  backgroundColor:
                    speed === value
                      ? `${color}20`
                      : "rgba(255, 255, 255, 0.05)",
                  border: `2px solid ${speed === value ? color : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "12px",
                  color: speed === value ? color : "#cbd5e1",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  touchAction: "manipulation",
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>{icon}</span>
                <div>
                  <div>{label}</div>
                  <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                    {value}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Preset Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            {[
              { value: 1, label: "Sleep", icon: "😴" },
              { value: 3, label: "Auto", icon: "🤖" },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => sendCommand(value)}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  color: "#cbd5e1",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            color: "#64748b",
            fontSize: "0.75rem",
            padding: "1rem",
          }}
        >
          <p>Drag slider or tap buttons to adjust fan speed</p>
          <p style={{ marginTop: "0.25rem", opacity: 0.7 }}>
            Updates are sent automatically
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0ea5e9;
          border: 3px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.8);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(14, 165, 233, 1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0ea5e9;
          border: 3px solid rgba(255, 255, 255, 0.9);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.8);
        }
        
        @media (min-width: 768px) {
          div[style*="maxWidth: '480px'"] {
            max-width: 720px;
            padding: 2rem;
          }
          
          div[style*="gridTemplateColumns: 'repeat(2, 1fr)'"] {
            grid-template-columns: repeat(4, 1fr);
          }
          
          div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            gap: 1rem;
          }
          
          div[style*="display: 'grid'][style*="gridTemplateColumns: 'repeat(2, 1fr)'"] {
            grid-template-columns: repeat(4, 1fr);
          }
          
          button {
            padding: 1rem !important;
          }
        }
        
        @media (min-width: 1024px) {
          div[style*="maxWidth: '480px'"] {
            max-width: 900px;
          }
          
          div[style*="display: 'grid'][style*="gridTemplateColumns: 'repeat(2, 1fr)'"] {
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
