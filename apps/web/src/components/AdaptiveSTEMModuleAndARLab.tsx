'use client';

import React, { useMemo, useState } from 'react';
import type {
  AgeAdaptiveLevelEnum,
  AROverlaySimulationDTO,
  ObservationDataRowDTO,
  RegionCode,
  STEMExperimentModuleDTO,
  StepVisionVerifyResponse,
} from '@rekasains/shared-types';
import {
  computeAnalyticalGraphSeries,
  projectAROverlayToViewport,
} from '../lib/ar-and-pdf-engine';
import { verifyExperimentStepVision } from '../lib/api-client';
import { LatexRenderer, LatexText } from './LatexRenderer';

interface AdaptiveSTEMModuleProps {
  region: RegionCode;
  ageLevel: AgeAdaptiveLevelEnum;
  isOfflineMode: boolean;
  module: STEMExperimentModuleDTO;
  observationRows: ObservationDataRowDTO[];
  onAgeLevelChange: (level: AgeAdaptiveLevelEnum) => void;
  onObservationRowsChange: (rows: ObservationDataRowDTO[]) => void;
  onStepVerified: (stepNumber: number, mode: 'AI_VISION' | 'OFFLINE_MANUAL') => void;
}

const AGE_LEVEL_LABELS: Record<AgeAdaptiveLevelEnum, { id: string; my: string }> = {
  SD_ELEMENTARY: {
    id: '🎒 Elementary (Stage A–C • Visual Phenomena)',
    my: '🎒 Primary School (Standard 1–6 • Visual)',
  },
  SMP_LOWER_SEC: {
    id: '🔬 Junior High (Stage D • Concepts & Causality)',
    my: '🔬 Lower Secondary (Form 1–3 • Concepts)',
  },
  SMA_UPPER_SEC: {
    id: '📐 Senior High (Stage E–F • LaTeX & Graphs)',
    my: '📐 Upper Secondary (Form 4–5 • Formulas & Graphs)',
  },
  HIGHER_ED_UNI: {
    id: '🎓 University / College (Regression & Uncertainty)',
    my: '🎓 University / Matriculation (Quantitative Analysis)',
  },
};

