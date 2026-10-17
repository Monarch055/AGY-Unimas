/**
 * RekaSains Client Engine (`apps/web/src/lib/ar-and-pdf-engine.ts`)
 * - USP #5: Analytical Graph & Multi-Trial Regression Calculator (SMA & Higher Ed)
 * - USP #9: Normalized AR Coordinate [0.0, 1.0] -> HTML5 Canvas/SVG Vector Projection
 * - USP #10: Dual-Mode (Online + Offline) Academic Lab Report PDF Document Builder
 */

import {
  clampNormalizedCoordinate,
  toViewportPixels,
} from '@rekasains/shared-core';
import type {
  AROverlaySimulationDTO,
  ARVectorPathDTO,
  LabReportGenerateRequest,
  LabReportGenerateResponse,
  ObservationDataRowDTO,
  ScientificVariablesAndGraphSchemaDTO,
} from '@rekasains/shared-types';

export interface ProjectedARVector {
  label: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  angleDeg: number;
  lengthPx: number;
  colorHex: string;
  animationStyle: ARVectorPathDTO['animation_style'];
  svgPathD: string;
}

/**
 * Projects a single normalized ARVectorPathDTO into viewport pixel space
 * with guaranteed [0.0, 1.0] coordinate clamping (FEAT-002 Gate 3 rule).
 */
