"use server";

import { DEFAULT_PORTFOLIO, Portfolio } from "@/app/lib/portfolio";

let portfolioStore: Portfolio = DEFAULT_PORTFOLIO;

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

export async function GET() {
  return Response.json(portfolioStore);
}

export async function POST(request: Request) {
  try {
    const incoming = (await request.json()) as unknown;
    if (!isPortfolio(incoming)) {
      return new Response("Invalid payload", { status: 400 });
    }
    portfolioStore = incoming;
    return new Response("ok", { status: 200 });
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
}
