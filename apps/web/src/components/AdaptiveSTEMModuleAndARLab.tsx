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
import { computeAnalyticalGraphSeries, projectAROverlayToViewport } from '../lib/ar-and-pdf-engine';
import { verifyExperimentStepVision } from '../lib/api-client';
import { severityLabel } from '../lib/labels';
import type { PreparedImage } from '../lib/image';
import { PhotoInput } from './PhotoInput';
import { Button, Panel, Pill, inputClass } from './ui';

export type StepCheckMode = 'AI_VISION' | 'MANUAL';

interface AdaptiveSTEMModuleProps {
  region: RegionCode;
  ageLevel: AgeAdaptiveLevelEnum;
  module: STEMExperimentModuleDTO;
  observationRows: ObservationDataRowDTO[];
  onObservationRowsChange: (rows: ObservationDataRowDTO[]) => void;
  verifiedSteps: Record<number, StepCheckMode>;
  onStepVerified: (stepNumber: number, mode: StepCheckMode) => void;
  quizAnswers: Record<string, number>;
  onQuizAnswer: (questionId: string, optionIndex: number) => void;
}

const VIEW_W = 560;
const VIEW_H = 300;
const GRAPH_W = 520;
const GRAPH_H = 240;
const GRAPH_PAD = 38;

const EMPTY_OVERLAY: AROverlaySimulationDTO = { overlay_type: 'NONE', caption_local: '', vector_paths: [] };

