"use client";

import { useState } from "react";

const peers = [
  {
    name: "Auth Node",
    color: "#22c55e",
    status: "Trusted",
    trust: "98%",
    latency: "Low",
    top: "18%",
    left: "20%",
  },
  {
    name: "Sync Peer",
    color: "#3b82f6",
    status: "Active",
    trust: "84%",
    latency: "Medium",
    top: "45%",
    left: "45%",
  },
  {
    name: "Relay Node",
    color: "#eab308",
    status: "Lagging",
    trust: "61%",
    latency: "High",
    top: "72%",
    left: "58%",
  },
  {
    name: "Unknown Peer",
    color: "#ef4444",
    status: "Suspicious",
    trust: "29%",
    latency: "Very High",
    top: "28%",
    left: "74%",
  },
  {
    name: "Storage Peer",
    color: "#22c55e",
    status: "Trusted",
    trust: "95%",
    latency: "Low",
    top: "75%",
    left: "25%",
  },
];

export default function SocialGraph() {
  const [activePeer, setActivePeer] = useState<string | null>(null);

  return (
    <div
      style={{
        background: "#020817",
        borderRadius: "28px",
        padding: "35px",
        marginTop: "60px",
        border: "1px solid #1e293b",
        color: "white",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "34px",
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        Interactive Peer Identity Social Graph
      </h2>

      <p
        style={{
          textAlign: "center",
          color: "#94a3b8",
          marginBottom: "20px",
          fontSize: "15px",
        }}
      >
        Real-time visualization of peer trust and network connectivity within ZerithDB ecosystems.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            background: "#111827",
            border: "1px solid #22c55e",
            color: "#22c55e",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            letterSpacing: "1px",
            boxShadow: "0 0 15px rgba(34,197,94,0.5)",
          }}
        >
          ● LIVE NETWORK
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "25px",
          fontSize: "14px",
        }}
      >
        <span>🟢 Trusted</span>
        <span>🔵 Active</span>
        <span>🟡 Lagging</span>
        <span>🔴 Suspicious</span>
      </div>

      <div
        style={{
          position: "relative",
          height: "550px",
          background: "#0f172a",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid #1e293b",
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <line x1="20%" y1="18%" x2="45%" y2="45%" stroke="#475569" strokeWidth="3" />

          <line x1="45%" y1="45%" x2="58%" y2="72%" stroke="#475569" strokeWidth="3" />

          <line x1="45%" y1="45%" x2="74%" y2="28%" stroke="#475569" strokeWidth="3" />

          <line x1="20%" y1="18%" x2="25%" y2="75%" stroke="#475569" strokeWidth="3" />
        </svg>

        {peers.map((peer) => (
          <div
            key={peer.name}
            title={`${peer.name}
Status: ${peer.status}
Trust Score: ${peer.trust}
Latency: ${peer.latency}`}
            onMouseEnter={() => setActivePeer(peer.name)}
            onMouseLeave={() => setActivePeer(null)}
            style={{
              position: "absolute",
              top: peer.top,
              left: peer.left,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "82px",
                height: "82px",
                borderRadius: "50%",
                background: peer.color,
                border: "3px solid rgba(255,255,255,0.2)",
                transition: "0.3s ease",
                transform: activePeer === peer.name ? "scale(1.15)" : "scale(1)",
                boxShadow:
                  activePeer === peer.name ? `0 0 60px ${peer.color}` : `0 0 30px ${peer.color}`,
                animation: peer.status === "Suspicious" ? "pulse 1.5s infinite" : "none",
              }}
            ></div>

            <div
              style={{
                marginTop: "12px",
                background: "#111827",
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #1e293b",
                minWidth: "120px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                {peer.name}
              </p>

              <p
                style={{
                  fontSize: "12px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                {peer.color === "#22c55e"
                  ? "🟢"
                  : peer.color === "#3b82f6"
                    ? "🔵"
                    : peer.color === "#eab308"
                      ? "🟡"
                      : "🔴"}{" "}
                {peer.status} • {peer.trust}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }

            50% {
              transform: scale(1.12);
              opacity: 0.85;
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
