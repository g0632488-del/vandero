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
    "We are a dynamic parent company that owns and operates a diverse portfolio of innovative shops and professional services. Our mission is to deliver exceptional value across multiple industries, from retail excellence to cutting-edge business solutions. Each of our ventures is carefully curated to meet the evolving needs of modern consumers and businesses.",
  background_color: "#F3F4F6",
  surface_color: "#0F172A",
  text_color: "#0F172A",
  primary_action_color: "#0D9488",
  secondary_action_color: "#4F46E5",
};

type LivePreviewProps = {
  url: string;
  title: string;
  hasUrl: boolean;
};

const LivePreview = ({ url, title, hasUrl }: LivePreviewProps) => (
  <div className="shop-live-frame" data-empty={(!hasUrl).toString()}>
    <iframe
      src={hasUrl ? url : DEFAULT_BANNER_URL}
      title={`Preview of ${title}`}
      loading="lazy"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      scrolling="no"
      referrerPolicy="no-referrer-when-downgrade"
    />
    {!hasUrl && (
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

export default function Home() {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const entries = [
    ...portfolio.shops.map((item) => ({ ...item, type: "shop" as const })),
    ...portfolio.services.map((item) => ({ ...item, type: "service" as const })),
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncPortfolio = () => {
      setPortfolio(readPortfolio());
    };

    const prime = async () => {
      const serverPortfolio = await fetchServerPortfolio();
      if (serverPortfolio) {
        setPortfolio(serverPortfolio);
      } else {
        syncPortfolio();
      }
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
        className="hero"
        id="hero"
        style={{
          background: `linear-gradient(135deg, ${defaultConfig.surface_color} 0%, ${defaultConfig.primary_action_color} 100%)`,
        }}
      >
        <div className="container">
          <div className="hero-inline hero-minimal reveal">
            <div className="hero-copy">
              <div className="hero-logo-wrap floaty">
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

      <section className="section-shell" id="about">
        <div className="container">
          <div className="section-card reveal">
            <h2>About Us</h2>
            <div className="about-grid">
              <div className="about-copy reveal">
                <p id="company-description">{defaultConfig.company_description}</p>
                <ul className="feature-list">
                  <li>Multi-disciplinary retail and services portfolio.</li>
                  <li>Human-centered experiences powered by data.</li>
                  <li>Global sourcing with local stewardship.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell" id="shops">
        <div className="container">
          <div className="section-card shops-card reveal">
            <h2 className="section-title reveal">Our Shops & Services</h2>
            <div className="shops-grid">
              {entries.map((entry) => (
                <a
                  key={`${entry.type}-${entry.id}`}
                  className="shop-card reveal"
                  href={entry.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${entry.name}`}
                >
                  <LivePreview
                    url={entry.url || DEFAULT_BANNER_URL}
                    title={entry.name}
                    hasUrl={Boolean(entry.url)}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner reveal">
          <p className="footer-copy">© 2025. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

