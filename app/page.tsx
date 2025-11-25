"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BANNER_URL,
  DEFAULT_PORTFOLIO,
  PORTFOLIO_EVENT,
  readPortfolio,
} from "./lib/portfolio";

const defaultConfig = {
  company_name: "Vandero",
  company_tagline: "Iconic ventures built for modern experiences",
  company_description:
    "We are a dynamic parent company that owns and operates a diverse portfolio of innovative shops and professional services. Our mission is to deliver exceptional value across multiple industries, from retail excellence to cutting-edge business solutions. Each of our ventures is carefully curated to meet the evolving needs of modern consumers and businesses.",
  background_color: "#F4EDE2",
  surface_color: "#3E3E3E",
  text_color: "#3E3E3E",
  primary_action_color: "#6A92B2",
  secondary_action_color: "#8A9A5B",
};

const runFadeIn = () => {
  const elements = Array.from(document.querySelectorAll(".fade-in"));
  const elementVisible = 150;
  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("visible");
    }
  });
};

type LivePreviewProps = {
  url: string;
  title: string;
};

const LivePreview = ({ url, title }: LivePreviewProps) => (
  <div className="shop-live-frame">
    <iframe
      src={url}
      title={`Preview of ${title}`}
      loading="lazy"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      scrolling="no"
      referrerPolicy="no-referrer-when-downgrade"
    />
    <div className="shop-live-label">
      <span>{title}</span>
      <span className="shop-live-open">Open ↗</span>
    </div>
  </div>
);

export default function Home() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const entries = [
    ...portfolio.shops.map((item) => ({ ...item, type: "shop" as const })),
    ...portfolio.services.map((item) => ({ ...item, type: "service" as const })),
  ];

  useEffect(() => {
    runFadeIn();
    window.addEventListener("scroll", runFadeIn, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", runFadeIn);
  }, []);

  useEffect(() => {
    runFadeIn();
  }, [portfolio.shops.length, portfolio.services.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const syncPortfolio = () => {
      setPortfolio(readPortfolio());
    };
    syncPortfolio();
    window.addEventListener(PORTFOLIO_EVENT, syncPortfolio);
    return () => window.removeEventListener(PORTFOLIO_EVENT, syncPortfolio);
  }, []);

  return (
    <main className="page">
      <section
        className="hero"
        style={{
          background: `linear-gradient(135deg, ${defaultConfig.surface_color} 0%, ${defaultConfig.primary_action_color} 100%)`,
        }}
      >
        <div className="container">
          <div className="logo-placeholder" aria-hidden="true">
            <svg
              className="vandero-icon"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="vGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: "#1e293b" }} />
                  <stop offset="100%" style={{ stopColor: "#475569" }} />
                </linearGradient>
              </defs>
              <path
                d="M8 8 L24 36 L40 8 L32 8 L24 24 L16 8 Z"
                fill="url(#vGradient)"
              />
              <rect
                x="6"
                y="6"
                width="36"
                height="36"
                rx="8"
                stroke="#64748b"
                strokeWidth="1"
                fill="none"
                opacity="0.3"
              />
            </svg>
          </div>
          <h1 id="company-name">{defaultConfig.company_name}</h1>
          <p id="company-tagline">{defaultConfig.company_tagline}</p>
        </div>
      </section>

      <section className="shops">
        <div className="container">
          <h2 className="section-title">Our Shops & Services</h2>
          <div className="shops-grid">
            {entries.map((entry) => (
              <a
                key={`${entry.type}-${entry.id}`}
                className="shop-card fade-in"
                href={entry.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit ${entry.name}`}
              >
                <LivePreview url={entry.url || DEFAULT_BANNER_URL} title={entry.name} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="about">
        <div className="container">
          <h2>About Us</h2>
          <div className="about-grid">
            <div className="about-copy">
              <p id="company-description">{defaultConfig.company_description}</p>
              <ul className="feature-list">
                <li>Multi-disciplinary retail and services portfolio.</li>
                <li>Human-centered experiences powered by data.</li>
                <li>Global sourcing with local stewardship.</li>
              </ul>
            </div>
            <div className="about-highlight-card">
              <div className="highlight-text">
                <span>Crafting futures since</span>
                <strong>2012</strong>
              </div>
              <div className="highlight-stats">
                <div>
                  <strong>24</strong>
                  <span>markets</span>
                </div>
                <div>
                  <strong>12</strong>
                  <span>shops</span>
                </div>
                <div>
                  <strong>6</strong>
                  <span>service studios</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
