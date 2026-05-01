import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

export const alt =
  "CompositeConnect — Scan fraternity composites, find LinkedIn profiles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const logoPath = join(process.cwd(), "public", "icon-512.png");
  const logoBase64 = `data:image/png;base64,${readFileSync(logoPath).toString(
    "base64"
  )}`;

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
          backgroundImage:
            "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.07) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: "white",
            borderRadius: 36,
            padding: 32,
            marginBottom: 40,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoBase64}
            width={220}
            height={220}
            style={{ display: "block" }}
            alt="CompositeConnect logo"
          />
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#f5f5f5",
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          CompositeConnect
        </div>

        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.62)",
            marginTop: 16,
            display: "flex",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Scan a fraternity composite. Find every LinkedIn profile.
        </div>
      </div>
    ),
    { ...size }
  );
}
