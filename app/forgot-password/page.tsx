"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při odesílání");
      }
    } catch {
      setError("Chyba připojení");
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

        <h2 style={{ marginBottom: 12, textAlign: "center" }}>Zapomenuté heslo</h2>
        <p className="text-center text-muted mb-6" style={{ fontSize: "0.9rem" }}>
          Zadej svůj email a my ti pošleme odkaz pro změnu hesla.
        </p>

        {sent ? (
          <div className="text-center">
            <div className="alert alert-success mb-6">
              ✅ Instrukce byly odeslány na tvůj email (pokud u nás máš účet).
            </div>
            <Link href="/login" className="btn btn-secondary w-full">Zpět na přihlášení</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-error mb-4">{error}</div>}
            <div className="form-group mb-6">
              <label className="form-label">Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="vas@email.cz" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? "Odesílám..." : "Poslat odkaz →"}
            </button>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-muted hover:text-brand">Zpět na přihlášení</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
