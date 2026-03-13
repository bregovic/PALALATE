"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== password2) {
      setError("Hesla se neshodují");
      return;
    }

    if (password.length < 8) {
      setError("Heslo musí mít alespoň 8 znaků");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, consent }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.details ? `${data.error}: ${data.details}` : (data.error || "Registrace se nezdařila"));
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
        <div className="auth-logo">
          <Image src="/logo.png" alt="Palalate" width={52} height={52} />
          <div className="auth-logo-title">Palalate</div>
          <div className="auth-logo-tagline">
            Tvé předplatné, tvé pravidla 👑
          </div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Vytvořit účet</h2>
        <p className="text-sm text-muted mb-6">
          Zdarma. Žádná kreditní karta.{" "}
          <span style={{ fontSize: "1rem" }}>🥑</span>
        </p>

        {error && (
          <div className="alert alert-error mb-4">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">
                Jméno
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Jan Novák"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                Email
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="reg-email"
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
              <label className="form-label" htmlFor="reg-password">
                Heslo
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-password"
                  type="password"
                  className="form-input"
                  placeholder="Min. 8 znaků"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password2">
                Potvrdit heslo
              </label>
              <div className="input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="reg-password2"
                  type="password"
                  className="form-input"
                  placeholder="Znovu heslo"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <input 
                type="checkbox" 
                id="reg-consent"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                required
                style={{ marginTop: 4, width: 18, height: 18, flexShrink: 0 }}
              />
              <label htmlFor="reg-consent" className="text-xs text-secondary leading-relaxed cursor-pointer">
                <strong>Souhlasím s provozními podmínkami.</strong> Rozumím, že platforma slouží pouze pro sdílení přístupů, u kterých vím, že je to legislativně možné. Potvrzuji, že u služeb, kde si nejsem jistý/á, nejsem oprávněn/a je zde zveřejňovat. Provozovatel nenese odpovědnost za zveřejněné služby a jejich sdílení.
              </label>
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading || !consent}
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Registruji...
                </>
              ) : (
                "Vytvořit účet →"
              )}
            </button>
          </div>
        </form>

        <div className="divider" style={{ margin: "24px 0" }} />

        <p className="text-center text-sm text-muted">
          Už máš účet?{" "}
          <Link href="/login" className="text-brand font-medium">
            Přihlásit se
          </Link>
        </p>
      </div>
    </div>
  );
}
