import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "CompositeConnect — Scan fraternity composites, find LinkedIn profiles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.06) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Icon row — 3 silhouettes */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 40,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex",
              }}
            />
          ))}
          {/* Magnifying glass accent */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: -12,
              marginTop: 20,
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            in
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f5f5f5",
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          CompositeConnect
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
            marginTop: 16,
            display: "flex",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Scan a fraternity composite. Find every LinkedIn profile.
        </div>
      </div>
    ),
    { ...size }
  );
}
