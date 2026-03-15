"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface AvatarEditorProps {
  onSave: (base64Image: string) => void;
  onCancel: () => void;
  aspect?: number;
  initialImage?: string | null;
}

export default function AvatarEditor({ onSave, onCancel, aspect = 1, initialImage = null }: AvatarEditorProps) {
  const [image, setImage] = useState<string | null>(initialImage);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result?.toString() || null));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      if (!image || !croppedAreaPixels) return;
      setIsProcessing(true);

      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // High quality target size
      const targetSize = 600; 
      canvas.width = targetSize;
      canvas.height = targetSize / aspect;

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Get as base64 - higher quality
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      
      // Delay slightly to show processing for premium feel
      setTimeout(() => {
        onSave(base64);
        setIsProcessing(false);
      }, 500);
      
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-max flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-elevated w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-subtle animate-slide-up relative">
        
        {/* Header */}
        <div className="p-6 border-b border-subtle flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-lg m-0">Upravit fotku</h3>
            <p className="text-xs text-muted m-0">Tažením nastav výřez a měřítko</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-icon" 
            onClick={onCancel}
            style={{ borderRadius: '50%', background: 'var(--bg-elevated)' }}
          >
            ✕
          </button>
        </div>

        {/* Cropper Container */}
        <div id="avatar-cropper-container" className="relative w-full bg-[#0a0a0a]" style={{ height: 400 }}>
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape={aspect === 1 ? "round" : "rect"}
              showGrid={false}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted p-8 text-center bg-white">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-2">
                <span style={{ fontSize: '2rem' }}>🖼️</span>
              </div>
              <h4 className="font-bold text-primary">Žádný obrázek</h4>
              <p className="text-sm">Vyberte soubor z počítače pro nahrání profilové fotky</p>
              
              <div className="relative mt-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onSelectFile} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <button className="btn btn-primary btn-lg">Vybrat soubor</button>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
              <div className="spinner mb-4" />
              <p className="font-bold">Zpracovávám...</p>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        {image && (
          <div className="p-6 bg-white">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-muted uppercase tracking-wider font-bold">Přiblížení</label>
                <span className="text-xs font-bold text-brand-500">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.01}
                aria-labelledby="Zoom"
                onChange={(e: any) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
                style={{ outline: 'none' }}
              />
            </div>

            <div className="flex gap-4">
              <button 
                className="btn btn-secondary flex-1" 
                onClick={() => setImage(null)}
                disabled={isProcessing}
              >
                🔄 Změnit soubor
              </button>
              <button 
                className="btn btn-primary flex-1 btn-lg" 
                onClick={getCroppedImg}
                disabled={isProcessing}
              >
                {isProcessing ? "Ukládám..." : "✓ Potvrdit a uložit"}
              </button>
            </div>
          </div>
        )}
        
        {!image && (
          <div className="p-6 bg-white border-t border-subtle">
            <button className="btn btn-ghost w-full" onClick={onCancel}>Zrušit</button>
          </div>
        )}
      </div>
      
      {/* Visual background element to make it feel premium */}
      <style jsx>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .max-w-lg {
            max-width: 100%;
            height: 100%;
            border-radius: 0;
          }
          #avatar-cropper-container {
            height: calc(100vh - 250px) !important;
          }
        }
      `}</style>
    </div>
  );
}
