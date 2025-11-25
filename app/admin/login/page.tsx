"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_CODE = (process.env.NEXT_PUBLIC_ADMIN_CODE ?? "VANDERO-ADMIN").trim();
const AUTH_FLAG = "vandero-admin-authorized";
const isAuthorized = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(AUTH_FLAG) === ADMIN_CODE;

export default function AdminLoginPage() {
  const [inputCode, setInputCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized()) {
      router.replace("/admin/manage");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedInput = inputCode.trim();
    if (!normalizedInput) {
      setMessage("Enter the access code to continue.");
      return;
    }
    if (normalizedInput === ADMIN_CODE) {
      window.localStorage.setItem(AUTH_FLAG, ADMIN_CODE);
      router.push("/admin/manage");
    } else {
      setMessage("Incorrect code. Please try again.");
    }
  };

  const displayCode = useMemo(
    () => (process.env.NODE_ENV === "development" ? ADMIN_CODE : null),
    []
  );

  return (
    <main className="admin-page">
      <div className="admin-card">
        <p className="admin-eyebrow">Secure access</p>
        <h1>Vandero Admin Console</h1>
        <p className="admin-subtitle">
          Enter the access code to reach inventory and service controls.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-code" className="admin-label">
            Access code
          </label>
          <input
            id="admin-code"
          name="admin-code"
          type="password"
          className="admin-input"
          value={inputCode}
          onChange={(event) => {
            setInputCode(event.target.value);
            if (message) {
              setMessage(null);
            }
          }}
          placeholder="Enter the code"
        />
          <button type="submit" className="admin-button">
            Unlock console
          </button>
        </form>

        {message && (
          <p className="admin-status admin-status--error">{message}</p>
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
