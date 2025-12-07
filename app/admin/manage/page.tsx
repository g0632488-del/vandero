"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_BANNER_URL,
  DEFAULT_PORTFOLIO,
  Portfolio,
  PortfolioItem,
  PORTFOLIO_EVENT,
  persistPortfolio,
  persistServerPortfolio,
  readPortfolio,
} from "../../lib/portfolio";

const AUTH_FLAG = "vandero-admin-authorized";
const ADMIN_CODE = (process.env.NEXT_PUBLIC_ADMIN_CODE ?? "VANDERO-ADMIN").trim();
const collectionKey = (type: "shop" | "service"): keyof Portfolio =>
  type === "shop" ? "shops" : "services";
const isAuthorizedFromStorage = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(AUTH_FLAG) === ADMIN_CODE;

type LivePreviewProps = {
  url: string;
  title: string;
};

const LivePreview = ({ url, title }: LivePreviewProps) => {
  if (!url) return null;
  return (
    <div className="admin-live-frame">
      <iframe
        src={url}
        title={`Live preview of ${title}`}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        loading="lazy"
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

type CollectionCardProps = {
  type: "shop" | "service";
  item: PortfolioItem;
  onEdit: (type: "shop" | "service", item: PortfolioItem) => void;
  onDelete: (type: "shop" | "service", id: number) => void;
  deriveNameFromUrl: (value: string) => string;
};

const CollectionCard = ({
  type,
  item,
  onEdit,
  onDelete,
  deriveNameFromUrl,
}: CollectionCardProps) => (
  <article className="admin-preview-card">
    <div className="admin-preview-meta">
      <span className="admin-chip">{type === "shop" ? "Shop" : "Service"}</span>
      <h3>{item.name}</h3>
      <p className="admin-preview-copy">
        {item.description || "No description has been provided yet."}
      </p>
      <div className="admin-preview-footer">
        <span className="admin-url">{deriveNameFromUrl(item.url)}</span>
        <a
          className="admin-link"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          Open live
        </a>
      </div>
    </div>
    <LivePreview url={item.url} title={item.name} />
    <div className="admin-preview-actions">
      <button type="button" onClick={() => onEdit(type, item)}>
        Edit
      </button>
      <button type="button" onClick={() => onDelete(type, item.id)}>
        Delete
      </button>
    </div>
  </article>
);

export default function AdminManagePage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [shopUrl, setShopUrl] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [editingItem, setEditingItem] = useState<{
    type: "shop" | "service";
    item: PortfolioItem;
    url: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [shopFetching, setShopFetching] = useState(false);
  const [serviceFetching, setServiceFetching] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsAuthorized(isAuthorizedFromStorage());
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      if (isAuthorizedFromStorage()) {
        setIsAuthorized(true);
        return;
      }
      router.replace("/admin/login");
      return;
    }

    const syncPortfolio = () => {
      setPortfolio(readPortfolio());
    };
    syncPortfolio();
    window.addEventListener(PORTFOLIO_EVENT, syncPortfolio);
    return () => window.removeEventListener(PORTFOLIO_EVENT, syncPortfolio);
  }, [isAuthorized, router]);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(AUTH_FLAG);
    setIsAuthorized(false);
    router.replace("/admin/login");
  };

  const displayCode = useMemo(
    () => (process.env.NODE_ENV === "development" ? ADMIN_CODE : null),
    []
  );

  const stats = useMemo(
    () => [
      { label: "Total entries", value: portfolio.shops.length + portfolio.services.length },
      { label: "Shops live", value: portfolio.shops.length },
      { label: "Services live", value: portfolio.services.length },
    ],
    [portfolio.services.length, portfolio.shops.length]
  );

  const deriveNameFromUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return value;
    }
  };

  const handleAddShop = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthorized) {
      setMessage("Unlock the console before making changes.");
      router.replace("/admin/login");
      return;
    }
    const url = shopUrl.trim();
    if (!url) {
      setMessage("Provide the shop URL to add this entry.");
      return;
    }
    setShopFetching(true);
    try {
      const metadata = await fetchMetadata(url);
      const name = metadata.name || deriveNameFromUrl(url);
      const newShop = {
        id: Date.now(),
        icon: "SHOP",
        name,
        description:
          metadata.description ||
          "New Vandero shop representing the latest collection.",
        url,
        bannerUrl: metadata.banner,
      };
      const nextPortfolio = {
        ...portfolio,
        shops: [...portfolio.shops, newShop],
      };
      persistPortfolio(nextPortfolio);
      await persistServerPortfolio(nextPortfolio);
      setPortfolio(nextPortfolio);
      setShopUrl("");
      setMessage(`Shop "${newShop.name}" added.`);
    } catch {
      setMessage("Unable to fetch metadata. Please retry later.");
    } finally {
      setShopFetching(false);
    }
  };

  const handleAddService = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isAuthorized) {
      setMessage("Unlock the console before making changes.");
      router.replace("/admin/login");
      return;
    }
    const url = serviceUrl.trim();
    if (!url) {
      setMessage("Provide the service URL to add this entry.");
      return;
    }
    setServiceFetching(true);
    try {
      const metadata = await fetchMetadata(url);
      const name = metadata.name || deriveNameFromUrl(url);
      const newService = {
        id: Date.now(),
        icon: "SERVICE",
        name,
        description:
          metadata.description ||
          "New Vandero service crafted to move the business forward.",
        url,
        bannerUrl: metadata.banner,
      };
      const nextPortfolio = {
        ...portfolio,
        services: [...portfolio.services, newService],
      };
      persistPortfolio(nextPortfolio);
      await persistServerPortfolio(nextPortfolio);
      setPortfolio(nextPortfolio);
      setServiceUrl("");
      setMessage(`Service "${newService.name}" added.`);
    } catch {
      setMessage("Unable to fetch metadata. Please retry later.");
    } finally {
      setServiceFetching(false);
    }
  };

  const syncPortfolioAfterChange = async (nextPortfolio: Portfolio) => {
    persistPortfolio(nextPortfolio);
    await persistServerPortfolio(nextPortfolio);
    setPortfolio(nextPortfolio);
  };

  const deleteEntry = (type: "shop" | "service", id: number) => {
    const key = collectionKey(type);
    const nextPortfolio = {
      ...portfolio,
      [key]: portfolio[key].filter((item) => item.id !== id),
    } satisfies Portfolio;
    syncPortfolioAfterChange(nextPortfolio);
    setMessage(`${type === "shop" ? "Shop" : "Service"} removed.`);
  };

  const startEdit = (type: "shop" | "service", item: PortfolioItem) => {
    setEditingItem({ type, item, url: item.url });
  };

  const handleEditChange = (value: string) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, url: value });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const url = editingItem.url.trim();
    if (!url) {
      setMessage("Provide a URL to update this entry.");
      return;
    }
    try {
      const metadata = await fetchMetadata(url);
      const name = metadata.name || deriveNameFromUrl(url);
      const updatedItem: PortfolioItem = {
        ...editingItem.item,
        url,
        name,
        description:
          metadata.description ||
          editingItem.item.description ||
          "Updated Vandero entry.",
        bannerUrl: metadata.banner || editingItem.item.bannerUrl,
      };
      const key = collectionKey(editingItem.type);
      const nextPortfolio = {
        ...portfolio,
        [key]: portfolio[key].map((entry) =>
          entry.id === updatedItem.id ? updatedItem : entry
        ),
      } satisfies Portfolio;
      await syncPortfolioAfterChange(nextPortfolio);
      setMessage(`${editingItem.type === "shop" ? "Shop" : "Service"} updated.`);
      setEditingItem(null);
    } catch {
      setMessage("Unable to fetch metadata; please verify the URL.");
    }
  };

  const fetchMetadata = async (
    targetUrl: string
  ): Promise<{ banner: string; name: string; description: string }> => {
    const response = await fetch(
      `/api/banner?url=${encodeURIComponent(targetUrl)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch metadata");
    }
    const payload = await response.json();
    return {
      banner: payload.banner || DEFAULT_BANNER_URL,
      name: payload.title || "",
      description: payload.description || "",
    };
  };

  return (
    <main className="admin-page admin-page--wide">
      <div className="admin-shell">
        <header className="admin-hero">
          <div>
            <p className="admin-eyebrow">Control center</p>
            <h1>Vandero Admin Console</h1>
            <p className="admin-subtitle">
              Curate shops and services, refresh live previews, and keep the catalog in sync.
            </p>
            <div className="admin-chip-row">
              <span className="admin-chip admin-chip--accent">Live portfolio</span>
              <span className="admin-chip">Secure session</span>
            </div>
          </div>
          <div className="admin-hero-actions">
            <button className="admin-logout" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <div className="admin-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="admin-stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        {message && (
          <p
            className={`admin-status ${
              message.includes("added") || message.includes("updated")
                ? "admin-status--success"
                : "admin-status--error"
            }`}
          >
            {message}
          </p>
        )}

        {editingItem && (
          <section className="admin-panel admin-panel--editing">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-chip">Editing {editingItem.type}</p>
                <h3>{editingItem.item.name}</h3>
                <p className="admin-preview-copy">
                  Refresh the URL to pull a new title, description, and banner.
                </p>
              </div>
              <div className="admin-form-toolbar">
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
                <button type="button" onClick={saveEdit} className="admin-button">
                  Save changes
                </button>
              </div>
            </div>
            <input
              className="admin-input"
              value={editingItem.url}
              onChange={(event) => handleEditChange(event.target.value)}
              placeholder="Update URL"
            />
            <p className="admin-help">The preview refreshes automatically after saving.</p>
          </section>
        )}

        {isAuthorized && (
          <>
            <div className="admin-grid">
              <section className="admin-panel admin-panel--form">
                <div className="admin-panel-heading">
                  <div>
                    <p className="admin-chip admin-chip--accent">Shops</p>
                    <h2>Add a new shop</h2>
                    <p className="admin-preview-copy">
                      Drop in a product storefront URL. We will collect the title, description, and banner automatically.
                    </p>
                  </div>
                </div>
                <form className="admin-form" onSubmit={handleAddShop}>
                  <label htmlFor="shop-url" className="admin-label">
                    Shop URL
                  </label>
                  <input
                    id="shop-url"
                    value={shopUrl}
                    onChange={(event) => setShopUrl(event.target.value)}
                    className="admin-input"
                    placeholder="https://example-shop.com"
                  />
                  <div className="admin-form-toolbar">
                    <button
                      type="submit"
                      className="admin-button"
                      disabled={shopFetching}
                    >
                      {shopFetching ? "Adding shop..." : "Add shop"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="admin-panel admin-panel--form">
                <div className="admin-panel-heading">
                  <div>
                    <p className="admin-chip">Services</p>
                    <h2>Add a new service</h2>
                    <p className="admin-preview-copy">
                      Point to a live service page to mirror its metadata in the portfolio.
                    </p>
                  </div>
                </div>
                <form className="admin-form" onSubmit={handleAddService}>
                  <label htmlFor="service-url" className="admin-label">
                    Service URL
                  </label>
                  <input
                    id="service-url"
                    value={serviceUrl}
                    onChange={(event) => setServiceUrl(event.target.value)}
                    className="admin-input"
                    placeholder="https://service.example.com"
                  />
                  <div className="admin-form-toolbar">
                    <button
                      type="submit"
                      className="admin-button"
                      disabled={serviceFetching}
                    >
                      {serviceFetching ? "Adding service..." : "Add service"}
                    </button>
                  </div>
                </form>
              </section>
            </div>

            <div className="admin-collections">
              <section className="admin-section admin-section--shops">
                <header className="admin-section-heading">
                  <div>
                    <h2>Shop previews</h2>
                    <p>Validate storefront links before they go public.</p>
                  </div>
                </header>
                <div className="admin-card-grid">
                  {portfolio.shops.length === 0 && (
                    <p className="admin-empty">No shops added yet.</p>
                  )}
                  {portfolio.shops.map((shop) => (
                    <CollectionCard
                      key={shop.id}
                      type="shop"
                      item={shop}
                      deriveNameFromUrl={deriveNameFromUrl}
                      onEdit={startEdit}
                      onDelete={deleteEntry}
                    />
                  ))}
                </div>
              </section>

              <section className="admin-section admin-section--services">
                <header className="admin-section-heading">
                  <div>
                    <h2>Service previews</h2>
                    <p>Spot-check service detail pages in one place.</p>
                  </div>
                </header>
                <div className="admin-card-grid">
                  {portfolio.services.length === 0 && (
                    <p className="admin-empty">No services added yet.</p>
                  )}
                  {portfolio.services.map((service) => (
                    <CollectionCard
                      key={service.id}
                      type="service"
                      item={service}
                      deriveNameFromUrl={deriveNameFromUrl}
                      onEdit={startEdit}
                      onDelete={deleteEntry}
                    />
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {displayCode && (
          <p className="admin-hint">
            Development code: <code>{displayCode}</code>
          </p>
        )}
      </div>
    </main>
  );
}


