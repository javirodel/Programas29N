import { ImageResponse } from "next/og";

export const alt = "Programa29N — Consulta y compara los 20 programas electorales del 29N";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const SPECTRUM_STRIP = [
  "#0055a4",
  "#c8102e",
  "#4e9a26",
  "#be185d",
  "#f59e0b",
  "#047857",
  "#0284c7",
  "#c2410c",
  "#6d28d9",
];

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#141d33",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Franja superior simbólica del hemiciclo */}
      <div style={{ display: "flex", width: "100%", height: "12px" }}>
        {SPECTRUM_STRIP.map((color) => (
          <div key={color} style={{ flex: 1, height: "100%", backgroundColor: color }} />
        ))}
      </div>

      {/* Núcleo central minimalista (legible tanto a pantalla completa como en miniatura cuadrada de WhatsApp) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 64px",
          gap: "24px",
        }}
      >
        {/* Emblema / Monograma */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "170px",
            height: "170px",
            borderRadius: "36px",
            backgroundColor: "#1e2c4f",
            border: "3px solid #3b538a",
            fontSize: "74px",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#ffffff",
          }}
        >
          29N
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "58px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Programa29N
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              fontWeight: 500,
              color: "#cbd5e1",
            }}
          >
            Programas electorales · Comparador · Test de afinidad
          </div>
        </div>

        {/* Píldora limpia de métricas reales */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            backgroundColor: "#1e2c4f",
            border: "2px solid #2f4270",
            borderRadius: "999px",
            padding: "12px 28px",
            fontSize: "22px",
            fontWeight: 700,
            color: "#93c5fd",
          }}
        >
          <span>20 programas</span>
          <span style={{ color: "#64748b" }}>·</span>
          <span>5.681 medidas</span>
          <span style={{ color: "#64748b" }}>·</span>
          <span>100% PDF original</span>
        </div>
      </div>

      {/* Pie discreto */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: "28px",
          fontSize: "20px",
          fontWeight: 600,
          color: "#94a3b8",
          letterSpacing: "0.02em",
        }}
      >
        programa29n.app
      </div>
    </div>,
    {
      ...size,
    },
  );
}
