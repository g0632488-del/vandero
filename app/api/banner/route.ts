import { NextResponse } from "next/server";
import { DEFAULT_BANNER_URL } from "@/app/lib/portfolio";

const extractContent = (html: string, pattern: RegExp): string | null => {
  const match = pattern.exec(html);
  if (!match) return null;
  return match[1].trim() || null;
};

const resolveUrl = (value: string, base: string) => {
  try {
    return new URL(value, base).toString();
  } catch {
    return value;
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const response = await fetch(target, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VanderoBot/1.0",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch host page");
    }
    const html = await response.text();

    const banner =
      extractContent(
        html,
        /<meta[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/i
      ) ??
      extractContent(
        html,
        /<link[^>]*rel=["'](?:image_src|preload)["'][^>]*href=["']([^"']+)["'][^>]*>/i
      ) ??
      DEFAULT_BANNER_URL;

    const title =
      extractContent(
        html,
        /<meta[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*content=["']([^"']+)["'][^>]*>/i
      ) ??
      extractContent(html, /<title[^>]*>([^<]+)<\/title>/i) ??
      "";

    const description =
      extractContent(
        html,
        /<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]*content=["']([^"']+)["'][^>]*>/i
      ) ??
      "";

    return NextResponse.json({
      banner: resolveUrl(banner, target),
      title,
      description,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to scrape metadata from the target page." },
      { status: 500 }
    );
  }
}
