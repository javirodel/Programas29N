import { ImageResponse } from "next/og";

export const alt = "Programa29N — Consulta y compara los 20 programas electorales del 29N";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#fafafa",
        color: "#141414",
        padding: "56px 64px",
        borderTop: "14px solid #19233c",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Cabecera superior */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#19233c",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              padding: "10px 20px",
              borderRadius: "6px",
            }}
          >
            29N
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              fontWeight: 700,
              color: "#3b3b3b",
            }}
          >
            Elecciones generales · 29 de noviembre
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#eef2ff",
            color: "#1e40af",
            border: "2px solid #c7d2fe",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          programa29n.app
        </div>
      </div>

      {/* Bloque central */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "58px",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#141414",
          }}
        >
          Programa29N — Consulta y compara los 20 programas electorales
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            lineHeight: 1.4,
            color: "#3b3b3b",
            maxWidth: "980px",
          }}
        >
          Medidas literales con cita y enlace a la página exacta del PDF original, comparador frente
          a frente y test de afinidad neutral.
        </div>
      </div>

      {/* Pie con métricas reales del corpus */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "2px solid #e2e2e2",
          paddingTop: "28px",
        }}
      >
        <div style={{ display: "flex", gap: "28px", fontSize: "22px", fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#1e40af",
              }}
            />
            <span>20 candidaturas oficiales</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#166534",
              }}
            />
            <span>5.681 medidas indexadas</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: "#19233c",
              }}
            />
            <span>Trazabilidad 100% al PDF</span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
