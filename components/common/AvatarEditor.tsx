"use client";

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface AvatarEditorProps {
  onSave: (base64Image: string) => void;
  onCancel: () => void;
  aspect?: number;
}

export default function AvatarEditor({ onSave, onCancel, aspect = 1 }: AvatarEditorProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

      const img = await createImage(image);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set target size (e.g., 300x300 for avatars)
      const targetSize = 300;
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

      // Get as base64
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      onSave(base64);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-elevated w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-subtle animate-slide-up">
        <div className="p-4 border-b border-subtle flex justify-between items-center">
          <h3 className="font-bold">Upravit obrázek</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onCancel}>✕</button>
        </div>

        <div className="relative h-80 bg-black">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted p-8 text-center">
              <div style={{ fontSize: '3rem' }}>📂</div>
              <p>Vyberte soubor z počítače pro nahrání profilové fotky</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={onSelectFile} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <button className="btn btn-primary">Vybrat soubor</button>
            </div>
          )}
        </div>

        {image && (
          <div className="p-6">
            <div className="mb-6">
              <label className="text-xs text-muted block mb-2 uppercase tracking-wider font-bold">Přiblížení</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e: any) => setZoom(e.target.value)}
                className="w-full h-2 bg-subtle rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="flex gap-4">
              <button className="btn btn-ghost flex-1" onClick={() => setImage(null)}>Změnit soubor</button>
              <button className="btn btn-primary flex-1" onClick={getCroppedImg}>Uložit výřez</button>
            </div>
          </div>
        )}
        
        {!image && (
          <div className="p-6">
            <button className="btn btn-ghost w-full" onClick={onCancel}>Zrušit</button>
          </div>
        )}
      </div>
    </div>
  );
}
