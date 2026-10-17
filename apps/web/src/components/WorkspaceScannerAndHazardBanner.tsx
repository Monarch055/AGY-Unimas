'use client';

import React, { useState } from 'react';
import type { InventoryItemDTO, RegionCode, SafetyAlertDTO } from '@rekasains/shared-types';
import { evaluateClientCoLocationHazards, scanWorkspacePhoto } from '../lib/api-client';
import { categoryLabel, severityLabel } from '../lib/labels';
import type { PreparedImage } from '../lib/image';
import { PhotoInput } from './PhotoInput';
import { Button, EmptyState, Panel, Pill, inputClass } from './ui';

interface WorkspaceScannerProps {
  region: RegionCode;
  items: InventoryItemDTO[];
  activeHazards: SafetyAlertDTO[];
  onInventoryUpdated: (items: InventoryItemDTO[], hazards: SafetyAlertDTO[]) => void;
  onConfirm: () => void;
}

const HAZARDOUS_SLUGS = new Set(['sodium_hypochlorite', 'floor_cleaner_acidic', 'ammonia_cleaner']);

// Sample payloads understood by the backend and local fallback (no real photo involved).
const SAMPLE_SAFE = 'data:image/jpeg;base64,REKASAIN_DEMO_SAFE_WORKSPACE';
const SAMPLE_HAZARD = 'data:image/jpeg;base64,REKASAIN_DEMO_HAZARD_BLEACH_ACID';

