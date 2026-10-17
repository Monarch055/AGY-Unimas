'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { matchThreeTierExperiments, scaffoldAdaptiveExperiment } from '../lib/api-client';
import { AGE_LEVELS, ageLevelLabel } from '../lib/labels';
import { WorkspaceScannerAndHazardBanner } from '../components/WorkspaceScannerAndHazardBanner';
import { ThreeTierRecommendationExplorer } from '../components/ThreeTierRecommendationExplorer';
import { AdaptiveSTEMModuleAndARLab, type StepCheckMode } from '../components/AdaptiveSTEMModuleAndARLab';
import { AcademicLabReportPDFGenerator } from '../components/AcademicLabReportPDFGenerator';
import { AgentTracePanel, useAgentCalls } from '../components/AgentTracePanel';
import { EmptyState, ErrorState, Pill } from '../components/ui';

type StepId = 'inventory' | 'experiments' | 'lab' | 'report';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'inventory', label: 'Inventaris' },
  { id: 'experiments', label: 'Eksperimen' },
  { id: 'lab', label: 'Praktikum' },
  { id: 'report', label: 'Laporan' },
];

function curriculumFor(region: RegionCode, level: AgeAdaptiveLevelEnum): CurriculumCodeEnum {
  if (region === 'MY') {
    if (level === 'HIGHER_ED_UNI') return 'MY_MATRIKULASI_UNI';
    return level === 'SD_ELEMENTARY' ? 'MY_KSSR' : 'MY_KSSM';
  }
  return level === 'HIGHER_ED_UNI' ? 'ID_DIKTI_HIGHER_ED' : 'ID_KURIKULUM_MERDEKA';
}

function gradeFor(region: RegionCode, level: AgeAdaptiveLevelEnum): string {
  const isMY = region === 'MY';
  switch (level) {
    case 'SD_ELEMENTARY':
      return isMY ? 'DARJAH_5' : 'SD_FASE_C';
    case 'SMP_LOWER_SEC':
      return isMY ? 'TINGKATAN_2' : 'SMP_FASE_D';
    case 'SMA_UPPER_SEC':
      return isMY ? 'TINGKATAN_4' : 'SMA_FASE_E';
    case 'HIGHER_ED_UNI':
      return 'UNIVERSITAS_SEM_2';
  }
}

const selectClass =
  'rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-800 focus:border-stone-500 focus:outline-none';

