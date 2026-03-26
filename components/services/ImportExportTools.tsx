"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportExportTools() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleExport = async () => {
    window.location.href = "/api/services/export";
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/services/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Import dokončen!");
        router.refresh();
      } else {
        alert("Chyba při importu");
      }
    } catch (err) {
      alert("Chyba spojení se serverem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={handleExport} className="btn btn-secondary btn-sm" disabled={loading} title="Export (Excel)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
        </svg>
      </button>

      <label className={`btn btn-secondary btn-sm ${loading ? 'opacity-50' : ''}`} style={{ cursor: "pointer" }} title="Import (Excel)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
        <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleImport} disabled={loading} />
      </label>
    </div>
  );
}
