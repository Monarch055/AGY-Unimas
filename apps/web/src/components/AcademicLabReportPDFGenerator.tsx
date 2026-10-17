'use client';

import React, { useState } from 'react';
import type {
  AgeAdaptiveLevelEnum,
  AwardedBadgeDTO,
  LabReportGenerateRequest,
  LabReportGenerateResponse,
  ObservationDataRowDTO,
  RegionCode,
  STEMExperimentModuleDTO,
} from '@rekasains/shared-types';
import { generateAcademicLabReport, syncOfflineGamificationProgress } from '../lib/api-client';
import { buildAcademicLabReportPrintableHTML } from '../lib/ar-and-pdf-engine';
import type { PreparedImage } from '../lib/image';
import { PhotoInput } from './PhotoInput';
import { Button, Panel, Pill, inputClass } from './ui';

interface AcademicLabReportProps {
  region: RegionCode;
  ageLevel: AgeAdaptiveLevelEnum;
  module: STEMExperimentModuleDTO;
  observationRows: ObservationDataRowDTO[];
  verifiedSteps: number[];
  reflectionAnswers: string[];
  quizScore: number;
}

function newMutationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AcademicLabReportPDFGenerator({
  region,
  ageLevel,
  module,
  observationRows,
  verifiedSteps,
  reflectionAnswers,
  quizScore,
}: AcademicLabReportProps) {
  const isUni = ageLevel === 'HIGHER_ED_UNI';
  const [studentName, setStudentName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [classOrNim, setClassOrNim] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [draft, setDraft] = useState<LabReportGenerateResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ xp: number; badges: AwardedBadgeDTO[] } | null>(null);

  const buildRequest = (): LabReportGenerateRequest => ({
    region,
    age_adaptive_level: ageLevel,
    student_name: studentName.trim(),
    institution_name: institutionName.trim(),
    class_or_nim: classOrNim.trim(),
    instructor_name: instructorName.trim() || undefined,
    result_photo_base64: photo?.dataUrl ?? '',
    observation_data_rows: observationRows,
    reflection_answers: reflectionAnswers,
  });

  const missingFields = [
    !studentName.trim() && 'nama',
    !institutionName.trim() && 'sekolah/kampus',
    !classOrNim.trim() && (isUni ? 'NIM' : 'kelas'),
  ].filter(Boolean) as string[];

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      setDraft(
        await generateAcademicLabReport(
          module.experiment_slug,
          module.title_local,
          buildRequest(),
          module.scientific_variables_and_graph
        )
      );
    } catch (err) {
      setError(`Laporan gagal disusun. ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const print = () => {
    if (!draft) return;
    const html = buildAcademicLabReportPrintableHTML(draft, buildRequest(), module.scientific_variables_and_graph);
    const win = window.open('', '_blank', 'width=900,height=780');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const saveProgress = async () => {
    const res = await syncOfflineGamificationProgress({
      completions: [
        {
          client_mutation_id: newMutationId(),
          experiment_slug: module.experiment_slug,
          completed_at_utc: new Date().toISOString(),
          checked_steps: verifiedSteps,
          quiz_score: quizScore,
          optional_photo_base64: null,
        },
      ],
    });
    setProgress({ xp: res.total_xp, badges: res.newly_awarded_badges });
  };

  return (
    <div className="space-y-4">
      <Panel title="Identitas laporan" description="Data ini hanya dipakai untuk kop laporan.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-stone-600">Nama</span>
            <input className={`${inputClass} mt-1`} value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">{isUni ? 'Kampus' : 'Sekolah'}</span>
            <input className={`${inputClass} mt-1`} value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">{isUni ? 'NIM / semester' : 'Kelas'}</span>
            <input className={`${inputClass} mt-1`} value={classOrNim} onChange={(e) => setClassOrNim(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">{isUni ? 'Dosen' : 'Guru'} (opsional)</span>
            <input className={`${inputClass} mt-1`} value={instructorName} onChange={(e) => setInstructorName(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-600">Foto hasil praktikum (opsional)</p>
          <div className="mt-2 flex flex-wrap items-start gap-4">
            <PhotoInput onPhoto={setPhoto} captureLabel="Ambil foto hasil" />
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.dataUrl} alt="Foto hasil praktikum" className="h-24 rounded-md border border-stone-200 object-cover" />
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4 text-sm text-stone-500">
          <span>{verifiedSteps.length}/{module.steps.length} langkah selesai</span>
          <span>{observationRows.length} data pengamatan</span>
          <span>{reflectionAnswers.length}/{module.reflection_questions.length} refleksi dijawab</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={generate} disabled={generating || missingFields.length > 0}>
            {generating ? 'Gemini menyusun laporan…' : draft ? 'Susun ulang draf' : 'Susun draf laporan'}
          </Button>
          {missingFields.length > 0 && (
            <span className="text-sm text-stone-500">Lengkapi {missingFields.join(', ')}.</span>
          )}
        </div>
        {error && !generating && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </Panel>

      {draft && (
        <Panel
          title="Draf laporan"
          actions={
            <>
              <Button onClick={print}>Cetak / simpan PDF</Button>
              <Button variant="ghost" onClick={saveProgress}>
                Simpan progres
              </Button>
            </>
          }
        >
          <article className="space-y-4 text-sm leading-relaxed text-stone-800">
            <h3 className="text-base font-semibold text-stone-900">{draft.title_local}</h3>
            <Section title="Tujuan">{draft.objective_local}</Section>
            <Section title="Landasan teori">
              <p>{draft.theoretical_summary}</p>
              {draft.variables_summary && <p className="mt-1 text-stone-600">{draft.variables_summary}</p>}
            </Section>
            <Section title="Alat dan bahan">
              <ul className="list-disc pl-5">
                {draft.materials_used_list.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Section>
            <Section title="Prosedur">
              <ol className="list-decimal pl-5">
                {draft.procedure_summary.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </Section>
            <Section title="Pembahasan">{draft.result_analysis_discussion}</Section>
            <Section title="Kesimpulan">{draft.conclusion_local}</Section>
            <p className="font-mono text-xs text-stone-400">
              {draft.report_id} · {draft.generated_at_utc}
            </p>
          </article>

          {progress && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm text-stone-600">
              <span>Progres tersimpan · {progress.xp} XP</span>
              {progress.badges.map((b) => (
                <Pill key={b.badge_code}>{b.title_local}</Pill>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-xs font-medium uppercase tracking-wide text-stone-500">{title}</h4>
      <div className="mt-1">{children}</div>
    </section>
  );
}
