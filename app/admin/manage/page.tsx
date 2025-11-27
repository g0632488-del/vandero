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
    persistServerPortfolio(nextPortfolio);
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
    persistServerPortfolio(nextPortfolio);
    setPortfolio(nextPortfolio);
    setServiceUrl("");
    setMessage(`Service "${newService.name}" added.`);
  } catch {
      setMessage("Unable to fetch metadata. Please retry later.");
    } finally {
      setServiceFetching(false);
    }
  };

const syncPortfolioAfterChange = (nextPortfolio: Portfolio) => {
  persistPortfolio(nextPortfolio);
  persistServerPortfolio(nextPortfolio);
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
      syncPortfolioAfterChange(nextPortfolio);
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
    <main className="admin-page">
      <div className="admin-card">
        <div className="admin-card-heading">
          <div>
            <p className="admin-eyebrow">Secure access</p>
            <h1>Vandero Admin Console</h1>
            <p className="admin-subtitle">
              Manage shops and services with confidence.
            </p>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            Log out
          </button>
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
          <div className="admin-edit-panel">
            <div className="admin-edit-header">
              <h3>Edit {editingItem.type === "shop" ? "shop" : "service"}</h3>
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </button>
            </div>
            <input
              className="admin-input"
              value={editingItem.url}
              onChange={(event) => handleEditChange(event.target.value)}
              placeholder="Update URL"
            />
            <div className="admin-form-toolbar">
              <button type="button" onClick={saveEdit} className="admin-button">
                Save changes
              </button>
            </div>
          </div>
        )}

        {isAuthorized && (
          <div className="admin-management">
            <section className="admin-section admin-section--shops">
              <header className="admin-section-heading">
                <div>
                  <h2>Shops</h2>
                </div>
              </header>
              <form className="admin-form" onSubmit={handleAddShop}>
                <input
                  value={shopUrl}
                  onChange={(event) => setShopUrl(event.target.value)}
                  className="admin-input"
                  placeholder="Shop URL"
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
              <div className="admin-card-grid">
                {portfolio.shops.map((shop) => (
                  <article
                    key={shop.id}
                    className="admin-preview-card"
                  >
                    <LivePreview url={shop.url} title={shop.name} />
                    <div className="admin-preview-actions">
                      <button
                        type="button"
                        onClick={() => startEdit("shop", shop)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry("shop", shop.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-section admin-section--services">
              <header className="admin-section-heading">
                <div>
                  <h2>Services</h2>
                </div>
              </header>
              <form className="admin-form" onSubmit={handleAddService}>
                <input
                  value={serviceUrl}
                  onChange={(event) => setServiceUrl(event.target.value)}
                  className="admin-input"
                  placeholder="Service URL"
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
              <div className="admin-card-grid">
                {portfolio.services.map((service) => (
                  <article
                    key={service.id}
                    className="admin-preview-card"
                  >
                    <LivePreview url={service.url} title={service.name} />
                    <div className="admin-preview-actions">
                      <button
                        type="button"
                        onClick={() => startEdit("service", service)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEntry("service", service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
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


