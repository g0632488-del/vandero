"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BANNER_URL,
  DEFAULT_PORTFOLIO,
  PORTFOLIO_EVENT,
  fetchServerPortfolio,
  readPortfolio,
} from "./lib/portfolio";

const defaultConfig = {
  company_name: "",
  company_tagline: "",
  company_description:
    "We run a tight group of shops and services, focused on useful products, dependable support, and clear outcomes.",
  background_color: "#F3F4F6",
  surface_color: "#0F172A",
  text_color: "#0F172A",
  primary_action_color: "#0D9488",
  secondary_action_color: "#4F46E5",
};

const LightningIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g className="lightning-bolt">
      <path
        d="M36 8L20 34H32L28 56L44 30H32L36 8Z"
        fill="#fbbf24"
        stroke="#f59e0b"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M34 8L24 34H32L30 48L40 30H32L34 8Z" fill="#fef3c7" opacity="0.6" />
    </g>
    <circle cx="38" cy="12" r="2" fill="#fbbf24" opacity="0.8" />
    <circle cx="42" cy="18" r="1.5" fill="#fbbf24" opacity="0.6" />
    <circle cx="26" cy="50" r="2" fill="#fbbf24" opacity="0.8" />
    <circle cx="22" cy="44" r="1.5" fill="#fbbf24" opacity="0.6" />
  </svg>
);

const SliderIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="16" y1="20" x2="48" y2="20" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
    <g className="slider-knob">
      <circle cx="28" cy="20" r="6" fill="#10b981" stroke="#059669" strokeWidth="2" />
    </g>
    <line x1="16" y1="32" x2="48" y2="32" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
    <circle cx="38" cy="32" r="6" fill="#10b981" stroke="#059669" strokeWidth="2" />
    <line x1="16" y1="44" x2="48" y2="44" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
    <circle cx="24" cy="44" r="6" fill="#10b981" stroke="#059669" strokeWidth="2" />
    <path d="M36 32L38 34L41 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GrowthIcon = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="12" y1="52" x2="52" y2="52" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
    <rect className="growth-bar" x="16" y="38" width="8" height="14" rx="2" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" />
    <rect className="growth-bar" x="28" y="28" width="8" height="24" rx="2" fill="#a78bfa" stroke="#7c3aed" strokeWidth="2" />
    <rect className="growth-bar" x="40" y="16" width="8" height="36" rx="2" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="2" />
    <path d="M48 18L52 14L56 18" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="52" y1="14" x2="52" y2="26" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

type LivePreviewProps = {
  url: string;
  title: string;
  hasUrl: boolean;
  bannerUrl?: string;
};

const LivePreview = ({ url, title, hasUrl, bannerUrl }: LivePreviewProps) => {
  const cover = bannerUrl || DEFAULT_BANNER_URL || url;
  return (
    <div
      className="shop-live-frame"
      data-empty={(!hasUrl).toString()}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.8) 100%), url(${cover})`,
      }}
    >
      {hasUrl ? (
        <iframe
          src={url}
          title={`Live preview of ${title}`}
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          scrolling="no"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="shop-placeholder" aria-hidden="true">
          <span>{title}</span>
        </div>
      )}
      <div className="shop-live-label">
        <span>{title}</span>
        <span className="shop-live-open">Open &rarr;</span>
      </div>
    </div>
  );
};

export default function Home() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);

  const highlights = [
    { title: "Built to launch fast", copy: "Each shop and service ships with what you need on day one.", icon: <LightningIcon /> },
    { title: "Simple to run", copy: "Clear pricing, direct support, and live previews for every link.", icon: <SliderIcon /> },
    { title: "Always improving", copy: "We keep tuning the catalog so it stays lean and useful.", icon: <GrowthIcon /> },
  ];

  const normalizeUrl = (value: string) => {
    if (!value) return "";
    try {
      const parsed = new URL(value);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return value.trim();
    }
  };

  const dedupeEntries = (
    entries: Array<{
      id: number;
      name: string;
      description?: string;
      icon?: string;
      url: string;
      bannerUrl?: string;
      type: "shop" | "service";
    }>
  ) => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      const key = entry.url ? normalizeUrl(entry.url.toLowerCase()) : `${entry.type}-${entry.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const deriveHost = (url: string) => {
    if (!url) return "Offline";
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return host || url;
    } catch {
      return url;
    }
  };

  const filteredEntries = (() => {
    return dedupeEntries([
      ...portfolio.shops.map((item) => ({ ...item, type: "shop" as const })),
      ...portfolio.services.map((item) => ({ ...item, type: "service" as const })),
    ]);
  })();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const totalEntries = (value: typeof DEFAULT_PORTFOLIO) =>
      value.shops.length + value.services.length;

    const syncPortfolio = () => {
      setPortfolio(readPortfolio());
    };

    const prime = async () => {
      const localPortfolio = readPortfolio();
      const serverPortfolio = await fetchServerPortfolio();
      const nextPortfolio =
        serverPortfolio && totalEntries(serverPortfolio) >= totalEntries(localPortfolio)
          ? serverPortfolio
          : localPortfolio;
      setPortfolio(nextPortfolio);
    };

    prime();
    window.addEventListener(PORTFOLIO_EVENT, syncPortfolio);
    return () => window.removeEventListener(PORTFOLIO_EVENT, syncPortfolio);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entriesList, obs) => {
        entriesList.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const targets = Array.from(document.querySelectorAll(".reveal"));
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [portfolio.shops.length, portfolio.services.length]);

  return (
    <main className="page">
      <section
        className="hero landing-hero-shell"
        id="hero"
        style={{
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="container">
          <div className="landing-banner simple-banner reveal">
            <div className="banner-copy">
              <div className="hero-logo-wrap banner-logo">
                <div className="hero-glow" aria-hidden="true" />
                <img
                  className="hero-logo-plain"
                  src="/Corporate_Logo_Vandero_with_Geometric__V_-removebg-preview.png"
                  alt="Company logo"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-inner reveal">
          <span className="about-label">ABOUT</span>
          <h2 className="about-title">What we do, in one scroll.</h2>
          <p className="about-lede">
            We run a tight group of shops and services, focused on useful products, dependable support, and clear
            outcomes.
          </p>

          <div className="about-card-row">
            {highlights.map((item) => (
              <article key={item.title} className="about-feature-card">
                <div className="about-card-head">
                  <div className="about-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell" id="portfolio">
        <div className="container">
          <div className="section-card shops-card reveal">
            <div className="section-header">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h2 className="section-title reveal">Our Shops & Services</h2>
              </div>
            </div>
            <div className="portfolio-grid portfolio-grid--unified">
              {filteredEntries.length === 0 && (
                <p className="empty">No entries yet. Add a shop or service in the admin to see it here.</p>
              )}
              {filteredEntries.map((entry) => (
                <a
                  key={`${entry.type}-${entry.id}`}
                  className="portfolio-card reveal"
                  href={entry.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="portfolio-cover">
                    <LivePreview
                      url={entry.url || DEFAULT_BANNER_URL}
                      title={entry.name}
                      hasUrl={Boolean(entry.url)}
                      bannerUrl={entry.bannerUrl}
                    />
                    <span className="portfolio-chip">{entry.type === "shop" ? "Shop" : "Service"}</span>
                  </div>
                  <div className="portfolio-meta">
                    <div>
                      <h4>{entry.name}</h4>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" id="footer">
        <div className="container footer-inner reveal">
          <p className="footer-copy">© 2025. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

