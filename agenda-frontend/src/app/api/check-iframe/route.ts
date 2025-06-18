// app/api/check-iframe/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    // Perform a HEAD request server-side (no CORS restrictions)
    const res = await fetch(url, { method: "HEAD" });
    const frameOptions = res.headers.get("x-frame-options") || "";
    const csp         = res.headers.get("content-security-policy") || "";

    const blocked =
      frameOptions.toLowerCase().includes("deny") ||
      frameOptions.toLowerCase().includes("sameorigin") ||
      csp.toLowerCase().includes("frame-ancestors");

    return NextResponse.json({ blocked });
  } catch (err) {
    // Network error or other issue — assume blocked
    return NextResponse.json({ blocked: true });
  }
}
