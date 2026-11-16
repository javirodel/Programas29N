import { ImageResponse } from "next/og";

export const alt = "29N · Programas Electorales";
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
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1e40af",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "520px",
          height: "520px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "104px",
          border: "12px solid rgba(255, 255, 255, 0.24)",
          backgroundColor: "#1e40af",
          color: "#ffffff",
          fontSize: "210px",
          fontWeight: 800,
          letterSpacing: "-0.04em",
        }}
      >
        29N
      </div>
    </div>,
    {
      ...size,
    },
  );
}
