/**
 * RekaSains Offline-First Storage Engine (`apps/web/src/lib/offline-db.ts`)
 * - USP #5 & #10: Stores `OfflineLabPack` modules, verified step logs, academic lab reports,
 *   and idempotent `client_mutation_id` completion entries in IndexedDB (with memory fallback for SSR/Node tests).
 */

import type {
  AwardedBadgeDTO,
  LabReportGenerateResponse,
  OfflineCompletionItemInput,
  STEMExperimentModuleDTO,
} from '@rekasains/shared-types';

const DB_NAME = 'rekasains_offline_pwa_db';
const DB_VERSION = 1;

export interface StoredOfflineLabPack {
  packKey: string;
  experimentSlug: string;
  ageAdaptiveLevel: string;
  module: STEMExperimentModuleDTO;
  savedAtUtc: string;
}

// In-memory store used during SSR or automated Node.js unit tests
const memoryPacks = new Map<string, StoredOfflineLabPack>();
const memoryMutations = new Map<string, OfflineCompletionItemInput>();
const memoryReports = new Map<string, LabReportGenerateResponse>();
const memoryBadges = new Map<string, AwardedBadgeDTO>();

function isBrowserIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openRekaSainsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline_lab_packs')) {
        db.createObjectStore('offline_lab_packs', { keyPath: 'packKey' });
      }
      if (!db.objectStoreNames.contains('offline_sync_queue')) {
        db.createObjectStore('offline_sync_queue', { keyPath: 'client_mutation_id' });
      }
      if (!db.objectStoreNames.contains('saved_lab_reports')) {
        db.createObjectStore('saved_lab_reports', { keyPath: 'report_id' });
      }
      if (!db.objectStoreNames.contains('awarded_badges')) {
        db.createObjectStore('awarded_badges', { keyPath: 'badge_code' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a complete STEMExperimentModuleDTO as an OfflineLabPack for 100% offline execution.
 */
export async function saveOfflineLabPack(
  module: STEMExperimentModuleDTO
): Promise<StoredOfflineLabPack> {
  const packKey = `${module.experiment_slug}:${module.age_adaptive_level}`;
  const record: StoredOfflineLabPack = {
    packKey,
    experimentSlug: module.experiment_slug,
    ageAdaptiveLevel: module.age_adaptive_level,
    module,
    savedAtUtc: new Date().toISOString(),
  };

  memoryPacks.set(packKey, record);

  if (!isBrowserIndexedDBAvailable()) {
    return record;
  }

  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_lab_packs', 'readwrite');
    tx.objectStore('offline_lab_packs').put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves a cached OfflineLabPack by experiment slug and age-adaptive level.
 */
export async function getOfflineLabPack(
  experimentSlug: string,
  ageAdaptiveLevel: string
): Promise<StoredOfflineLabPack | null> {
  const packKey = `${experimentSlug}:${ageAdaptiveLevel}`;
  if (!isBrowserIndexedDBAvailable()) {
    return memoryPacks.get(packKey) || null;
  }

  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_lab_packs', 'readonly');
    const req = tx.objectStore('offline_lab_packs').get(packKey);
    req.onsuccess = () => resolve((req.result as StoredOfflineLabPack) || memoryPacks.get(packKey) || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Enqueues an offline experiment completion idempotently using `client_mutation_id`.
 * Duplicate `client_mutation_id` entries are ignored to prevent double XP/Badges (FEAT-001 Edge Case #3).
 */
export async function enqueueOfflineCompletion(
  item: OfflineCompletionItemInput
): Promise<{ deduplicated: boolean; queueLength: number }> {
  const alreadyExists = memoryMutations.has(item.client_mutation_id);
  if (!alreadyExists) {
    memoryMutations.set(item.client_mutation_id, item);
  }

  if (!isBrowserIndexedDBAvailable()) {
    return {
      deduplicated: alreadyExists,
      queueLength: memoryMutations.size,
    };
  }

  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    const store = tx.objectStore('offline_sync_queue');
    store.put(item);
    tx.oncomplete = () =>
      resolve({
        deduplicated: alreadyExists,
        queueLength: memoryMutations.size,
      });
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Lists all pending offline completions awaiting synchronization.
 */
export async function listPendingOfflineCompletions(): Promise<OfflineCompletionItemInput[]> {
  if (!isBrowserIndexedDBAvailable()) {
    return Array.from(memoryMutations.values());
  }

  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_sync_queue', 'readonly');
    const req = tx.objectStore('offline_sync_queue').getAll();
    req.onsuccess = () => resolve((req.result as OfflineCompletionItemInput[]) || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears synced mutations by `client_mutation_id` after successful server acknowledgment.
 */
export async function clearSyncedOfflineCompletions(mutationIds: string[]): Promise<void> {
  for (const id of mutationIds) {
    memoryMutations.delete(id);
  }

  if (!isBrowserIndexedDBAvailable()) {
    return;
  }

  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    const store = tx.objectStore('offline_sync_queue');
    for (const id of mutationIds) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Persists a synthesized Academic Lab Report locally so students can re-export PDF offline.
 */
export async function saveLabReportLocally(
  report: LabReportGenerateResponse
): Promise<void> {
  memoryReports.set(report.report_id, report);
  if (!isBrowserIndexedDBAvailable()) {
    return;
  }
  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('saved_lab_reports', 'readwrite');
    tx.objectStore('saved_lab_reports').put(report);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAwardedBadgesLocally(badges: AwardedBadgeDTO[]): Promise<void> {
  for (const badge of badges) {
    memoryBadges.set(badge.badge_code, badge);
  }
  if (!isBrowserIndexedDBAvailable()) {
    return;
  }
  const db = await openRekaSainsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('awarded_badges', 'readwrite');
    const store = tx.objectStore('awarded_badges');
    for (const badge of badges) {
      store.put(badge);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
