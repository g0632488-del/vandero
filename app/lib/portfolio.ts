export const PORTFOLIO_STORAGE_KEY = "vandero-portfolio";
export const PORTFOLIO_EVENT = "vandero-portfolio-update";

export interface PortfolioItem {
  id: number;
  name: string;
  description: string;
  icon?: string;
  url: string;
  bannerUrl?: string;
}

export interface Portfolio {
  shops: PortfolioItem[];
  services: PortfolioItem[];
}

export const DEFAULT_BANNER_URL =
  "https://images.unsplash.com/photo-1522199670076-2852f80289c3?auto=format&fit=crop&w=1200&q=80";

const defaultShops: PortfolioItem[] = [
  {
    id: 1,
    icon: "SHOP",
    name: "Premium Footwear",
    description:
      "Curated collection of high-quality shoes from around the world. From casual comfort to luxury fashion, find your perfect pair.",
    url: "https://www.nike.com/",
    bannerUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: 2,
    icon: "TOOLS",
    name: "Pro Tools & Equipment",
    description:
      "Professional-grade imported tools and equipment for contractors, craftsmen, and DIY enthusiasts. Quality you can trust.",
    url: "https://www.harborfreight.com/",
    bannerUrl:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1100&q=80",
  },
];

const defaultServices: PortfolioItem[] = [
  {
    id: 1,
    icon: "GROW",
    name: "Trading Solutions",
    description:
      "Expert financial market trading services with advanced analytics and personalized investment strategies.",
    url: "https://www.investopedia.com/",
    bannerUrl:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: 2,
    icon: "WEB",
    name: "Web Development",
    description:
      "Custom business websites and digital solutions that drive growth and enhance your online presence.",
    url: "https://www.smashingmagazine.com/",
    bannerUrl:
      "https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?auto=format&fit=crop&w=1100&q=80",
  },
  {
    id: 3,
    icon: "HOME",
    name: "Real Estate",
    description:
      "Comprehensive real estate services for buying, selling, and renting properties with expert market guidance.",
    url: "https://www.architecturaldigest.com/",
    bannerUrl:
      "https://images.unsplash.com/photo-1450641068570-4f7b5d3c1d33?auto=format&fit=crop&w=1100&q=80",
  },
];

export const DEFAULT_PORTFOLIO: Portfolio = {
  shops: defaultShops,
  services: defaultServices,
};

const parsePortfolio = (value: string | null): Portfolio | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      Array.isArray(parsed.shops) &&
      Array.isArray(parsed.services)
    ) {
      return parsed;
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
};

const normalizePortfolio = (value: Portfolio): Portfolio => ({
  shops: value.shops.map((shop) => ({
    ...shop,
    icon: shop.icon ?? "SHOP",
    bannerUrl: shop.bannerUrl ?? DEFAULT_BANNER_URL,
    url: shop.url ?? "",
  })),
  services: value.services.map((service) => ({
    ...service,
    icon: service.icon ?? "SERVICE",
    bannerUrl: service.bannerUrl ?? DEFAULT_BANNER_URL,
    url: service.url ?? "",
  })),
});

export function readPortfolio(): Portfolio {
  if (typeof window === "undefined") {
    return DEFAULT_PORTFOLIO;
  }

  const stored = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  const parsed = parsePortfolio(stored);
  return parsed ? normalizePortfolio(parsed) : DEFAULT_PORTFOLIO;
}

export function persistPortfolio(portfolio: Portfolio) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(portfolio)
    );
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(
    new CustomEvent(PORTFOLIO_EVENT, {
      detail: portfolio,
    })
  );
}
