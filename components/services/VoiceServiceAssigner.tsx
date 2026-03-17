"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2, Check, X, Trash2, PlusCircle } from "lucide-react";

interface Match {
  id: string;
  name: string;
  confidence: number;
  category: string;
  iconUrl?: string;
}

export function VoiceServiceAssigner() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "cs-CZ";

        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          
          setTranscript(prev => {
            const newText = prev + " " + currentTranscript;
            // Clean up double spaces and trim
            const cleaned = newText.replace(/\s+/g, " ").trim();
            
            // Set 2s timer to process automatically after a pause
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              if (cleaned.length > 2) handleLookup(cleaned);
            }, 2000);
            
            return cleaned;
          });
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          // Restart if still recording (useful for mobile behavior)
          if (isRecording) rec.start();
        };

        recognitionRef.current = rec;
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRecording]);

  const handleLookup = async (text: string) => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/services/voice-match", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        // Merge with existing matches based on unique ID
        setMatches(prev => {
          const combined = [...prev, ...data.matches];
          const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
          return unique;
        });
        setShowResults(true);
      }
    } catch (err) {
      console.error("Lookup failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (!recognitionRef.current) {
        alert("Hlasové rozpoznávání není ve vašem prohlížeči podporováno.");
        return;
      }
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const removeMatch = (id: string) => {
    setMatches(prev => prev.filter(m => m.id !== id));
  };

  const handleConfirmAdd = async () => {
    if (matches.length === 0) return;
    setIsAdding(true);
    try {
      // Find the actual registry data for these matches
      const regRes = await fetch("/api/service-registry");
      const registryData = await regRes.json();
      
      const toAdd = registryData.filter((r: any) => matches.some(m => m.id === r.id));
      
      for (const item of toAdd) {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: item.name,
            providerName: item.name,
            periodicPrice: item.defaultPrice || 0,
            currency: item.currency || "CZK",
            category: item.category || "other",
            pricingType: item.pricingType || "PAID",
            billingCycle: item.billingCycle || "MONTHLY",
            usageMode: item.usageMode || "PRIVATE",
            requiresBookingApproval: item.requiresBookingApproval || false,
            iconUrl: item.iconUrl,
            websiteUrl: item.websiteUrl,
            description: item.description,
            url: item.url
          }),
        });
      }
      
      setMatches([]);
      setShowResults(false);
      window.location.reload();
    } catch (err) {
      alert("Některé služby se nepodařilo přidat.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
      <button
        onClick={toggleRecording}
        disabled={isAdding}
        className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          borderRadius: "var(--radius-full)",
          padding: "8px 20px",
          boxShadow: isRecording ? "0 0 15px var(--danger-400)" : "var(--shadow-sm)",
          ...(isRecording ? { 
            animation: "pulse 1.5s infinite",
            background: "var(--danger-500)",
            color: "white",
            borderColor: "var(--danger-600)"
          } : {})
        }}
      >
        {isAdding ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          {isAdding ? "Přidávám vše..." : isRecording ? "Nahrávám..." : "Přidat hlasem (chytré)"}
        </span>
      </button>
      
      {isRecording && transcript && (
        <div 
          className="animate-fade-in shadow-sm"
          style={{ 
            fontSize: "0.85rem", 
            color: "var(--text-secondary)", 
            background: "white", 
            padding: "8px 16px", 
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            maxWidth: 320,
            textAlign: "right",
            fontStyle: "italic",
            lineHeight: 1.4
          }}
        >
          🎤 "{transcript}..."
        </div>
      )}

      {showResults && matches.length > 0 && (
        <div 
          className="card shadow-lg animate-slide-up" 
          style={{ 
            width: 340, 
            background: "white", 
            border: "2px solid var(--brand-200)", 
            padding: 0,
            overflow: "hidden",
            zIndex: 100
          }}
        >
          <div style={{ padding: "12px 16px", background: "var(--brand-50)", borderBottom: "1px solid var(--brand-100)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--brand-800)" }}>Nalezené služby ({matches.length})</span>
            <button onClick={() => setShowResults(false)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}><X size={14}/></button>
          </div>
          <div style={{ maxHeight: 250, overflowY: "auto", padding: 8 }}>
            {matches.map(m => (
              <div 
                key={m.id} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "8px 12px", 
                  borderRadius: "var(--radius-md)", 
                  background: "#f8fafc", 
                  marginBottom: 6,
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                   <div style={{ height: 24, width: 24, borderRadius: 6, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", border: "1px solid #eaebed" }}>
                      {m.iconUrl ? <img src={m.iconUrl} style={{ width: 16, height: 16 }} /> : "S"}
                   </div>
                   <div>
                     <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{m.name}</div>
                     <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Shoda: ~{(m.confidence * 100).toFixed(0)}%</div>
                   </div>
                </div>
                <button onClick={() => removeMatch(m.id)} className="btn btn-ghost text-danger-500" style={{ padding: 6, height: "auto" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
             <button onClick={handleConfirmAdd} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                <PlusCircle size={14} /> Potvrdit a přidat {(matches.length)}
             </button>
             <button onClick={() => { setMatches([]); setShowResults(false); }} className="btn btn-secondary btn-sm">
                Zrušit
             </button>
          </div>
        </div>
      )}

      {isProcessing && !showResults && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <Loader2 size={12} className="animate-spin" /> Vyhledávám v číselníku...
        </div>
      )}
    </div>
  );
}
