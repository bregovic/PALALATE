"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

export function VoiceServiceAssigner() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "cs-CZ";

        rec.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          setRecognizedText(transcript);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
      handleProcess();
    } else {
      if (!recognition) {
        alert("Hlasové rozpoznávání není ve vašem prohlížeči podporováno.");
        return;
      }
      setRecognizedText("");
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleProcess = async () => {
    // Small delay to catch final speech recognition results
    setTimeout(async () => {
      if (!recognizedText.trim()) {
        setIsProcessing(false);
        return;
      }
      
      setIsProcessing(true);
      try {
        const res = await fetch("/api/services/voice-match", {
          method: "POST",
          body: JSON.stringify({ text: recognizedText }),
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (data.added && data.added.length > 0) {
          alert(`Přidáno ${data.added.length} služeb: ${data.added.join(", ")}`);
          window.location.reload();
        } else if (data.added && data.added.length === 0) {
          alert("Nebyly nalezeny žádné nové služby k přidání. Zkuste vyslovit názvy služeb zřetelněji.");
        } else if (data.error) {
          alert(data.error);
        }
      } catch (err) {
        alert("Chyba při komunikaci se serverem.");
      } finally {
        setIsProcessing(false);
        setRecognizedText("");
      }
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8,
          borderRadius: "var(--radius-full)",
          padding: "8px 16px",
          ...(isRecording ? { 
            animation: "pulse 1.5s infinite",
            background: "var(--danger-500)",
            color: "white",
            borderColor: "var(--danger-600)"
          } : {})
        }}
      >
        {isProcessing ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          {isProcessing ? "Zpracovávám..." : isRecording ? "Zastavit a přidat" : "Přidat hlasem"}
        </span>
      </button>
      
      {isRecording && recognizedText && (
        <div 
          className="animate-fade-in shadow-sm"
          style={{ 
            fontSize: "0.85rem", 
            color: "var(--text-primary)", 
            background: "white", 
            padding: "8px 16px", 
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            maxWidth: 300,
            textAlign: "right",
            fontStyle: "italic"
          }}
        >
          🎤 "{recognizedText}..."
        </div>
      )}
    </div>
  );
}