export function AdaptiveSTEMModuleAndARLab({
  region,
  ageLevel,
  module,
  observationRows,
  onObservationRowsChange,
  verifiedSteps,
  onStepVerified,
  quizAnswers,
  onQuizAnswer,
}: AdaptiveSTEMModuleProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [results, setResults] = useState<Record<number, StepVisionVerifyResponse>>({});
  const [stepPhotos, setStepPhotos] = useState<Record<number, string>>({});
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const step = module.steps[activeIdx] ?? module.steps[0];
  const overlay = (step && (results[step.step_number]?.ar_overlay_simulation ?? step.default_ar_overlay)) || EMPTY_OVERLAY;
  const vectors = useMemo(() => projectAROverlayToViewport(overlay, VIEW_W, VIEW_H), [overlay]);
  const graph = useMemo(
    () => computeAnalyticalGraphSeries(observationRows, GRAPH_W, GRAPH_H, GRAPH_PAD),
    [observationRows]
  );
  const variables = module.scientific_variables_and_graph;
  const result = step ? results[step.step_number] : undefined;
  const background = step ? stepPhotos[step.step_number] : undefined;

  const verifyWithPhoto = async (photo: PreparedImage) => {
    if (!step) return;
    setStepPhotos((p) => ({ ...p, [step.step_number]: photo.dataUrl }));
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyExperimentStepVision(module.experiment_slug, step.step_number, {
        image_base64: photo.dataUrl,
        mime_type: photo.mimeType,
        region,
        age_adaptive_level: ageLevel,
      });
      setResults((p) => ({ ...p, [step.step_number]: res }));
      if (res.is_verified_correct) onStepVerified(step.step_number, 'AI_VISION');
    } catch (err) {
      setVerifyError(`Foto gagal diperiksa. ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setVerifying(false);
    }
  };

  const updateRow = (index: number, field: keyof ObservationDataRowDTO, raw: string) => {
    onObservationRowsChange(
      observationRows.map((row, i) => {
        if (i !== index) return row;
        if (field === 'notes') return { ...row, notes: raw };
        const num = parseFloat(raw);
        return { ...row, [field]: Number.isFinite(num) ? num : 0 };
      })
    );
  };

  const addRow = () =>
    onObservationRowsChange([
      ...observationRows,
      { trial_number: observationRows.length + 1, x_value: 0, y_value: 0, notes: '' },
    ]);

  const removeRow = (index: number) =>
    onObservationRowsChange(
      observationRows.filter((_, i) => i !== index).map((r, i) => ({ ...r, trial_number: i + 1 }))
    );

  const doneCount = module.steps.filter((s) => verifiedSteps[s.step_number]).length;

  return (
    <div className="space-y-4">
      <Panel title={module.title_local} description={module.curriculum_alignment.learning_objective}>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {(
            [
              ['Sains', module.stem_concepts.science],
              ['Teknologi', module.stem_concepts.technology],
              ['Rekayasa', module.stem_concepts.engineering],
              ['Matematika', module.stem_concepts.mathematics],
            ] as const
          ).map(([label, text]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-stone-500">{label}</dt>
              <dd className="mt-0.5 text-stone-800">{text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 border-t border-stone-100 pt-3 font-mono text-xs text-stone-400">
          {module.curriculum_alignment.curriculum_code} · {module.curriculum_alignment.grade_level} ·{' '}
          {module.curriculum_alignment.competency_code}
        </p>
        {module.safety_checks.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {module.safety_checks.map((c) => (
              <li key={c.rule_code} className="flex gap-2 text-sm text-stone-700">
                <Pill tone={c.severity === 'SAFE' ? 'neutral' : 'warn'} className="shrink-0">
                  {severityLabel(c.severity)}
                </Pill>
                <span>{c.message_local}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Langkah kerja" description={`${doneCount} dari ${module.steps.length} langkah selesai`}>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <ol className="space-y-1">
            {module.steps.map((s, idx) => {
              const mode = verifiedSteps[s.step_number];
              return (
                <li key={s.step_number}>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-sm ${
                      idx === activeIdx ? 'bg-stone-100 font-medium text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>Langkah {s.step_number}</span>
                    {mode && <span className="text-xs text-emerald-700">{mode === 'AI_VISION' ? 'terverifikasi' : 'manual'}</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          {step && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-stone-800">{step.instruction}</p>

              {step.requires_vision_verification && (
                <div className="rounded-md border border-stone-200 p-3">
                  <p className="text-xs font-medium text-stone-500">Cek dengan foto</p>
                  <p className="mt-0.5 text-sm text-stone-600">{step.vision_verification_prompt}</p>
                  <div className="mt-3">
                    <PhotoInput onPhoto={verifyWithPhoto} disabled={verifying} captureLabel="Ambil & cek" />
                  </div>
                  {verifying && <p className="mt-2 text-sm text-stone-500">Gemini memeriksa foto…</p>}
                  {verifyError && !verifying && <p className="mt-2 text-sm text-red-700">{verifyError}</p>}
                  {result && !verifying && (
                    <div
                      className={`mt-3 rounded border p-2.5 text-sm ${
                        result.is_verified_correct
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-amber-200 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {result.feedback_message_local}
                      <span className="ml-1 tabular-nums text-xs opacity-70">
                        (keyakinan {Math.round(result.confidence * 100)}%)
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onStepVerified(step.step_number, 'MANUAL')}
                  disabled={Boolean(verifiedSteps[step.step_number])}
                >
                  {verifiedSteps[step.step_number] ? 'Selesai' : 'Tandai selesai'}
                </Button>
                {activeIdx < module.steps.length - 1 && (
                  <Button variant="ghost" onClick={() => setActiveIdx(activeIdx + 1)}>
                    Langkah berikutnya
                  </Button>
                )}
              </div>

              {vectors.length > 0 && (
                <figure className="space-y-2">
                  <svg
                    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                    className="w-full rounded-md border border-stone-200 bg-stone-50"
                    role="img"
                    aria-label={overlay.caption_local}
                  >
                    <defs>
                      {vectors.map((v, i) => (
                        <marker
                          key={i}
                          id={`arrow-${i}`}
                          markerWidth="8"
                          markerHeight="8"
                          refX="6"
                          refY="3"
                          orient="auto"
                        >
                          <path d="M0,0 L0,6 L7,3 z" fill={v.colorHex} />
                        </marker>
                      ))}
                    </defs>
                    {background && (
                      <image href={background} x="0" y="0" width={VIEW_W} height={VIEW_H} preserveAspectRatio="xMidYMid slice" opacity="0.85" />
                    )}
                    {vectors.map((v, i) => (
                      <g key={`${v.label}-${i}`}>
                        <path
                          d={v.svgPathD}
                          stroke={v.colorHex}
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={v.animationStyle === 'FLOWING_PARTICLES' ? '8 8' : undefined}
                          className={v.animationStyle === 'FLOWING_PARTICLES' ? 'animate-dash-flow' : undefined}
                          markerEnd={`url(#arrow-${i})`}
                        />
                        <text
                          x={v.midX}
                          y={v.midY - 10}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#292524"
                          stroke="#fafaf9"
                          strokeWidth="3"
                          paintOrder="stroke"
                        >
                          {v.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                  <figcaption className="text-xs text-stone-500">
                    {overlay.caption_local} Posisi panah adalah ilustrasi konsep, belum ditautkan ke objek di foto.
                  </figcaption>
                </figure>
              )}
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="Data pengamatan"
        actions={<Button onClick={addRow}>Tambah percobaan</Button>}
      >
        {variables && (
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Variabel bebas</p>
              <p className="text-stone-800">{variables.independent_variable}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Variabel terikat</p>
              <p className="text-stone-800">{variables.dependent_variable}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Variabel kontrol</p>
              <p className="text-stone-800">{variables.control_variables.join(', ')}</p>
            </div>
            <div className="sm:col-span-3">
              <p className="text-xs font-medium text-stone-500">Rumus</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {variables.formulas_latex.map((f) => (
                  <code key={f} className="rounded bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-800">
                    {f}
                  </code>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-stone-500">
              <tr className="border-b border-stone-200">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">{variables?.x_axis_label ?? 'x'}</th>
                <th className="py-2 pr-2 font-medium">{variables?.y_axis_label ?? 'y'}</th>
                <th className="py-2 pr-2 font-medium">Catatan</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {observationRows.map((row, i) => (
                <tr key={i}>
                  <td className="py-1 pr-2 tabular-nums text-stone-500">{row.trial_number}</td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      step="any"
                      value={row.x_value}
                      onChange={(e) => updateRow(i, 'x_value', e.target.value)}
                      className={`${inputClass} !w-24`}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="number"
                      step="any"
                      value={row.y_value}
                      onChange={(e) => updateRow(i, 'y_value', e.target.value)}
                      className={`${inputClass} !w-24`}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => updateRow(i, 'notes', e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-1 text-right">
                    <Button variant="ghost" onClick={() => removeRow(i)}>
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {graph.points.length > 1 && (
          <figure className="mt-4">
            <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} className="w-full rounded-md border border-stone-200 bg-white">
              <line x1={GRAPH_PAD} y1={GRAPH_H - GRAPH_PAD} x2={GRAPH_W - GRAPH_PAD} y2={GRAPH_H - GRAPH_PAD} stroke="#a8a29e" />
              <line x1={GRAPH_PAD} y1={GRAPH_PAD / 2} x2={GRAPH_PAD} y2={GRAPH_H - GRAPH_PAD} stroke="#a8a29e" />
              <line
                x1={graph.regressionLine.x1Svg}
                y1={graph.regressionLine.y1Svg}
                x2={graph.regressionLine.x2Svg}
                y2={graph.regressionLine.y2Svg}
                stroke="#0f766e"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              {graph.points.map((pt) => (
                <g key={pt.trialNumber}>
                  <circle cx={pt.svgX} cy={pt.svgY} r="4" fill="#1c1917" />
                  <text x={pt.svgX + 6} y={pt.svgY - 6} fontSize="10" fill="#57534e">
                    ({pt.xValue}, {pt.yValue})
                  </text>
                </g>
              ))}
              <text x={GRAPH_W / 2} y={GRAPH_H - 8} textAnchor="middle" fontSize="11" fill="#78716c">
                {variables?.x_axis_label ?? 'x'}
              </text>
            </svg>
            <figcaption className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-stone-500">
              <span>Sumbu y: {variables?.y_axis_label ?? 'y'}</span>
              <span className="font-mono">
                {graph.regressionLine.equationText} · R² = {graph.regressionLine.rSquared.toFixed(3)}
              </span>
            </figcaption>
          </figure>
        )}
      </Panel>

      {module.reflection_questions.length > 0 && (
        <Panel title="Pertanyaan refleksi">
          <div className="space-y-5">
            {module.reflection_questions.map((q, qi) => {
              const chosen = quizAnswers[q.question_id];
              return (
                <fieldset key={q.question_id}>
                  <legend className="text-sm font-medium text-stone-900">
                    {qi + 1}. {q.prompt}
                  </legend>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((opt, idx) => {
                      const isChosen = chosen === idx;
                      const tone =
                        chosen === undefined || !isChosen
                          ? 'border-stone-200 hover:bg-stone-50'
                          : idx === q.correct_index
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-red-300 bg-red-50';
                      return (
                        <label key={idx} className={`flex cursor-pointer gap-2 rounded border px-3 py-2 text-sm text-stone-800 ${tone}`}>
                          <input
                            type="radio"
                            name={q.question_id}
                            checked={isChosen}
                            onChange={() => onQuizAnswer(q.question_id, idx)}
                            className="mt-0.5"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                  {chosen !== undefined && (
                    <p className="mt-2 text-sm text-stone-600">
                      {chosen === q.correct_index ? 'Benar. ' : 'Belum tepat. '}
                      {q.explanation}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
