'use client';

import React, { useEffect, useRef, useState } from 'react';
import { captureVideoFrame, prepareImageFile, type PreparedImage } from '../lib/image';
import { Button } from './ui';

interface PhotoInputProps {
  onPhoto: (photo: PreparedImage) => void;
  disabled?: boolean;
  captureLabel?: string;
}

/** Camera capture or file upload, both returning a downscaled JPEG data URL. */
export function PhotoInput({ onPhoto, disabled, captureLabel = 'Ambil foto' }: PhotoInputProps) {
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Browser ini tidak mendukung kamera. Gunakan unggah foto.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch (err) {
      setError(
        `Kamera tidak bisa dibuka (${err instanceof Error ? err.message : String(err)}). Gunakan unggah foto.`
      );
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const photo = captureVideoFrame(videoRef.current);
    stopCamera();
    onPhoto(photo);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      onPhoto(await prepareImageFile(file));
    } catch (err) {
      setError(`Foto tidak bisa dibaca (${err instanceof Error ? err.message : String(err)}).`);
    }
  };

  return (
    <div className="space-y-2">
      {cameraOn && (
        <div className="overflow-hidden rounded-md border border-stone-200 bg-stone-900">
          <video ref={videoRef} playsInline muted className="aspect-video w-full object-cover" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {cameraOn ? (
          <>
            <Button variant="primary" onClick={capture} disabled={disabled}>
              {captureLabel}
            </Button>
            <Button variant="ghost" onClick={stopCamera}>
              Tutup kamera
            </Button>
          </>
        ) : (
          <>
            <Button onClick={startCamera} disabled={disabled}>
              Buka kamera
            </Button>
            <Button onClick={() => fileRef.current?.click()} disabled={disabled}>
              Unggah foto
            </Button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
