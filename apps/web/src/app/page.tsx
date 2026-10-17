'use client';

import React, { useEffect, useState } from 'react';
import type {
  AgeAdaptiveLevelEnum,
  CurriculumCodeEnum,
  InventoryItemDTO,
  ObservationDataRowDTO,
  RecommendationMatchResponse,
  RegionCode,
  SafetyAlertDTO,
  STEMExperimentModuleDTO,
  UserRole,
} from '@rekasains/shared-types';
import {
  matchThreeTierExperiments,
  scaffoldAdaptiveExperiment,
  scanWorkspacePhoto,
} from '../lib/api-client';
import { WorkspaceScannerAndHazardBanner } from '../components/WorkspaceScannerAndHazardBanner';
import { ThreeTierRecommendationExplorer } from '../components/ThreeTierRecommendationExplorer';
import { AdaptiveSTEMModuleAndARLab } from '../components/AdaptiveSTEMModuleAndARLab';
import { AcademicLabReportPDFGenerator } from '../components/AcademicLabReportPDFGenerator';

export default function RekaSainsHomePage() {
  const [region, setRegion] = useState<RegionCode>('ID');
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [ageLevel, setAgeLevel] = useState<AgeAdaptiveLevelEnum>('SMA_UPPER_SEC');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const [inventoryItems, setInventoryItems] = useState<InventoryItemDTO[]>([]);
  const [activeHazards, setActiveHazards] = useState<SafetyAlertDTO[]>([]);
  const [matchResponse, setMatchResponse] = useState<RecommendationMatchResponse | null>(
    null
  );
  const [selectedExperimentSlug, setSelectedExperimentSlug] = useState<string>(
    'rangkaian-listrik-baterai-kaleng-ar'
  );
  const [activeModule, setActiveModule] = useState<STEMExperimentModuleDTO | null>(null);
  const [verifiedSteps, setVerifiedSteps] = useState<number[]>([]);
  const [observationRows, setObservationRows] = useState<ObservationDataRowDTO[]>([
    { trial_number: 1, x_value: 1.5, y_value: 120, notes: '1 AA Battery (1.5V) — Dim Glow' },
    { trial_number: 2, x_value: 3.0, y_value: 242, notes: '2 Batteries in Series (3.0V) — Bright Glow' },
    { trial_number: 3, x_value: 4.5, y_value: 360, notes: '3 Batteries in Series (4.5V) — Very Bright Glow' },
  ]);

  const curriculumCode: CurriculumCodeEnum =
    region === 'MY'
      ? ageLevel === 'HIGHER_ED_UNI'
        ? 'MY_MATRIKULASI_UNI'
        : ageLevel === 'SD_ELEMENTARY'
        ? 'MY_KSSR'
        : 'MY_KSSM'
      : ageLevel === 'HIGHER_ED_UNI'
      ? 'ID_DIKTI_HIGHER_ED'
      : 'ID_KURIKULUM_MERDEKA';

  const gradeLevel =
    ageLevel === 'SD_ELEMENTARY'
      ? region === 'MY'
        ? 'DARJAH_5'
        : 'SD_FASE_C'
      : ageLevel === 'SMP_LOWER_SEC'
      ? region === 'MY'
        ? 'TINGKATAN_2'
        : 'SMP_FASE_D'
      : ageLevel === 'SMA_UPPER_SEC'
      ? region === 'MY'
        ? 'TINGKATAN_4'
        : 'SMA_FASE_E'
      : 'UNIVERSITAS_SEM_2';

  // Register PWA Service Worker safely in client browser lifecycle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOfflineMode(!window.navigator.onLine);
      const handleOnline = () => setIsOfflineMode(false);
      const handleOffline = () => setIsOfflineMode(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if ('serviceWorker' in window.navigator) {
        window.navigator.serviceWorker.register('/sw.js').catch(() => {
          // Non-blocking in dev mode
        });
      }
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Initial workspace scan & 3-tier match bootstrap
  useEffect(() => {
    let active = true;
    (async () => {
      const scanRes = await scanWorkspacePhoto({
        image_base64: 'data:image/jpeg;base64,REKASAIN_INITIAL_SAFE_SCAN',
        mime_type: 'image/jpeg',
        region,
      });
      if (!active) return;
      setInventoryItems(scanRes.detected_items);
      setActiveHazards(scanRes.active_workspace_hazards);

      const matchRes = await matchThreeTierExperiments({
        region,
        curriculum_code: curriculumCode,
        age_adaptive_level: ageLevel,
        grade_level: gradeLevel,
        user_role: userRole,
        inventory_items: scanRes.detected_items.map((i) => ({
          material_slug: i.material_slug,
          quantity: i.quantity,
          unit: i.unit,
        })),
      });
      if (!active) return;
      setMatchResponse(matchRes);
    })();
    return () => {
      active = false;
    };
  }, [region, ageLevel, userRole, curriculumCode, gradeLevel]);

  // Scaffold experiment module whenever experiment slug, region, or age level changes
  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await scaffoldAdaptiveExperiment(selectedExperimentSlug, {
        region,
        curriculum_code: curriculumCode,
        age_adaptive_level: ageLevel,
        grade_level: gradeLevel,
        user_role: userRole,
      });
      if (active) {
        setActiveModule(mod);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedExperimentSlug, region, ageLevel, userRole, curriculumCode, gradeLevel]);

  const handleInventoryUpdated = async (
    updatedItems: InventoryItemDTO[],
    updatedHazards: SafetyAlertDTO[]
  ) => {
    setInventoryItems(updatedItems);
    setActiveHazards(updatedHazards);
    const matchRes = await matchThreeTierExperiments({
      region,
      curriculum_code: curriculumCode,
      age_adaptive_level: ageLevel,
      grade_level: gradeLevel,
      user_role: userRole,
      inventory_items: updatedItems.map((i) => ({
        material_slug: i.material_slug,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });
    setMatchResponse(matchRes);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Top Navigation & Dual-Country / Offline Status Bar */}
      <header className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500 px-3 py-0.5 text-xs font-extrabold text-slate-950">
                REKASAINS v1.1.0 • 6-AGENT GOOGLE ADK
              </span>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                10 Core USPs Active
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              RekaSains — Engineering Science from Household Resources
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              AI-Native STEM Lab, Physical-to-Digital Inventory Mapping, Interactive Vision/AR Step Guidance &amp; Automated Academic Lab Report PDF Generator
            </p>
          </div>

          {/* Country (ID / MY), Role & Offline Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRegion('ID')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                region === 'ID'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🇮🇩 Indonesia (Kurikulum Merdeka • Rp)
            </button>
            <button
              type="button"
              onClick={() => setRegion('MY')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                region === 'MY'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🇲🇾 Malaysia (KSSR / KSSM • RM)
            </button>
            <button
              type="button"
              onClick={() =>
                setUserRole((prev) => (prev === 'STUDENT' ? 'TEACHER' : 'STUDENT'))
              }
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              👤 Role: {userRole === 'STUDENT' ? 'Student / University' : 'Teacher / Lecturer'}
            </button>
            <button
              type="button"
              onClick={() => setIsOfflineMode((prev) => !prev)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                isOfflineMode
                  ? 'bg-amber-400 text-slate-950'
                  : 'border border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {isOfflineMode ? '📡 Offline Mode (IndexedDB)' : '🌐 Online Mode (ADK Live)'}
            </button>
          </div>
        </div>
      </header>

      {/* Section 1: USP #1 & #7 — Camera Inventory Scanner & Active Co-Location Hazard Banner */}
      <WorkspaceScannerAndHazardBanner
        region={region}
        items={inventoryItems}
        activeHazards={activeHazards}
        onInventoryUpdated={handleInventoryUpdated}
      />

      {/* Section 2: USP #2, #3, #4 — 3-Tier Matcher, Functional Substitutes & Local Shop Deep-Links */}
      {matchResponse && (
        <ThreeTierRecommendationExplorer
          region={region}
          matchData={matchResponse}
          selectedExperimentSlug={selectedExperimentSlug}
          onSelectExperiment={(slug) => setSelectedExperimentSlug(slug)}
        />
      )}

      {/* Section 3: USP #5, #6, #8, #9 — 4-Level Adaptive Module, LaTeX/Graph, AI Vision Step Checker & AR Overlay */}
      {activeModule && (
        <AdaptiveSTEMModuleAndARLab
          region={region}
          ageLevel={ageLevel}
          isOfflineMode={isOfflineMode}
          module={activeModule}
          observationRows={observationRows}
          onAgeLevelChange={(lvl) => setAgeLevel(lvl)}
          onObservationRowsChange={(rows) => setObservationRows(rows)}
          onStepVerified={(stepNum) =>
            setVerifiedSteps((prev) =>
              prev.includes(stepNum) ? prev : [...prev, stepNum]
            )
          }
        />
      )}

      {/* Section 4: USP #10 — Automated Academic Lab Report PDF Generator & Offline Badges Sync */}
      {activeModule && (
        <AcademicLabReportPDFGenerator
          region={region}
          ageLevel={ageLevel}
          module={activeModule}
          observationRows={observationRows}
          verifiedSteps={verifiedSteps}
        />
      )}
    </main>
  );
}
