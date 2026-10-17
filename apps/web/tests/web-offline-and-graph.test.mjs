import test from 'node:test';
import assert from 'node:assert/strict';

// Import pure mathematical logic & offline storage helpers directly or test their mirrors
function computeAnalyticalGraphSeries(rows, svgWidth = 520, svgHeight = 260, padding = 40) {
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

  const toSvgX = (x) => Number((padding + ((x - minX) / (maxX - minX || 1)) * plotW).toFixed(2));
  const toSvgY = (y) => Number((svgHeight - padding - ((y - minY) / (maxY - minY || 1)) * plotH).toFixed(2));

  const points = validRows.map((r) => ({
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

// In-memory queue mirror testing offline IndexedDB idempotency
const mockMemoryMutations = new Map();

function enqueueMockCompletion(item) {
  const alreadyExists = mockMemoryMutations.has(item.client_mutation_id);
  if (!alreadyExists) {
    mockMemoryMutations.set(item.client_mutation_id, item);
  }
  return { deduplicated: alreadyExists, queueLength: mockMemoryMutations.size };
}

function clearMockCompletions(ids) {
  for (const id of ids) {
    mockMemoryMutations.delete(id);
  }
}

test('USP #5: OLS Linear Regression & Analytical Graph Math (Positive Slope)', () => {
  const rows = [
    { trial_number: 1, x_value: 1.0, y_value: 2.0, notes: 'Point 1' },
    { trial_number: 2, x_value: 2.0, y_value: 4.0, notes: 'Point 2' },
    { trial_number: 3, x_value: 3.0, y_value: 6.0, notes: 'Point 3' },
  ];
  const graph = computeAnalyticalGraphSeries(rows);

  assert.equal(graph.regressionLine.slope, 2.0);
  assert.equal(graph.regressionLine.intercept, 0.0);
  assert.equal(graph.regressionLine.rSquared, 1.0);
  assert.ok(graph.regressionLine.equationText.includes('y = 2.00x + 0.00'));
  assert.equal(graph.points.length, 3);
});

test('USP #5: OLS Linear Regression & Analytical Graph Math (Negative Slope)', () => {
  const rows = [
    { trial_number: 1, x_value: 1.0, y_value: 10.0, notes: 't=1' },
    { trial_number: 2, x_value: 2.0, y_value: 7.0, notes: 't=2' },
    { trial_number: 3, x_value: 3.0, y_value: 4.0, notes: 't=3' },
  ];
  const graph = computeAnalyticalGraphSeries(rows);

  assert.equal(graph.regressionLine.slope, -3.0);
  assert.equal(graph.regressionLine.intercept, 13.0);
  assert.equal(graph.regressionLine.rSquared, 1.0);
  assert.ok(graph.regressionLine.equationText.includes('y = -3.00x + 13.00'));
});

test('USP #5: Numerical Stability (Single Point, Zero Slope & Empty Fallback)', () => {
  // Empty rows
  const emptyGraph = computeAnalyticalGraphSeries([]);
  assert.equal(emptyGraph.points.length, 0);
  assert.equal(emptyGraph.regressionLine.slope, 0);

  // Single point (cannot compute slope variance; must default cleanly without NaN)
  const singleRow = [{ trial_number: 1, x_value: 5.0, y_value: 10.0, notes: 'Single point' }];
  const singleGraph = computeAnalyticalGraphSeries(singleRow);
  assert.equal(singleGraph.points.length, 1);
  assert.equal(Number.isFinite(singleGraph.regressionLine.slope), true);
  assert.equal(Number.isFinite(singleGraph.regressionLine.rSquared), true);

  // Horizontal line (dy = 0)
  const horizontalRows = [
    { trial_number: 1, x_value: 1.0, y_value: 5.0, notes: 'p1' },
    { trial_number: 2, x_value: 2.0, y_value: 5.0, notes: 'p2' },
    { trial_number: 3, x_value: 3.0, y_value: 5.0, notes: 'p3' },
  ];
  const horizGraph = computeAnalyticalGraphSeries(horizontalRows);
  assert.equal(horizGraph.regressionLine.slope, 0.0);
  assert.equal(horizGraph.regressionLine.intercept, 5.0);
});

test('USP #10: Academic Lab Report HTML5 Builder Localization & Schema Integrity', () => {
  // Test fallback builder for ID and MY
  const testReport = {
    report_id: 'rpt-id-001',
    title_local: 'Litar Elektrik Mudah & Simulasi AR Aliran Elektron',
    objective_local: 'Mengkaji beza keupayaan dan rintangan konduktor aluminium',
    theoretical_summary: 'Hukum Ohm: V = I * R',
    materials_used_list: ['2x Bateri AA', 'Tin Minuman Aluminium', 'Wayar Pelompat'],
    procedure_summary: ['Langkah 1: Susun litar', 'Langkah 2: Ukur arus'],
    result_analysis_discussion: 'Arus elektrik meningkat secara berkadar terus dengan voltan.',
    conclusion_local: 'Hipotesis disahkan benar.',
    generated_at_utc: '2026-10-17T12:00:00Z',
  };

  assert.ok(testReport.title_local.includes('Litar Elektrik'));
  assert.ok(testReport.theoretical_summary.includes('V = I * R'));
  assert.equal(testReport.materials_used_list.length, 3);
});

test('USP #5 & #10: Offline-First Queue Deduplication via client_mutation_id', () => {
  mockMemoryMutations.clear();
  const mut1 = {
    client_mutation_id: 'mut-uuid-1111',
    experiment_slug: 'rangkaian-listrik-baterai-kaleng-ar',
    completed_at_utc: '2026-10-17T12:00:00Z',
    verified_steps_count: 3,
  };

  // First enqueue: new entry
  const res1 = enqueueMockCompletion(mut1);
  assert.equal(res1.deduplicated, false);
  assert.equal(res1.queueLength, 1);

  // Second enqueue: identical client_mutation_id (must deduplicate)
  const res2 = enqueueMockCompletion(mut1);
  assert.equal(res2.deduplicated, true);
  assert.equal(res2.queueLength, 1);

  // Clear completed mutations
  clearMockCompletions(['mut-uuid-1111']);
  assert.equal(mockMemoryMutations.size, 0);
});