export function AdaptiveSTEMModuleAndARLab({
  region,
  ageLevel,
  isOfflineMode,
  module,
  observationRows,
  onAgeLevelChange,
  onObservationRowsChange,
  onStepVerified,
}: AdaptiveSTEMModuleProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [verifyingStep, setVerifyingStep] = useState(false);
  const [stepVerificationMap, setStepVerificationMap] = useState<
    Record<number, StepVisionVerifyResponse>
  >({});
  const [manualOfflineSteps, setManualOfflineSteps] = useState<Record<number, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const isMY = region === 'MY';
  const currentStep = module.steps[activeStepIdx] || module.steps[0];

  const activeAROverlay: AROverlaySimulationDTO =
    stepVerificationMap[currentStep?.step_number]?.ar_overlay_simulation ||
    currentStep?.default_ar_overlay || {
      overlay_type: 'NONE',
      caption_local: '',
      vector_paths: [],
    };

  const projectedVectors = useMemo(
    () => projectAROverlayToViewport(activeAROverlay, 560, 280),
    [activeAROverlay]
  );

  const analyticalGraph = useMemo(
    () => computeAnalyticalGraphSeries(observationRows, 520, 240, 38),
    [observationRows]
  );

  const handleCameraVerifyStep = async (stepNumber: number) => {
    setVerifyingStep(true);
    try {
      const response = await verifyExperimentStepVision(
        module.experiment_slug,
        stepNumber,
        {
          image_base64: `data:image/jpeg;base64,STEP_${stepNumber}_ASSEMBLY_SNAPSHOT`,
          mime_type: 'image/jpeg',
          region,
          age_adaptive_level: ageLevel,
        }
      );
      setStepVerificationMap((prev) => ({ ...prev, [stepNumber]: response }));
      if (response.is_verified_correct) {
        onStepVerified(stepNumber, 'AI_VISION');
      }
    } finally {
      setVerifyingStep(false);
    }
  };

  const handleOfflineManualCheckpoint = (stepNumber: number) => {
    setManualOfflineSteps((prev) => ({ ...prev, [stepNumber]: true }));
    onStepVerified(stepNumber, 'OFFLINE_MANUAL');
  };

  const handleUpdateObservationRow = (
    index: number,
    field: keyof ObservationDataRowDTO,
    rawValue: string
  ) => {
    const updated = observationRows.map((row, idx) => {
      if (idx !== index) return row;
      if (field === 'notes') {
        return { ...row, notes: rawValue };
      }
      const num = parseFloat(rawValue);
      return {
        ...row,
        [field]: Number.isFinite(num) ? num : 0,
      };
    });
    onObservationRowsChange(updated);
  };

  const handleAddTrialRow = () => {
    const nextTrial = observationRows.length + 1;
    onObservationRowsChange([
      ...observationRows,
      {
        trial_number: nextTrial,
        x_value: nextTrial * 1.5,
        y_value: nextTrial * 120,
        notes: `Trial measurement #${nextTrial}`,
      },
    ]);
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-xl">
      {/* Header & USP #5 4-Level Age-Adaptive Filter */}
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
            USP #5, #6, #8 &amp; #9 • CurriculumScaffolderAgent + StepVisionAndARAgent
          </span>
          <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-emerald-300">
            📦 OfflineLabPack v{module.offline_pack_version} Cached in IndexedDB
          </span>
        </div>

        <h2 className="text-xl font-bold text-white">
          3. {module.title_local}
        </h2>

        {/* 4-Level Age-Adaptive Filter Buttons */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Scientific Depth &amp; Difficulty Level (USP #5):
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(AGE_LEVEL_LABELS) as AgeAdaptiveLevelEnum[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onAgeLevelChange(lvl)}
                className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                  ageLevel === lvl
                    ? 'border-cyan-400 bg-cyan-500/20 text-white'
                    : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                {isMY ? AGE_LEVEL_LABELS[lvl].my : AGE_LEVEL_LABELS[lvl].id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEM Concepts Breakdown */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs font-bold text-cyan-400">🔬 SCIENCE</div>
          <div className="mt-1 text-xs text-slate-200">
            <LatexText text={module.stem_concepts.science} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs font-bold text-emerald-400">💻 TECHNOLOGY</div>
          <p className="mt-1 text-xs text-slate-200">{module.stem_concepts.technology}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs font-bold text-amber-400">⚙️ ENGINEERING</div>
          <p className="mt-1 text-xs text-slate-200">{module.stem_concepts.engineering}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs font-bold text-purple-400">📐 MATHEMATICS</div>
          <div className="mt-1 text-xs text-slate-200">
            <LatexText text={module.stem_concepts.mathematics} />
          </div>
        </div>
      </div>

      {/* USP #8 & #9: Interactive Step-by-Step AI Vision Checker & HTML5 Canvas/SVG AR Overlay Simulation */}
      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* Step-by-Step Guidance & Vision Checkpoint */}
        <div className="lg:col-span-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
              📸 Step-by-Step Guidance &amp; AI Vision Step Checker (USP #8)
            </h3>
            <span className="text-xs text-slate-400">
              Step {currentStep?.step_number} / {module.steps.length}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            {module.steps.map((st, idx) => {
              const verified =
                stepVerificationMap[st.step_number]?.is_verified_correct ||
                manualOfflineSteps[st.step_number];
              return (
                <button
                  key={st.step_number}
                  type="button"
                  onClick={() => setActiveStepIdx(idx)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                    activeStepIdx === idx
                      ? 'bg-cyan-500 text-slate-950'
                      : verified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {verified ? '✓ ' : ''}Step {st.step_number}
                </button>
              );
            })}
          </div>

          {currentStep && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-3.5">
              <p className="text-sm font-medium text-white">{currentStep.instruction}</p>
              {currentStep.requires_vision_verification && (
                <p className="mt-1.5 text-xs text-cyan-300">
                  🎯 <strong>AI Camera Verification Criteria:</strong> {currentStep.vision_verification_prompt}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {currentStep.requires_vision_verification && (
                  <button
                    type="button"
                    disabled={verifyingStep}
                    onClick={() => handleCameraVerifyStep(currentStep.step_number)}
                    className="rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                  >
                    {verifyingStep
                      ? 'Analyzing Assembly...'
                      : '📷 Verify Step with AI Camera'}
                  </button>
                )}

                {/* Hybrid Smart Checkpoint Offline Fallback (FEAT-002 Edge Case #1) */}
                <button
                  type="button"
                  onClick={() => handleOfflineManualCheckpoint(currentStep.step_number)}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  ✓ {isOfflineMode ? 'Self Checkpoint (Offline Mode Active)' : 'Proceed Manually / Offline Checkpoint'}
                </button>
              </div>

              {stepVerificationMap[currentStep.step_number] && (
                <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-950/40 p-3 text-xs text-emerald-200">
                  <div className="font-bold">
                    ✅ AI Vision Confidence:{' '}
                    {Math.round(stepVerificationMap[currentStep.step_number].confidence * 100)}%
                  </div>
                  <p className="mt-1">
                    {stepVerificationMap[currentStep.step_number].feedback_message_local}
                  </p>
                </div>
              )}

              {manualOfflineSteps[currentStep.step_number] &&
                !stepVerificationMap[currentStep.step_number] && (
                  <div className="mt-3 rounded-lg border border-amber-500/50 bg-amber-950/30 p-2.5 text-xs text-amber-200">
                    ✓ Step {currentStep.step_number} confirmed via Hybrid Offline Checkpoint.
                  </div>
                )}
            </div>
          )}
        </div>

        {/* USP #9: Augmented Reality (AR) Overlay Simulation Canvas/SVG */}
        <div className="lg:col-span-6 rounded-xl border border-cyan-500/40 bg-slate-950/90 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">
              🕶️ Augmented Reality (AR) Overlay Simulation on Physical Objects (USP #9)
            </h3>
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono text-cyan-300">
              {activeAROverlay.overlay_type}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-300">{activeAROverlay.caption_local}</p>

          {/* Interactive SVG/Canvas Coordinate-Anchored AR Viewport */}
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
            <svg
              viewBox="0 0 560 280"
              className="h-60 w-full"
              aria-label="AR Simulation Overlay Viewport"
            >
              <defs>
                <marker
                  id="ar-arrow-cyan"
                  markerWidth="10"
                  markerHeight="10"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#00E5FF" />
                </marker>
                <marker
                  id="ar-arrow-emerald"
                  markerWidth="10"
                  markerHeight="10"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                </marker>
              </defs>

              {/* Simulated Physical Objects on Workbench (Battery AA + Recycled Aluminum Can + Jumper Wires) */}
              <rect
                x="55"
                y="95"
                width="120"
                height="90"
                rx="10"
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="2"
              />
              <rect x="175" y="122" width="12" height="36" rx="3" fill="#F59E0B" />
              <text x="72" y="138" fill="#F8FAFC" fontSize="12" fontWeight="bold">
                AA Battery 1.5V
              </text>
              <text x="72" y="158" fill="#94A3B8" fontSize="11">
                (-) Negative | Positive (+)
              </text>

              <rect
                x="380"
                y="85"
                width="125"
                height="110"
                rx="16"
                fill="#334155"
                stroke="#94A3B8"
                strokeWidth="2"
              />
              <text x="395" y="136" fill="#F8FAFC" fontSize="12" fontWeight="bold">
                Aluminum Can
              </text>
              <text x="395" y="156" fill="#38BDF8" fontSize="10">
                Stripped Conductor
              </text>

              {/* Coordinate-Anchored Animated AR Vector Paths */}
              {projectedVectors.map((vec, index) => (
                <g key={`${vec.label}-${index}`}>
                  <path
                    d={vec.svgPathD}
                    stroke={vec.colorHex}
                    strokeWidth="4"
                    strokeDasharray={
                      vec.animationStyle === 'FLOWING_PARTICLES' ? '10,6' : 'none'
                    }
                    markerEnd={
                      index % 2 === 0 ? 'url(#ar-arrow-cyan)' : 'url(#ar-arrow-emerald)'
                    }
                  />
                  <circle cx={vec.startX} cy={vec.startY} r="5" fill={vec.colorHex} />
                  <circle cx={vec.endX} cy={vec.endY} r="5" fill={vec.colorHex} />
                  <rect
                    x={vec.midX - 85}
                    y={vec.midY - 24}
                    width="170"
                    height="20"
                    rx="4"
                    fill="#0B132B"
                    stroke={vec.colorHex}
                    strokeWidth="1"
                  />
                  <text
                    x={vec.midX}
                    y={vec.midY - 10}
                    textAnchor="middle"
                    fill={vec.colorHex}
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {vec.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* USP #5: SMA & Higher Ed Scientific Variables, LaTeX Equations, Observation Table & Analytical Graph */}
      {module.scientific_variables_and_graph && (
        <div className="mt-5 rounded-xl border border-purple-500/40 bg-purple-950/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">
              📊 Physics Formulas (LaTeX), Scientific Variables &amp; Analytical Graph (Senior High / University)
            </h3>
            <div className="flex flex-wrap items-center gap-2.5">
              {module.scientific_variables_and_graph.formulas_latex.map((latex, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center rounded-xl bg-slate-900/95 px-3 py-1.5 border border-cyan-500/40 shadow-sm text-cyan-200"
                  title={`LaTeX: ${latex}`}
                >
                  <LatexRenderer formula={latex} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <strong className="text-cyan-300">
                Independent Variable (X):
              </strong>
              <p className="mt-1 text-slate-200">
                {module.scientific_variables_and_graph.independent_variable}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <strong className="text-emerald-300">
                Dependent Variable (Y):
              </strong>
              <p className="mt-1 text-slate-200">
                {module.scientific_variables_and_graph.dependent_variable}
              </p>
            </div>
            <div className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
              <strong className="text-amber-300">
                Controlled Variables:
              </strong>
              <p className="mt-1 text-slate-200">
                {module.scientific_variables_and_graph.control_variables.join(', ')}
              </p>
            </div>
          </div>

          {/* Multi-Trial Observation Data Table & Live SVG Regression Plotter */}
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  📋 Multi-Trial Observation Data Table
                </span>
                <button
                  type="button"
                  onClick={handleAddTrialRow}
                  className="rounded-lg bg-purple-500/30 px-2.5 py-1 text-xs font-bold text-purple-200 hover:bg-purple-500/40"
                >
                  + Add Trial
                </button>
              </div>
              <table className="mt-2 w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="py-1.5">Trial</th>
                    <th className="py-1.5">{module.scientific_variables_and_graph.x_axis_label}</th>
                    <th className="py-1.5">{module.scientific_variables_and_graph.y_axis_label}</th>
                    <th className="py-1.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {observationRows.map((row, idx) => (
                    <tr key={row.trial_number}>
                      <td className="py-1.5 font-bold">#{row.trial_number}</td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          step="0.1"
                          value={row.x_value}
                          onChange={(e) =>
                            handleUpdateObservationRow(idx, 'x_value', e.target.value)
                          }
                          className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          step="1"
                          value={row.y_value}
                          onChange={(e) =>
                            handleUpdateObservationRow(idx, 'y_value', e.target.value)
                          }
                          className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                        />
                      </td>
                      <td className="py-1.5">
                        <input
                          type="text"
                          value={row.notes}
                          onChange={(e) =>
                            handleUpdateObservationRow(idx, 'notes', e.target.value)
                          }
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-6 rounded-xl border border-slate-700 bg-slate-950 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-300">
                  📈 Automated OLS Linear Regression Graph
                </span>
                <span className="font-mono text-emerald-300">
                  {analyticalGraph.regressionLine.equationText}
                </span>
              </div>
              <svg
                viewBox="0 0 520 240"
                className="mt-2 h-48 w-full rounded bg-slate-900"
              >
                <line
                  x1="38"
                  y1="202"
                  x2="482"
                  y2="202"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                <line
                  x1="38"
                  y1="20"
                  x2="38"
                  y2="202"
                  stroke="#64748B"
                  strokeWidth="1.5"
                />
                <line
                  x1={analyticalGraph.regressionLine.x1Svg}
                  y1={analyticalGraph.regressionLine.y1Svg}
                  x2={analyticalGraph.regressionLine.x2Svg}
                  y2={analyticalGraph.regressionLine.y2Svg}
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
                <polyline
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="2.5"
                  points={analyticalGraph.polylinePointsAttr}
                />
                {analyticalGraph.points.map((pt) => (
                  <g key={pt.trialNumber}>
                    <circle cx={pt.svgX} cy={pt.svgY} r="5" fill="#F59E0B" />
                    <text
                      x={pt.svgX + 6}
                      y={pt.svgY - 6}
                      fill="#E2E8F0"
                      fontSize="10"
                    >
                      ({pt.xValue}, {pt.yValue})
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* USP #6: Curriculum-Aligned Reflection Quiz */}
      <div className="mt-5 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
          🧠 Curriculum Discussion &amp; Reflection Questions (USP #6)
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {module.reflection_questions.map((q) => {
            const chosen = selectedAnswers[q.question_id];
            return (
              <div
                key={q.question_id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs"
              >
                <p className="font-bold text-white">{q.prompt}</p>
                <div className="mt-2 space-y-1.5">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [q.question_id]: idx }))
                      }
                      className={`block w-full rounded-lg border px-3 py-1.5 text-left transition ${
                        chosen === idx
                          ? idx === q.correct_index
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                            : 'border-red-500 bg-red-500/20 text-red-200'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {chosen !== undefined && (
                  <p className="mt-2 text-slate-300">
                    <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