export function WorkspaceScannerAndHazardBanner({
  region,
  items,
  activeHazards,
  onInventoryUpdated,
  onConfirm,
}: WorkspaceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);

  const updateItems = (next: InventoryItemDTO[]) => {
    onInventoryUpdated(
      next,
      evaluateClientCoLocationHazards(
        next.map((i) => i.material_slug),
        region
      )
    );
  };

  const runScan = async (imageBase64: string, mimeType: PreparedImage['mimeType'], hazardSample = false) => {
    setIsScanning(true);
    setStatus(null);
    setError(null);
    try {
      const res = await scanWorkspacePhoto(
        { image_base64: imageBase64, mime_type: mimeType, region },
        hazardSample
      );
      onInventoryUpdated(res.detected_items, res.active_workspace_hazards);
      const byAI = res.inference_engine && res.inference_engine !== 'rules';
      setStatus(
        res.detected_items.length === 0
          ? 'Tidak ada bahan yang dikenali di foto. Coba foto lebih dekat atau tambah manual.'
          : `${res.detected_items.length} bahan terdeteksi${byAI ? ' oleh Gemini' : ''}. Periksa dan koreksi daftar di bawah.`
      );
    } catch (err) {
      setError(`Foto gagal dianalisis. ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePhoto = (photo: PreparedImage) => {
    setPreview(photo.dataUrl);
    void runScan(photo.dataUrl, photo.mimeType);
  };

  const handleSample = (hazard: boolean) => {
    setPreview(null);
    void runScan(hazard ? SAMPLE_HAZARD : SAMPLE_SAFE, 'image/jpeg', hazard);
  };

  const changeQty = (slug: string, delta: number) => {
    updateItems(
      items
        .map((i) => (i.material_slug === slug ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (slug: string) => updateItems(items.filter((i) => i.material_slug !== slug));

  const removeHazardous = () => updateItems(items.filter((i) => !HAZARDOUS_SLUGS.has(i.material_slug)));

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
    if (!slug || items.some((i) => i.material_slug === slug)) return;
    updateItems([
      ...items,
      {
        material_slug: slug,
        name_local: name,
        category: 'HOUSEHOLD_TOOL',
        quantity: Math.max(1, newQty),
        unit: 'pcs',
        confidence: 1,
      },
    ]);
    setNewName('');
    setNewQty(1);
  };

  return (
    <div className="space-y-4">
      <Panel
        title="Pindai meja kerja"
        description="Foto bahan yang kamu punya. Hasil deteksi bisa dikoreksi sebelum dicocokkan ke eksperimen."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <div className="space-y-3">
            <PhotoInput onPhoto={handlePhoto} disabled={isScanning} captureLabel="Ambil & pindai" />
            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm">
              <span className="text-stone-500">Tanpa foto:</span>
              <Button variant="ghost" onClick={() => handleSample(false)} disabled={isScanning}>
                Data contoh
              </Button>
              <Button variant="ghost" onClick={() => handleSample(true)} disabled={isScanning}>
                Data contoh + bahan berbahaya
              </Button>
            </div>
            {isScanning && <p className="text-sm text-stone-500">Menganalisis foto…</p>}
            {error && !isScanning && <p className="text-sm text-red-700">{error}</p>}
            {status && !isScanning && <p className="text-sm text-stone-600">{status}</p>}
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Foto meja yang dipindai"
              className="h-36 w-full rounded-md border border-stone-200 object-cover md:h-full"
            />
          )}
        </div>
      </Panel>

      {activeHazards.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-red-900">
                {severityLabel(activeHazards[0].severity)}
              </p>
              {activeHazards.map((alert) => (
                <p key={alert.rule_code} className="text-sm text-red-800">
                  {alert.message_local}
                </p>
              ))}
            </div>
            <Button variant="danger" onClick={removeHazardous}>
              Keluarkan bahan berbahaya dari daftar
            </Button>
          </div>
        </div>
      )}

      <Panel
        title={`Inventaris (${items.length})`}
        actions={
          <Button variant="primary" onClick={onConfirm} disabled={items.length === 0}>
            Cari eksperimen
          </Button>
        }
      >
        {items.length === 0 ? (
          <EmptyState>Belum ada bahan. Pindai foto, pakai data contoh, atau tambah manual.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-stone-500">
                <tr className="border-b border-stone-200">
                  <th className="py-2 pr-3 font-medium">Bahan</th>
                  <th className="py-2 pr-3 font-medium">Kategori</th>
                  <th className="py-2 pr-3 font-medium">Keyakinan</th>
                  <th className="py-2 pr-3 font-medium">Jumlah</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => {
                  const hazardous = HAZARDOUS_SLUGS.has(item.material_slug);
                  return (
                    <tr key={item.material_slug} className={hazardous ? 'bg-red-50/60' : ''}>
                      <td className="py-2 pr-3">
                        <div className="text-stone-900">{item.name_local}</div>
                        <div className="font-mono text-xs text-stone-400">{item.material_slug}</div>
                      </td>
                      <td className="py-2 pr-3">
                        {hazardous ? (
                          <Pill tone="danger">{categoryLabel(item.category)}</Pill>
                        ) : (
                          <span className="text-stone-600">{categoryLabel(item.category)}</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-stone-600">
                        {Math.round(item.confidence * 100)}%
                      </td>
                      <td className="py-2 pr-3">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            className="h-7 w-7 !p-0"
                            aria-label={`Kurangi ${item.name_local}`}
                            onClick={() => changeQty(item.material_slug, -1)}
                          >
                            −
                          </Button>
                          <span className="min-w-[3.5rem] text-center tabular-nums">
                            {item.quantity} {item.unit}
                          </span>
                          <Button
                            variant="ghost"
                            className="h-7 w-7 !p-0"
                            aria-label={`Tambah ${item.name_local}`}
                            onClick={() => changeQty(item.material_slug, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" onClick={() => removeItem(item.material_slug)}>
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={addItem} className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tambah bahan manual, mis. cuka dapur"
            className={`${inputClass} min-w-[200px] flex-1`}
          />
          <input
            type="number"
            min={1}
            value={newQty}
            onChange={(e) => setNewQty(parseInt(e.target.value, 10) || 1)}
            className={`${inputClass} !w-20`}
            aria-label="Jumlah"
          />
          <Button type="submit">Tambah</Button>
        </form>
        <p className="mt-2 text-xs text-stone-400">
          Bahan manual yang tidak ada di katalog belum dipakai untuk pencocokan eksperimen.
        </p>
      </Panel>
    </div>
  );
}
