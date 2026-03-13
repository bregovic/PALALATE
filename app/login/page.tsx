"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Přihlášení se nezdařilo");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Nepodařilo se připojit k serveru");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo" style={{ marginBottom: 40 }}>
          <Image src="/logo.png" alt="Palalate" width={240} height={120} style={{ margin: "0 auto", width: "auto", height: "auto", maxWidth: "100%" }} />
        </div>

        <h2 style={{ marginBottom: 24, textAlign: "center" }}>Přihlásit se</h2>

        {error && (
          <div className="alert alert-error mb-4">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex-col gap-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Heslo
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Vaše heslo"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <Link href="/forgot-password" style={{ fontSize: "0.8rem", color: "var(--brand-600)" }}>
                  Zapomněli jste heslo?
                </Link>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Přihlašuji...
                </>
              ) : (
                "Přihlásit se →"
              )}
            </button>
          </div>
        </form>

        <div className="divider" style={{ margin: "24px 0" }} />

        <p className="text-center text-sm text-muted">
          Ještě nemáš účet?{" "}
          <Link href="/register" className="text-brand font-medium">
            Zaregistruj se zdarma
          </Link>
        </p>
      </div>
    </div>
  );
}
