"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Hesla se neshodují");
    if (password.length < 8) return setError("Heslo musí mít aspon 8 znaků");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        setError(data.error || "Chyba při obnově hesla");
      }
    } catch {
      setError("Chyba připojení");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="alert alert-error">
        ⚠️ Neplatný odkaz. Prosím požádejte o nové heslo znovu.
        <div className="mt-4">
          <Link href="/forgot-password" className="btn btn-secondary btn-sm">Zapomenuté heslo</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="alert alert-success mb-6">
          ✅ Heslo bylo úspěšně změněno! Nyní se můžete přihlásit.
        </div>
        <Link href="/login" className="btn btn-primary w-full">Přihlásit se</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <div className="form-group mb-4">
        <label className="form-label">Nové heslo</label>
        <input 
          type="password" 
          className="form-input" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-group mb-6">
        <label className="form-label">Potvrzení hesla</label>
        <input 
          type="password" 
          className="form-input" 
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
        {loading ? "Ukládám..." : "Nastavit nové heslo ✓"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo" style={{ marginBottom: 40 }}>
          <Image src="/logo.png" alt="Palalate" width={240} height={120} style={{ margin: "0 auto", width: "auto", height: "auto", maxWidth: "100%" }} />
        </div>

        <h2 style={{ marginBottom: 24, textAlign: "center" }}>Obnova hesla</h2>

        <Suspense fallback={<div>Načítám...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
