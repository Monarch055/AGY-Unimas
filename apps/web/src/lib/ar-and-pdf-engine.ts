/**
 * RekaSains Client Engine (`apps/web/src/lib/ar-and-pdf-engine.ts`)
 * - USP #5: Analytical Graph & Multi-Trial Regression Calculator (SMA & Higher Ed)
 * - USP #9: Normalized AR Coordinate [0.0, 1.0] -> HTML5 Canvas/SVG Vector Projection
 * - USP #10: Dual-Mode (Online + Offline) Academic Lab Report PDF Document Builder
 */

import katex from 'katex';
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

/**
 * Sanitizes and renders a LaTeX mathematical formula into accessible HTML + MathML via KaTeX.
 */
export function renderLatexFormula(rawLatex: string, displayMode = false): string {
  if (!rawLatex) return '';
  let cleaned = rawLatex.trim();
  if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  cleaned = cleaned.replace(/\\\\([a-zA-Z]+)/g, (_match, cmd) => `\\${cmd}`);

  try {
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (_e) {
    return `<code class="font-mono text-cyan-300 font-bold">${escapeHtml(cleaned)}</code>`;
  }
}

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
    ? `Independent Variable (X): ${variablesSpec.independent_variable} | Dependent Variable (Y): ${variablesSpec.dependent_variable} | Controlled Variables: ${variablesSpec.control_variables.join(', ')}`
    : 'Direct observation of physical scientific phenomena following module procedure.';

  const discussionText = isMY
    ? `Based on ${request.observation_data_rows.length} observation data points for the experiment "${experimentTitle}", the variable relationship demonstrates the regression equation ${graph.regressionLine.equationText}. This empirical data verifies the physical laws studied.`
    : `Based on ${request.observation_data_rows.length} observation data points in the experiment "${experimentTitle}", the regression analysis yielded ${graph.regressionLine.equationText}. This empirical data validates the correlation between everyday household apparatus and scientific theory.`;

  return {
    report_id: `offline-rpt-${experimentSlug}-${Date.now()}`,
    title_local: experimentTitle,
    objective_local: isMY
      ? `Investigate and verify the scientific principles of ${experimentTitle} experimentally and quantitatively.`
      : `Analyze and demonstrate the scientific principles of ${experimentTitle} experimentally and quantitatively.`,
    theoretical_summary: variablesSpec
      ? `Governing Equation (LaTeX): ${variablesSpec.formulas_latex.join(' ; ')}`
      : 'Integrated STEM concepts aligned with Kurikulum Merdeka (ID) & KSSR/KSSM (MY).',
    variables_summary: variablesSummary,
    materials_used_list: [
      '2x AA Battery 1.5V (Battery AA)',
      '2x Jumper Wires / Alligator Clips',
      '1x Recycled Aluminum Can / LED Indicator Light',
      '1x Thick Plastic Straw (Functional Substitute for Insulating PVC Pipe)',
    ],
    procedure_summary: [
      'Scan the workbench with RekaSains camera and confirm zero hazardous chemical co-location.',
      'Assemble components following interactive guidance and verify steps with AI Vision Step Checker.',
      'Observe AR Overlay simulation of electron flow / force vectors and record multi-trial observation data.',
    ],
    result_analysis_discussion: discussionText,
    conclusion_local: isMY
      ? `Hypothesis accepted. The experiment "${experimentTitle}" was executed safely and confirmed the relationship ${graph.regressionLine.equationText}.`
      : `Hypothesis confirmed. The experiment "${experimentTitle}" was conducted safely and verified the variable relationship ${graph.regressionLine.equationText}.`,
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
        ? 'HIGHER EDUCATION ACADEMIC LAB REPORT / LAPORAN AMALI UNIVERSITI'
        : 'HIGHER EDUCATION ACADEMIC LAB REPORT / LAPORAN PRAKTIKUM PERGURUAN TINGGI'
      : isMY
      ? 'SECONDARY SCHOOL ACADEMIC LAB REPORT / LAPORAN AMALI SAINS (KSSR / KSSM)'
      : 'SECONDARY SCHOOL ACADEMIC LAB REPORT / LAPORAN PRAKTIKUM SAINS SEKOLAH (KURIKULUM MERDEKA)';

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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.title_local)} - ${escapeHtml(request.student_name)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
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
      <div>Document ID: <code>${escapeHtml(report.report_id)}</code> | Level: <strong>${escapeHtml(request.age_adaptive_level)}</strong></div>
    </div>
  </div>

  <table class="meta-table">
    <tr>
      <td><strong>Student Name:</strong> ${escapeHtml(request.student_name)}</td>
      <td><strong>Institution / School:</strong> ${escapeHtml(request.institution_name)}</td>
    </tr>
    <tr>
      <td><strong>Class / Student ID:</strong> ${escapeHtml(request.class_or_nim)}</td>
      <td><strong>Instructor / Advisor:</strong> ${escapeHtml(request.instructor_name || '-')}</td>
    </tr>
  </table>

  <h2>1. Experimental Objective</h2>
  <p>${escapeHtml(report.objective_local)}</p>

  <h2>2. Theoretical Background, Formulas &amp; Variables</h2>
  <p>${escapeHtml(report.theoretical_summary)}</p>
  ${
    variablesSpec && variablesSpec.formulas_latex && variablesSpec.formulas_latex.length > 0
      ? `<div class="formulas-latex-box" style="margin: 10px 0; padding: 10px 14px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px;">
          <div style="font-size: 9pt; font-weight: bold; color: #475569; margin-bottom: 6px;">Mathematical / Physics Formulas (KaTeX Rendered):</div>
          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: flex-start;">
            ${variablesSpec.formulas_latex.map((f) => `<div style="padding: 4px 10px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px;">${renderLatexFormula(f, false)}</div>`).join('')}
          </div>
        </div>`
      : ''
  }
  <p><strong>Variable Specifications:</strong> ${escapeHtml(report.variables_summary || '-')}</p>

  <h2>3. Apparatus, Materials &amp; Functional Substitutes</h2>
  <ul>${materialsHtml}</ul>

  <h2>4. Experimental Procedure Verified by AI Vision</h2>
  <ol>${proceduresHtml}</ol>

  <h2>5. Observation Data Table &amp; Analytical Graph</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Trial #</th>
        <th>${escapeHtml(variablesSpec?.x_axis_label || 'Independent Variable (X)')}</th>
        <th>${escapeHtml(variablesSpec?.y_axis_label || 'Dependent Variable (Y)')}</th>
        <th>Observation Notes</th>
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

  <h2>6. Scientific Analysis Discussion</h2>
  <p>${escapeHtml(report.result_analysis_discussion)}</p>

  <h2>7. Conclusion</h2>
  <p>${escapeHtml(report.conclusion_local)}</p>

  <div class="footer-sign">
    <div>Generated via <strong>RekaSains AI-Native STEM Lab</strong> on ${escapeHtml(report.generated_at_utc)}</div>
    <div>Signature: ___________________________ (${escapeHtml(request.student_name)})</div>
  </div>
</body>
</html>`;
}
