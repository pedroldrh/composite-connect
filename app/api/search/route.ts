import { NextResponse } from "next/server";

/**
 * POST /api/search
 * Proxies search queries to Serper.dev so the API key stays server-side.
 *
 * Body: { query: string }
 * Returns: { results: SerperResult[] }
 */

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperOrganic[];
}

export async function POST(request: Request) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "SERPER_API_KEY not configured", results: [] },
      { status: 200 } // Return 200 with empty results so client falls back gracefully
    );
  }

  let body: { query: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", results: [] }, { status: 400 });
  }

  if (!body.query || typeof body.query !== "string") {
    return NextResponse.json({ error: "Missing query", results: [] }, { status: 400 });
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: body.query,
        num: 10,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Serper API error:", response.status, text);

      // Serper returns 429 or 402 when credits are exhausted
      if (response.status === 429 || response.status === 402) {
        return NextResponse.json(
          { error: "quota_exhausted", results: [] },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "Search API error", results: [] }, { status: 200 });
    }

    const data: SerperResponse = await response.json();
    return NextResponse.json({ results: data.organic ?? [] });
  } catch (err) {
    console.error("Search proxy error:", err);
    return NextResponse.json({ error: "Search failed", results: [] }, { status: 200 });
  }
}
