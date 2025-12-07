"use server";

import { DEFAULT_PORTFOLIO, Portfolio } from "@/app/lib/portfolio";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "portfolio.json");

let portfolioStore: Portfolio | null = null;

const isPortfolio = (value: unknown): value is Portfolio => {
  if (
    !value ||
    typeof value !== "object" ||
    !("shops" in value) ||
    !("services" in value)
  ) {
    return false;
  }
  const payload = value as Portfolio;
  return (
    Array.isArray(payload.shops) &&
    Array.isArray(payload.services)
  );
};

const ensureStoreLoaded = async () => {
  if (portfolioStore) return portfolioStore;
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (isPortfolio(parsed)) {
      portfolioStore = parsed;
      return portfolioStore;
    }
  } catch {
    // ignore missing or invalid file; fall back to default
  }
  portfolioStore = DEFAULT_PORTFOLIO;
  return portfolioStore;
};

const persistStore = async (portfolio: Portfolio) => {
  portfolioStore = portfolio;
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(portfolio, null, 2), "utf-8");
  } catch {
    // If persistence fails, keep the in-memory store so the current session still works.
  }
};

export async function GET() {
  const current = await ensureStoreLoaded();
  return Response.json(current);
}

export async function POST(request: Request) {
  try {
    const incoming = (await request.json()) as unknown;
    if (!isPortfolio(incoming)) {
      return new Response("Invalid payload", { status: 400 });
    }
    await persistStore(incoming);
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
}
