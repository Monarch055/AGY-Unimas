'use client';

import React, { useState } from 'react';
import type {
  AgeAdaptiveLevelEnum,
  AwardedBadgeDTO,
  LabReportGenerateResponse,
  ObservationDataRowDTO,
  RegionCode,
  STEMExperimentModuleDTO,
} from '@rekasains/shared-types';
import { buildAcademicLabReportPrintableHTML } from '../lib/ar-and-pdf-engine';
import {
  generateAcademicLabReport,
  syncOfflineGamificationProgress,
} from '../lib/api-client';

interface AcademicLabReportProps {
  region: RegionCode;
  ageLevel: AgeAdaptiveLevelEnum;
  module: STEMExperimentModuleDTO;
  observationRows: ObservationDataRowDTO[];
  verifiedSteps: number[];
}

export function AcademicLabReportPDFGenerator({
  region,
  ageLevel,
  module,
  observationRows,
  verifiedSteps,
}: AcademicLabReportProps) {
  const isMY = region === 'MY';
  const [studentName, setStudentName] = useState(
    isMY ? 'Ahmad Danial bin Razak' : 'Budi Santoso'
  );
  const [institutionName, setInstitutionName] = useState(
    ageLevel === 'HIGHER_ED_UNI'
      ? isMY
        ? 'Universiti Malaya (UM)'
        : 'Institut Teknologi Bandung (ITB)'
      : isMY
      ? 'SMK Taman Tun Dr. Ismail'
      : 'SMAN 1 Bandung'
  );
  const [classOrNim, setClassOrNim] = useState(
    ageLevel === 'HIGHER_ED_UNI' ? 'NIM 13522001 / Sem 3' : 'Kelas XI MIPA 1'
  );
  const [instructorName, setInstructorName] = useState(
    isMY ? 'Cikgu Nurul Huda, M.Ed.' : 'Ibu Siti Aminah, S.Pd., M.Si.'
  );

  const [reportDraft, setReportDraft] = useState<LabReportGenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [awardedBadges, setAwardedBadges] = useState<AwardedBadgeDTO[]>([]);
  const [totalXp, setTotalXp] = useState<number>(0);

  const handleSynthesizeReport = async () => {
    setIsGenerating(true);
    try {
      const response = await generateAcademicLabReport(
        module.experiment_slug,
        module.title_local,
        {
          region,
          age_adaptive_level: ageLevel,
          student_name: studentName,
          institution_name: institutionName,
          class_or_nim: classOrNim,
          instructor_name: instructorName,
          result_photo_base64: 'data:image/jpeg;base64,FINAL_EXPERIMENT_PHOTO_VERIFIED',
          observation_data_rows: observationRows,
          reflection_answers: [
            'Lapisan cat dikikis agar elektron dapat mengalir melalui konduktor logam aluminium.',
            'Sedotan plastik tebal mensubstitusi pipa PVC kecil sebagai isolator silindris.',
          ],
        },
        module.scientific_variables_and_graph
      );
      setReportDraft(response);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPrintablePDF = () => {
    if (!reportDraft || typeof window === 'undefined') return;
    const htmlDocument = buildAcademicLabReportPrintableHTML(
      reportDraft,
      {
        region,
        age_adaptive_level: ageLevel,
        student_name: studentName,
        institution_name: institutionName,
        class_or_nim: classOrNim,
        instructor_name: instructorName,
        result_photo_base64: '',
        observation_data_rows: observationRows,
        reflection_answers: [],
      },
      module.scientific_variables_and_graph
    );

    const printWindow = window.open('', '_blank', 'width=900,height=780');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlDocument);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handleSyncOfflineBadges = async () => {
    const mutationId = `11111111-2222-4333-8444-${String(
      module.experiment_slug.length
    ).padStart(12, '0')}`;
    const res = await syncOfflineGamificationProgress({
      completions: [
        {
          client_mutation_id: mutationId,
          experiment_slug: module.experiment_slug,
          completed_at_utc: new Date().toISOString(),
          checked_steps: verifiedSteps.length > 0 ? verifiedSteps : [1, 2, 3],
          quiz_score: 100,
          optional_photo_base64: null,
        },
      ],
    });
    setAwardedBadges(res.newly_awarded_badges);
    setTotalXp(res.total_xp);
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
            USP #10 • LabReportSynthesizerAgent (PDF) + Offline-First Gamification
          </span>
          <h2 className="mt-1 text-xl font-bold text-white">
            {isMY
              ? '4. Penjana Laporan Amali Rasmi (PDF) & Sinkronisasi Lencana Offline'
              : '4. "Lab Report Generator" Otomatis (Format PDF) & Klaim Badge Offline-First'}
          </h2>
          <p className="text-sm text-slate-300">
            {isMY
              ? 'Susun Laporan Amali lengkap (Tajuk, Tujuan, Rumus/Pembolehubah, Alat & Bahan, Jadual/Graf, Perbincangan Sains & Kesimpulan) sedia dihantar kepada guru atau pensyarah.'
              : 'Otomatis menyusun Laporan Praktikum Resmi (Judul, Tujuan, Landasan Teori/Rumus, Alat & Bahan, Langkah Kerja, Foto/Grafik Hasil, Pembahasan Sains & Kesimpulan) siap kumpul ke guru atau dosen.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleSynthesizeReport}
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300"
          >
            {isGenerating
              ? 'Menyusun Laporan...'
              : isMY
              ? '📄 Jana Draf Laporan Amali (AI)'
              : '📄 Susun Laporan Praktikum Otomatis (AI)'}
          </button>
          <button
            type="button"
            onClick={handleSyncOfflineBadges}
            className="rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25"
          >
            🏅 {isMY ? 'Sinkronisasi Progres & Tuntut Lencana' : 'Sinkronisasi Progres & Klaim Badge'}
          </button>
        </div>
      </div>

      {/* Student / University Metadata Inputs */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-400">
            {isMY ? 'Nama Pelajar / Mahasiswa' : 'Nama Siswa / Mahasiswa'}
          </label>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-400">
            {isMY ? 'Sekolah / Universiti' : 'Sekolah / Perguruan Tinggi'}
          </label>
          <input
            type="text"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-400">
            {isMY ? 'Kelas / No. Matrik' : 'Kelas / NIM'}
          </label>
          <input
            type="text"
            value={classOrNim}
            onChange={(e) => setClassOrNim(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-400">
            {isMY ? 'Guru / Pensyarah Pembimbing' : 'Guru / Dosen Pembimbing'}
          </label>
          <input
            type="text"
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </div>
      </div>

      {/* Editable Academic Lab Report Preview & PDF Export */}
      {reportDraft && (
        <div className="mt-5 rounded-xl border border-amber-500/40 bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold uppercase text-amber-300">
                ✏️ Pratinjau Laporan Praktikum (Dapat Diedit Sebelum Cetak PDF)
              </span>
              <p className="text-xs text-slate-400">
                Report ID: {reportDraft.report_id} • {reportDraft.generated_at_utc}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportPrintablePDF}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
            >
              🖨️ {isMY ? 'Muat Turun / Cetak Laporan PDF Rasmi' : 'Unduh / Cetak Laporan Praktikum PDF Resmi'}
            </button>
          </div>

          <div className="mt-3 space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300">1. Tujuan Praktikum:</label>
              <textarea
                rows={2}
                value={reportDraft.objective_local}
                onChange={(e) =>
                  setReportDraft({ ...reportDraft, objective_local: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300">
                2. Pembahasan Analisis Sains (AI Synthesized + Editable):
              </label>
              <textarea
                rows={3}
                value={reportDraft.result_analysis_discussion}
                onChange={(e) =>
                  setReportDraft({
                    ...reportDraft,
                    result_analysis_discussion: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-300">3. Kesimpulan:</label>
              <textarea
                rows={2}
                value={reportDraft.conclusion_local}
                onChange={(e) =>
                  setReportDraft({ ...reportDraft, conclusion_local: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Awarded Offline-First Gamification Badges */}
      {awardedBadges.length > 0 && (
        <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span>🎉 Sinkronisasi Idempoten Berhasil (`client_mutation_id` Terverifikasi)</span>
            <span>Total XP: +{totalXp} XP</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {awardedBadges.map((b) => (
              <span
                key={b.badge_code}
                className="rounded-lg border border-emerald-500/40 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
              >
                🏅 {b.title_local} ({b.badge_code})
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