export default function RekaSainsHomePage() {
  const [region, setRegion] = useState<RegionCode>('ID');
  const [userRole, setUserRole] = useState<UserRole>('STUDENT');
  const [ageLevel, setAgeLevel] = useState<AgeAdaptiveLevelEnum>('SMA_UPPER_SEC');
  const [browserOffline, setBrowserOffline] = useState(false);
  const [step, setStep] = useState<StepId>('inventory');

  const [items, setItems] = useState<InventoryItemDTO[]>([]);
  const [hazards, setHazards] = useState<SafetyAlertDTO[]>([]);
  const [matchResponse, setMatchResponse] = useState<RecommendationMatchResponse | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [module, setModule] = useState<STEMExperimentModuleDTO | null>(null);
  const [loadingModule, setLoadingModule] = useState(false);
  const [verifiedSteps, setVerifiedSteps] = useState<Record<number, StepCheckMode>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [observationRows, setObservationRows] = useState<ObservationDataRowDTO[]>([]);

  const calls = useAgentCalls();
  const lastSource = calls[0]?.source;
  const curriculumCode = curriculumFor(region, ageLevel);
  const gradeLevel = gradeFor(region, ageLevel);

  useEffect(() => {
    setBrowserOffline(!navigator.onLine);
    const on = () => setBrowserOffline(false);
    const off = () => setBrowserOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const runMatch = useCallback(
    async (inventory: InventoryItemDTO[]) => {
      setMatching(true);
      setMatchError(null);
      try {
        const res = await matchThreeTierExperiments({
          region,
          curriculum_code: curriculumCode,
          age_adaptive_level: ageLevel,
          grade_level: gradeLevel,
          user_role: userRole,
          inventory_items: inventory.map((i) => ({
            material_slug: i.material_slug,
            quantity: i.quantity,
            unit: i.unit,
          })),
        });
        setMatchResponse(res);
      } catch (err) {
        setMatchError(err instanceof Error ? err.message : String(err));
      } finally {
        setMatching(false);
      }
    },
    [region, curriculumCode, ageLevel, gradeLevel, userRole]
  );

  // Re-match when profile settings change, but only after the user has confirmed an inventory.
  useEffect(() => {
    if (matchResponse && items.length > 0) void runMatch(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runMatch]);

  useEffect(() => {
    if (!selectedSlug) return;
    let active = true;
    setLoadingModule(true);
    setModuleError(null);
    scaffoldAdaptiveExperiment(selectedSlug, {
      region,
      curriculum_code: curriculumCode,
      age_adaptive_level: ageLevel,
      grade_level: gradeLevel,
      user_role: userRole,
    })
      .then((mod) => {
        if (active) setModule(mod);
      })
      .catch((err: unknown) => {
        if (active) {
          setModule(null);
          setModuleError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (active) setLoadingModule(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSlug, region, curriculumCode, ageLevel, gradeLevel, userRole]);

  useEffect(() => {
    setVerifiedSteps({});
    setQuizAnswers({});
    setObservationRows([]);
  }, [selectedSlug]);

  const handleConfirmInventory = async () => {
    setStep('experiments');
    await runMatch(items);
  };

  const handleSelectExperiment = (slug: string) => {
    setSelectedSlug(slug);
    setStep('lab');
  };

  const reflectionAnswers = useMemo(() => {
    if (!module) return [];
    return module.reflection_questions
      .filter((q) => quizAnswers[q.question_id] !== undefined)
      .map((q) => q.options[quizAnswers[q.question_id]]);
  }, [module, quizAnswers]);

  const quizScore = useMemo(() => {
    if (!module || module.reflection_questions.length === 0) return 0;
    const correct = module.reflection_questions.filter(
      (q) => quizAnswers[q.question_id] === q.correct_index
    ).length;
    return Math.round((correct / module.reflection_questions.length) * 100);
  }, [module, quizAnswers]);

  const stepEnabled: Record<StepId, boolean> = {
    inventory: true,
    experiments: matchResponse !== null || matching,
    lab: selectedSlug !== null,
    report: module !== null,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900">RekaSains</h1>
          <p className="text-sm text-stone-500">Eksperimen sains dari barang di sekitarmu</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            aria-label="Negara"
            value={region}
            onChange={(e) => setRegion(e.target.value as RegionCode)}
            className={selectClass}
          >
            <option value="ID">Indonesia</option>
            <option value="MY">Malaysia</option>
          </select>
          <select
            aria-label="Jenjang"
            value={ageLevel}
            onChange={(e) => setAgeLevel(e.target.value as AgeAdaptiveLevelEnum)}
            className={selectClass}
          >
            {AGE_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {ageLevelLabel(lvl, region)}
              </option>
            ))}
          </select>
          <select
            aria-label="Peran"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className={selectClass}
          >
            <option value="STUDENT">Siswa</option>
            <option value="TEACHER">Guru</option>
          </select>
          {browserOffline ? (
            <Pill tone="warn">Offline</Pill>
          ) : lastSource === 'server' || lastSource === 'ai' ? (
            <Pill tone="ok">Server terhubung</Pill>
          ) : lastSource === 'local' ? (
            <Pill tone="warn">Mode lokal</Pill>
          ) : null}
        </div>
      </header>

      <nav aria-label="Tahapan" className="mt-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-stone-200">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            disabled={!stepEnabled[s.id]}
            onClick={() => setStep(s.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:text-stone-300 ${
              step === s.id
                ? 'border-stone-900 font-medium text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="mr-1.5 font-mono text-xs text-stone-400">{i + 1}</span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <main className="min-w-0">
          {step === 'inventory' && (
            <WorkspaceScannerAndHazardBanner
              region={region}
              items={items}
              activeHazards={hazards}
              onInventoryUpdated={(nextItems, nextHazards) => {
                setItems(nextItems);
                setHazards(nextHazards);
              }}
              onConfirm={handleConfirmInventory}
            />
          )}

          {step === 'experiments' &&
            (matching ? (
              <EmptyState>Gemini sedang merancang eksperimen dari bahanmu…</EmptyState>
            ) : matchError ? (
              <ErrorState message={matchError} onRetry={() => void runMatch(items)} />
            ) : matchResponse ? (
              <ThreeTierRecommendationExplorer
                key={`${matchResponse.strict_100_matches.length}-${matchResponse.diy_substitute_matches.length}-${matchResponse.local_micro_shop_matches.length}`}
                region={region}
                matchData={matchResponse}
                selectedExperimentSlug={selectedSlug}
                onSelectExperiment={handleSelectExperiment}
              />
            ) : null)}

          {step === 'lab' &&
            (loadingModule ? (
              <EmptyState>Gemini sedang menyusun modul praktikum…</EmptyState>
            ) : moduleError ? (
              <ErrorState
                message={moduleError}
                onRetry={() => {
                  const slug = selectedSlug;
                  setSelectedSlug(null);
                  setTimeout(() => setSelectedSlug(slug), 0);
                }}
              />
            ) : module ? (
              <AdaptiveSTEMModuleAndARLab
                key={module.experiment_slug}
                region={region}
                ageLevel={ageLevel}
                module={module}
                observationRows={observationRows}
                onObservationRowsChange={setObservationRows}
                verifiedSteps={verifiedSteps}
                onStepVerified={(n, mode) =>
                  setVerifiedSteps((prev) => (prev[n] ? prev : { ...prev, [n]: mode }))
                }
                quizAnswers={quizAnswers}
                onQuizAnswer={(id, idx) => setQuizAnswers((prev) => ({ ...prev, [id]: idx }))}
              />
            ) : null)}

          {step === 'report' && module && (
            <AcademicLabReportPDFGenerator
              key={module.experiment_slug}
              region={region}
              ageLevel={ageLevel}
              module={module}
              observationRows={observationRows}
              verifiedSteps={Object.keys(verifiedSteps).map(Number)}
              reflectionAnswers={reflectionAnswers}
              quizScore={quizScore}
            />
          )}
        </main>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <AgentTracePanel />
        </div>
      </div>
    </div>
  );
}