export function projectARVectorToPixels(
  vector: ARVectorPathDTO,
  viewportWidth: number,
  viewportHeight: number
): ProjectedARVector {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);

  const start = toViewportPixels(
    clampNormalizedCoordinate(vector.start_x_norm),
    clampNormalizedCoordinate(vector.start_y_norm),
    safeWidth,
    safeHeight
  );
  const end = toViewportPixels(
    clampNormalizedCoordinate(vector.end_x_norm),
    clampNormalizedCoordinate(vector.end_y_norm),
    safeWidth,
    safeHeight
  );

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthPx = Math.round(Math.hypot(dx, dy));
  const angleDeg = Number(((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(2));
  const midX = Math.round((start.x + end.x) / 2);
  const midY = Math.round((start.y + end.y) / 2);

  return {
    label: vector.label,
    startX: start.x,
    startY: start.y,
    endX: end.x,
    endY: end.y,
    midX,
    midY,
    angleDeg,
    lengthPx,
    colorHex: vector.color_hex || '#00E5FF',
    animationStyle: vector.animation_style,
    svgPathD: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
  };
}

/**
 * Projects all vectors in an AROverlaySimulationDTO for a given viewport.
 */
export function projectAROverlayToViewport(
  overlay: AROverlaySimulationDTO,
  viewportWidth: number,
  viewportHeight: number
): ProjectedARVector[] {
  if (!overlay || overlay.overlay_type === 'NONE' || !Array.isArray(overlay.vector_paths)) {
    return [];
  }
  return overlay.vector_paths.map((vp) =>
    projectARVectorToPixels(vp, viewportWidth, viewportHeight)
  );
}

export interface AnalyticalGraphPoint {
  trialNumber: number;
  xValue: number;
  yValue: number;
  svgX: number;
  svgY: number;
  notes: string;
}

export interface AnalyticalGraphComputation {
  points: AnalyticalGraphPoint[];
  polylinePointsAttr: string;
  regressionLine: {
    slope: number;
    intercept: number;
    rSquared: number;
    equationText: string;
    x1Svg: number;
    y1Svg: number;
    x2Svg: number;
    y2Svg: number;
  };
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Computes SVG plot coordinates and Ordinary Least Squares (OLS) linear regression
 * for SMA_UPPER_SEC and HIGHER_ED_UNI multi-trial observation tables (USP #5).
 */
export function computeAnalyticalGraphSeries(
  rows: ObservationDataRowDTO[],
  svgWidth = 520,
  svgHeight = 260,
  padding = 40
): AnalyticalGraphComputation {
  const validRows = rows.filter(
    (r) => Number.isFinite(r.x_value) && Number.isFinite(r.y_value)
  );

  if (validRows.length === 0) {
    return {
      points: [],
      polylinePointsAttr: '',
      regressionLine: {
        slope: 0,
        intercept: 0,
        rSquared: 1,
        equationText: 'y = 0.00x + 0.00',
        x1Svg: padding,
        y1Svg: svgHeight - padding,
        x2Svg: svgWidth - padding,
        y2Svg: svgHeight - padding,
      },
      minX: 0,
      maxX: 10,
      minY: 0,
      maxY: 10,
    };
  }

  const xs = validRows.map((r) => r.x_value);
  const ys = validRows.map((r) => r.y_value);

  const minX = Math.min(0, ...xs);
  const maxX = Math.max(...xs, minX + 1);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(...ys, minY + 1);

  const plotW = Math.max(10, svgWidth - padding * 2);
  const plotH = Math.max(10, svgHeight - padding * 2);

  const toSvgX = (x: number): number =>
    Number((padding + ((x - minX) / (maxX - minX || 1)) * plotW).toFixed(2));
  const toSvgY = (y: number): number =>
    Number((svgHeight - padding - ((y - minY) / (maxY - minY || 1)) * plotH).toFixed(2));

  const points: AnalyticalGraphPoint[] = validRows.map((r) => ({
    trialNumber: r.trial_number,
    xValue: r.x_value,
    yValue: r.y_value,
    svgX: toSvgX(r.x_value),
    svgY: toSvgY(r.y_value),
    notes: r.notes,
  }));

  const n = validRows.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const slope = denX > 0 ? Number((num / denX).toFixed(4)) : 0;
  const intercept = Number((meanY - slope * meanX).toFixed(4));
  const rSquared =
    denX > 0 && denY > 0
      ? Number(Math.min(1, Math.max(0, (num * num) / (denX * denY))).toFixed(4))
      : 1;

  const yAtMinX = slope * minX + intercept;
  const yAtMaxX = slope * maxX + intercept;
  const sign = intercept >= 0 ? '+' : '-';

  return {
    points,
    polylinePointsAttr: points.map((p) => `${p.svgX},${p.svgY}`).join(' '),
    regressionLine: {
      slope,
      intercept,
      rSquared,
      equationText: `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)} (R² = ${rSquared.toFixed(3)})`,
      x1Svg: toSvgX(minX),
      y1Svg: toSvgY(yAtMinX),
      x2Svg: toSvgX(maxX),
      y2Svg: toSvgY(yAtMaxX),
    },
    minX,
    maxX,
    minY,
    maxY,
  };
}

function escapeHtml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Synthesizes an offline-capable Academic Lab Report draft when the user is disconnected
 * from the internet, guaranteeing 100% Offline-First PDF generation continuity (FEAT-002 Edge Case #3).
 */
export function buildOfflineLabReportFallback(
  experimentSlug: string,
  experimentTitle: string,
  request: LabReportGenerateRequest,
  variablesSpec?: ScientificVariablesAndGraphSchemaDTO
): LabReportGenerateResponse {
  const graph = computeAnalyticalGraphSeries(request.observation_data_rows);
  const isMY = request.region === 'MY';

  const variablesSummary = variablesSpec
    ? isMY
      ? `Pembolehubah Manipulasi (Bebas): ${variablesSpec.independent_variable} | Pembolehubah Bergerak Balas (Terikat): ${variablesSpec.dependent_variable} | Pembolehubah Dimalarkan (Kontrol): ${variablesSpec.control_variables.join(', ')}`
      : `Variabel Bebas: ${variablesSpec.independent_variable} | Variabel Terikat: ${variablesSpec.dependent_variable} | Variabel Kontrol: ${variablesSpec.control_variables.join(', ')}`
    : isMY
    ? 'Pemerhatian fenomena sains secara langsung mengikut langkah kerja modul.'
    : 'Pengamatan fenomena sains secara langsung sesuai tahapan modul eksperimen.';

  const discussionText = isMY
    ? `Berdasarkan ${request.observation_data_rows.length} titik data pemerhatian bagi eksperimen "${experimentTitle}", hubungan antara pembolehubah menunjukkan persamaan regresi ${graph.regressionLine.equationText}. Fenomena ini mengesahkan hukum fizik/kimia yang dikaji secara empirikal.`
    : `Berdasarkan ${request.observation_data_rows.length} data pengamatan pada praktikum "${experimentTitle}", diperoleh persamaan analisis tren ${graph.regressionLine.equationText}. Data empiris ini membuktikan kesesuaian antara eksperimen alat sekitar dengan teori sains.`;

  return {
    report_id: `offline-rpt-${experimentSlug}-${Date.now()}`,
    title_local: experimentTitle,
    objective_local: isMY
      ? `Mengkaji dan membuktikan prinsip sains pada ${experimentTitle} secara eksperimen dan kuantitatif.`
      : `Menganalisis dan membuktikan prinsip ilmiah pada ${experimentTitle} secara eksperimental dan kuantitatif.`,
    theoretical_summary: variablesSpec
      ? `Rumus Utama (LaTeX): ${variablesSpec.formulas_latex.join(' ; ')}`
      : 'Konsep STEM terintegrasi sesuai Kurikulum Merdeka (ID) & KSSR/KSSM (MY).',
    variables_summary: variablesSummary,
    materials_used_list: [
      '2x Baterai AA 1.5V (Battery AA)',
      '2x Kabel Penghantar / Penjepit Buaya',
      '1x Kaleng Aluminium Bekas / Lampu LED Indikator',
      '1x Sedotan Plastik Tebal (Substitusi Fungsi Pipa Isolator)',
    ],
    procedure_summary: [
      'Memindai area kerja dengan kamera RekaSains dan memastikan bebas dari ko-lokasi bahan berbahaya.',
      'Merakit komponen sesuai panduan interaktif dan memverifikasi langkah melalui AI Vision Step Checker.',
      'Mengamati simulasi AR Overlay aliran elektron/vektor gaya dan mencatat data pengamatan multi-trial.',
    ],
    result_analysis_discussion: discussionText,
    conclusion_local: isMY
      ? `Hipotesis diterima. Eksperimen "${experimentTitle}" berjaya dijalankan dengan selamat dan mengesahkan hubungan ${graph.regressionLine.equationText}.`
      : `Hipotesis terbukti. Praktikum "${experimentTitle}" berhasil dijalankan dengan aman serta membuktikan hubungan variabel ${graph.regressionLine.equationText}.`,
    generated_at_utc: new Date().toISOString(),
  };
}

/**
 * Builds a complete, self-contained HTML5 printable PDF document for School (SD/SMP/SMA)
 * and University (HIGHER_ED_UNI) submissions in Indonesia (`ID`) and Malaysia (`MY`).
 */
export function buildAcademicLabReportPrintableHTML(
  report: LabReportGenerateResponse,
  request: LabReportGenerateRequest,
  variablesSpec?: ScientificVariablesAndGraphSchemaDTO
): string {
  const isMY = request.region === 'MY';
  const graph = computeAnalyticalGraphSeries(request.observation_data_rows);
  const headerBadge =
    request.age_adaptive_level === 'HIGHER_ED_UNI'
      ? isMY
        ? 'LAPORAN AMALI UNIVERSITI / PENGAJIAN TINGGI'
        : 'LAPORAN PRAKTIKUM PERGURUAN TINGGI (STANDAR DIKTI)'
      : isMY
      ? 'LAPORAN AMALI SAINS SEKOLAH (KSSR / KSSM)'
      : 'LAPORAN PRAKTIKUM SAINS SEKOLAH (KURIKULUM MERDEKA)';

  const rowsHtml = request.observation_data_rows
    .map(
      (r) => `
      <tr>
        <td>${r.trial_number}</td>
        <td>${r.x_value}</td>
        <td>${r.y_value}</td>
        <td>${escapeHtml(r.notes)}</td>
      </tr>`
    )
    .join('');

  const materialsHtml = report.materials_used_list
    .map((m) => `<li>${escapeHtml(m)}</li>`)
    .join('');

  const proceduresHtml = report.procedure_summary
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join('');

  const circlesSvg = graph.points
    .map(
      (pt) =>
        `<circle cx="${pt.svgX}" cy="${pt.svgY}" r="5" fill="#0B132B" /><text x="${pt.svgX + 6}" y="${pt.svgY - 6}" font-size="10" fill="#1C2541">(${pt.xValue}, ${pt.yValue})</text>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${isMY ? 'ms-MY' : 'id-ID'}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.title_local)} - ${escapeHtml(request.student_name)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0B132B; line-height: 1.5; font-size: 11pt; }
    .header { border-bottom: 2px solid #0B132B; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .badge { background: #0B132B; color: #00E5FF; padding: 4px 10px; font-size: 9pt; font-weight: bold; border-radius: 4px; display: inline-block; }
    h1 { font-size: 16pt; margin: 8px 0 4px 0; }
    h2 { font-size: 12pt; border-left: 4px solid #00E5FF; padding-left: 8px; margin-top: 16px; margin-bottom: 6px; background: #F1F5F9; padding-top: 3px; padding-bottom: 3px; }
    .meta-table, .data-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .meta-table td { padding: 4px 8px; border: 1px solid #CBD5E1; font-size: 10pt; }
    .data-table th, .data-table td { border: 1px solid #94A3B8; padding: 6px 8px; text-align: left; font-size: 10pt; }
    .data-table th { background: #E2E8F0; }
    .graph-box { border: 1px solid #CBD5E1; padding: 10px; border-radius: 6px; margin-top: 10px; text-align: center; }
    .footer-sign { margin-top: 28px; display: flex; justify-content: space-between; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">${escapeHtml(headerBadge)}</span>
      <h1>${escapeHtml(report.title_local)}</h1>
      <div>ID Dokumen: <code>${escapeHtml(report.report_id)}</code> | Jenjang: <strong>${escapeHtml(request.age_adaptive_level)}</strong></div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td><strong>${isMY ? 'Nama Pelajar / Mahasiswa' : 'Nama Siswa / Mahasiswa'}:</strong> ${escapeHtml(request.student_name)}</td>
      <td><strong>${isMY ? 'Institusi / Sekolah' : 'Sekolah / Universitas'}:</strong> ${escapeHtml(request.institution_name)}</td>
    </tr>
    <tr>
      <td><strong>${isMY ? 'Kelas / No. Matrik' : 'Kelas / NIM'}:</strong> ${escapeHtml(request.class_or_nim)}</td>
      <td><strong>${isMY ? 'Guru / Pensyarah Pembimbing' : 'Guru / Dosen Pembimbing'}:</strong> ${escapeHtml(request.instructor_name || '-')}</td>
    </tr>
  </table>

  <h2>1. ${isMY ? 'Tujuan Amali' : 'Tujuan Praktikum'}</h2>
  <p>${escapeHtml(report.objective_local)}</p>

  <h2>2. ${isMY ? 'Landasan Teori, Rumus & Pembolehubah' : 'Landasan Teori, Rumus & Variabel Penelitian'}</h2>
  <p>${escapeHtml(report.theoretical_summary)}</p>
  <p><strong>${isMY ? 'Spesifikasi Pembolehubah' : 'Spesifikasi Variabel'}:</strong> ${escapeHtml(report.variables_summary || '-')}</p>

  <h2>3. ${isMY ? 'Alat, Bahan & Substitusi Fungsi' : 'Alat, Bahan & Substitusi Fungsi'}</h2>
  <ul>${materialsHtml}</ul>

  <h2>4. ${isMY ? 'Prosedur Langkah Kerja Terverifikasi AI Vision' : 'Prosedur Langkah Kerja Terverifikasi AI Vision'}</h2>
  <ol>${proceduresHtml}</ol>

  <h2>5. ${isMY ? 'Jadual Data Pemerhatian & Graf Analisis' : 'Tabel Data Pengamatan & Grafik Analisis'}</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Trial #</th>
        <th>${escapeHtml(variablesSpec?.x_axis_label || 'Variabel Bebas (X)')}</th>
        <th>${escapeHtml(variablesSpec?.y_axis_label || 'Variabel Terikat (Y)')}</th>
        <th>${isMY ? 'Catatan Pemerhatian' : 'Catatan Pengamatan'}</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="graph-box">
    <div><strong>${escapeHtml(graph.regressionLine.equationText)}</strong></div>
    <svg width="520" height="260" viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="20" width="440" height="200" fill="#F8FAFC" stroke="#94A3B8" />
      <line x1="${graph.regressionLine.x1Svg}" y1="${graph.regressionLine.y1Svg}" x2="${graph.regressionLine.x2Svg}" y2="${graph.regressionLine.y2Svg}" stroke="#10B981" stroke-width="2" stroke-dasharray="5,4" />
      <polyline fill="none" stroke="#00E5FF" stroke-width="2.5" points="${graph.polylinePointsAttr}" />
      ${circlesSvg}
    </svg>
  </div>

  <h2>6. ${isMY ? 'Perbincangan Analisis Sains' : 'Pembahasan Analisis Sains'}</h2>
  <p>${escapeHtml(report.result_analysis_discussion)}</p>

  <h2>7. ${isMY ? 'Kesimpulan' : 'Kesimpulan'}</h2>
  <p>${escapeHtml(report.conclusion_local)}</p>

  <div class="footer-sign">
    <div>Dicetak melalui <strong>RekaSains AI-Native STEM Lab</strong> pada ${escapeHtml(report.generated_at_utc)}</div>
    <div>Tanda Tangan: ___________________________ (${escapeHtml(request.student_name)})</div>
  </div>
</body>
</html>`;
}
