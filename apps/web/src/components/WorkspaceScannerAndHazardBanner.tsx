'use client';

import React, { useState } from 'react';
import type {
  InventoryItemDTO,
  InventoryItemInput,
  RegionCode,
  SafetyAlertDTO,
} from '@rekasains/shared-types';
import {
  confirmInventoryItems,
  evaluateClientCoLocationHazards,
  scanWorkspacePhoto,
} from '../lib/api-client';

interface WorkspaceScannerProps {
  region: RegionCode;
  items: InventoryItemDTO[];
  activeHazards: SafetyAlertDTO[];
  onInventoryUpdated: (
    updatedItems: InventoryItemDTO[],
    updatedHazards: SafetyAlertDTO[]
  ) => void;
}

export function WorkspaceScannerAndHazardBanner({
  region,
  items,
  activeHazards,
  onInventoryUpdated,
}: WorkspaceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const isMY = region === 'MY';

  const handleScanWorkspace = async (simulateHazard: boolean) => {
    setIsScanning(true);
    setConfirmMessage(null);
    try {
      const response = await scanWorkspacePhoto(
        {
          image_base64: simulateHazard
            ? 'data:image/jpeg;base64,REKASAIN_DEMO_HAZARD_BLEACH_ACID'
            : 'data:image/jpeg;base64,REKASAIN_DEMO_SAFE_WORKSPACE',
          mime_type: 'image/jpeg',
          region,
        },
        simulateHazard
      );
      onInventoryUpdated(
        response.detected_items,
        response.active_workspace_hazards
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setConfirmMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = typeof reader.result === 'string' ? reader.result : '';
      const response = await scanWorkspacePhoto({
        image_base64: base64,
        mime_type: 'image/jpeg',
        region,
      });
      onInventoryUpdated(
        response.detected_items,
        response.active_workspace_hazards
      );
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleQuantityChange = (slug: string, delta: number) => {
    const nextItems = items
      .map((item) =>
        item.material_slug === slug
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    const nextHazards = evaluateClientCoLocationHazards(
      nextItems.map((i) => i.material_slug),
      region
    );
    onInventoryUpdated(nextItems, nextHazards);
  };

  const handleRemoveHazardousItems = () => {
    const safeItems = items.filter(
      (i) =>
        i.material_slug !== 'sodium_hypochlorite' &&
        i.material_slug !== 'floor_cleaner_acidic' &&
        i.material_slug !== 'ammonia_cleaner'
    );
    const nextHazards = evaluateClientCoLocationHazards(
      safeItems.map((i) => i.material_slug),
      region
    );
    onInventoryUpdated(safeItems, nextHazards);
  };

  const handleConfirmInventory = async () => {
    const inputItems: InventoryItemInput[] = items.map((i) => ({
      material_slug: i.material_slug,
      quantity: i.quantity,
      unit: i.unit,
    }));
    const res = await confirmInventoryItems({
      region,
      items: inputItems,
    });
    onInventoryUpdated(items, res.safety_alerts);
    setConfirmMessage(
      isMY
        ? `Inventori disahkan (${res.total_items} item). Sedia untuk padanan eksperimen 3-Tier!`
        : `Inventaris fisik dikonfirmasi (${res.total_items} bahan). Siap dicocokkan ke katalog 3-Tier!`
    );
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
            USP #1 &amp; USP #7 • VisionInventoryAgent + SafetyGuardianAgent
          </span>
          <h2 className="mt-1 text-xl font-bold text-white">
            {isMY
              ? '1. Pemetaan Inventori Kamera & Pengesanan Bahaya Aktif'
              : '1. Pemetaan Inventaris Kamera & Deteksi Bahaya Ko-Lokasi Aktif'}
          </h2>
          <p className="text-sm text-slate-300">
            {isMY
              ? 'Tangkap gambar meja kerja atau barang kitar semula. Sistem mengekstrak kuantiti bahan secara automatik dan memberi amaran merah serta-merta jika bahan berbahaya berada di kawasan yang sama.'
              : 'Foto meja kerja atau tumpukan barang bekas. Sistem otomatis mendeteksi jumlah bahan tanpa mengetik manual dan langsung memunculkan Peringatan Merah jika ada kombinasi bahan berbahaya di satu area.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">
            📷 {isMY ? 'Ambil / Muat Naik Foto Meja' : 'Ambil / Upload Foto Meja Kerja'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleScanWorkspace(false)}
            className="rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            {isScanning
              ? 'Memindai...'
              : isMY
              ? '⚡ Demo Imbasan Meja Selamat'
              : '⚡ Simulasi Scan Meja Aman'}
          </button>
          <button
            type="button"
            disabled={isScanning}
            onClick={() => handleScanWorkspace(true)}
            className="rounded-xl border border-red-500/70 bg-red-500/15 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25"
          >
            🚨 {isMY ? 'Uji Bahaya (Peluntur + Asid)' : 'Uji Bahaya Aktif (Pemutih + Pembersih Lantai)'}
          </button>
        </div>
      </div>

      {/* USP #7: Active Co-Location Hazard Red Banner */}
      {activeHazards.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-xl border-2 border-red-500 bg-red-950/90 p-4 text-red-100 shadow-lg"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-red-300">
                <span>🚨 ACTIVE WORKSPACE HAZARD DETECTED</span>
                <span className="rounded bg-red-600 px-2 py-0.5 text-xs text-white">
                  {activeHazards[0].severity}
                </span>
              </div>
              {activeHazards.map((alert) => (
                <p key={alert.rule_code} className="mt-1 text-sm font-medium text-red-100">
                  {alert.message_local}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRemoveHazardousItems}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-bold text-red-900 shadow hover:bg-red-100"
            >
              🛡️ {isMY ? 'Asingkan Bahan Berbahaya Sekarang' : 'Singkirkan Bahan Berbahaya dari Meja'}
            </button>
          </div>
        </div>
      )}

      {/* Extracted Physical Inventory Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2 pr-3">{isMY ? 'Nama Bahan (Lokal)' : 'Nama Alat / Bahan (Lokal)'}</th>
              <th className="py-2 px-3">{isMY ? 'Kategori' : 'Kategori'}</th>
              <th className="py-2 px-3">{isMY ? 'Kuantiti' : 'Jumlah'}</th>
              <th className="py-2 px-3">AI Confidence</th>
              <th className="py-2 pl-3 text-right">{isMY ? 'Laraskan' : 'Atur Jumlah'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => {
              const isHazardous =
                item.material_slug === 'sodium_hypochlorite' ||
                item.material_slug === 'floor_cleaner_acidic';
              return (
                <tr
                  key={item.material_slug}
                  className={isHazardous ? 'bg-red-950/40 text-red-200' : ''}
                >
                  <td className="py-2.5 pr-3 font-medium">
                    {item.name_local}{' '}
                    <span className="text-xs text-slate-400">({item.material_slug})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-cyan-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-emerald-400">
                    {Math.round(item.confidence * 100)}%
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.material_slug, -1)}
                        className="rounded bg-slate-800 px-2.5 py-1 text-xs font-bold hover:bg-slate-700"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.material_slug, 1)}
                        className="rounded bg-slate-800 px-2.5 py-1 text-xs font-bold hover:bg-slate-700"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <span className="text-xs text-slate-400">
          {confirmMessage ||
            (isMY
              ? 'Semak kuantiti bahan di atas sebelum mengesahkan inventori.'
              : 'Periksa jumlah bahan hasil deteksi kamera sebelum mengonfirmasi inventaris.')}
        </span>
        <button
          type="button"
          onClick={handleConfirmInventory}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          ✅ {isMY ? 'Sahkan Inventori Fizikal' : 'Konfirmasi Inventaris Fisik'}
        </button>
      </div>
    </section>
  );
}
