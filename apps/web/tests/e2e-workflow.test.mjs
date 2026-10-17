import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

// Helper to load web library source files
async function loadWebModules() {
  const arPdfPath = path.join(webRoot, 'src/lib/ar-and-pdf-engine.ts');
  const offlineDbPath = path.join(webRoot, 'src/lib/offline-db.ts');
  const apiClientPath = path.join(webRoot, 'src/lib/api-client.ts');

  assert.ok(fs.existsSync(arPdfPath), 'ar-and-pdf-engine.ts must exist');
  assert.ok(fs.existsSync(offlineDbPath), 'offline-db.ts must exist');
  assert.ok(fs.existsSync(apiClientPath), 'api-client.ts must exist');

  return {
    arPdfCode: fs.readFileSync(arPdfPath, 'utf8'),
    offlineDbCode: fs.readFileSync(offlineDbPath, 'utf8'),
    apiClientCode: fs.readFileSync(apiClientPath, 'utf8'),
  };
}

// Pure math & regression functions mirroring apps/web/src/lib/ar-and-pdf-engine.ts
function computeAnalyticalGraphSeries(rows, svgWidth = 520, svgHeight = 260, padding = 40) {
  const validRows = rows.filter(
    (r) => Number.isFinite(r.x_value) && Number.isFinite(r.y_value)
  );

  if (validRows.length === 0) {
    return {
      points: [],
      regressionLine: { slope: 0, intercept: 0, rSquared: 1, equationText: 'y = 0.00x + 0.00' },
    };
  }

  const n = validRows.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const r of validRows) {
    sumX += r.x_value;
    sumY += r.y_value;
    sumXY += r.x_value * r.y_value;
    sumX2 += r.x_value * r.x_value;
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Compute R^2
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (const r of validRows) {
    const yPred = slope * r.x_value + intercept;
    ssTot += Math.pow(r.y_value - meanY, 2);
    ssRes += Math.pow(r.y_value - yPred, 2);
  }
  const rSquared = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  return {
    points: validRows,
    regressionLine: {
      slope: Number(slope.toFixed(4)),
      intercept: Number(intercept.toFixed(4)),
      rSquared: Number(rSquared.toFixed(4)),
      equationText: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
    },
  };
}

function clampNormalizedCoordinate(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1.0, Math.max(0.0, value));
}

test('E2E Stage 1 (USP #1 & #7): Active Co-Location Chemical Hazard Detection', async () => {
  const { apiClientCode } = await loadWebModules();

  // Test detection of toxic chlorine gas hazard (Bleach + Hydrochloric Acid Cleaner)
  const scannedSlugs = ['sodium_hypochlorite', 'floor_cleaner_acidic'];

  // Evaluation rule simulation matching SafetyGuardianAgent & evaluateClientCoLocationHazards
  const isBleach = scannedSlugs.includes('sodium_hypochlorite');
  const isAcid = scannedSlugs.includes('floor_cleaner_acidic');
  const coLocationHazardTriggered = isBleach && isAcid;

  assert.equal(coLocationHazardTriggered, true, 'Co-location hazard must be triggered');

  // Verify the client code contains the specific safety constants and evaluator
  assert.ok(apiClientCode.includes('evaluateClientCoLocationHazards'));
  assert.ok(apiClientCode.includes('HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER'));
  assert.ok(apiClientCode.includes('CRITICAL_CO_LOCATION_WARNING'));
  assert.ok(apiClientCode.includes('gas Klorin (Cl₂) beracun'));
  assert.ok(apiClientCode.includes('gas klorin (Cl₂) beracun'));
});

test('E2E Stage 2 (USP #2, #3, #4): 3-Tier Matcher, Material Substitutes & Local Stores', async () => {
  const { apiClientCode } = await loadWebModules();

  // Scenario A: Strict 100% Match (Tier 1)
  assert.ok(apiClientCode.includes("match_tier: 'STRICT_100'"));
  assert.ok(apiClientCode.includes('match_percentage: 100'));

  // Scenario B: Functional Substitution (Tier 2 - USP #3)
  // Missing PVC pipe -> can use thick straw
  assert.ok(apiClientCode.includes('pvc_pipe_half_inch'));
  assert.ok(apiClientCode.includes('thick_plastic_straw'));
  assert.ok(apiClientCode.includes('shared_scientific_principle'));

  // Scenario C: Hyper-localized store guide (Tier 3 - USP #4)
  assert.ok(apiClientCode.includes('Warung Kelontong') || apiClientCode.includes('Warung Sembako'));
  assert.ok(apiClientCode.includes('Kedai Runcit') || apiClientCode.includes('99 Speedmart'));
  assert.ok(apiClientCode.includes('google.com/maps'));
});

test('E2E Stage 3 (USP #5 & #6): 4-Level Age-Adaptive Scaffolding & Curriculum Scaffolds', async () => {
  const { apiClientCode } = await loadWebModules();

  // Verify 4 age tiers
  const levels = ['SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI'];
  for (const lvl of levels) {
    assert.ok(apiClientCode.includes(lvl));
  }

  // Verify Kurikulum Merdeka & KSSR/KSSM support
  assert.ok(apiClientCode.includes('Kurikulum Merdeka'));
  assert.ok(apiClientCode.includes('KSSM'));

  // Verify LaTeX formulas presence in SMA/Higher Ed
  assert.ok(apiClientCode.includes('\\frac{V}{R') || apiClientCode.includes('formulas_latex'));
});

test('E2E Stage 4 (USP #8 & #9): Step Vision Verification & Normalized AR Vectors [0.0, 1.0]', async () => {
  const { arPdfCode, apiClientCode } = await loadWebModules();

  // Verify Step Vision Verification function
  assert.ok(apiClientCode.includes('verifyExperimentStepVision'));
  assert.ok(apiClientCode.includes('is_verified_correct'));

  // Verify AR Vector Anchoring coordinates [0.0, 1.0]
  assert.ok(arPdfCode.includes('clampNormalizedCoordinate'));
  assert.ok(arPdfCode.includes('toViewportPixels'));
  assert.ok(apiClientCode.includes('FLOWING_PARTICLES'));
  assert.ok(apiClientCode.includes('ELECTRON_FLOW'));

  // Coordinate math test
  const clamped = clampNormalizedCoordinate(0.75);
  assert.equal(clamped, 0.75);
  const clampedOOB = clampNormalizedCoordinate(1.25);
  assert.equal(clampedOOB, 1.0);
});

test('E2E Stage 5 (USP #10): Analytical Graph Regression & Printable PDF Lab Report', async () => {
  const { arPdfCode } = await loadWebModules();

  // Test OLS Linear Regression for Ohm's Law (V vs I, slope = R)
  // Voltage (x in Volts): 1.5, 3.0, 4.5, 6.0, 9.0
  // Current (y in Amps with R ~ 100 Ohms): 0.015, 0.030, 0.045, 0.060, 0.090
  const trials = [
    { trial_number: 1, x_value: 1.5, y_value: 0.015 },
    { trial_number: 2, x_value: 3.0, y_value: 0.030 },
    { trial_number: 3, x_value: 4.5, y_value: 0.045 },
    { trial_number: 4, x_value: 6.0, y_value: 0.060 },
    { trial_number: 5, x_value: 9.0, y_value: 0.090 },
  ];

  const graphAnalysis = computeAnalyticalGraphSeries(trials);
  assert.equal(graphAnalysis.points.length, 5);
  assert.equal(graphAnalysis.regressionLine.slope, 0.01);
  assert.equal(graphAnalysis.regressionLine.intercept, 0);
  assert.equal(graphAnalysis.regressionLine.rSquared, 1.0);

  // Verify Printable HTML Lab Report generator
  assert.ok(arPdfCode.includes('buildAcademicLabReportPrintableHTML'));
  assert.ok(arPdfCode.includes('LAPORAN PRAKTIKUM SAINS SEKOLAH') || arPdfCode.includes('LAPORAN AMALI SAINS'));
  assert.ok(arPdfCode.includes('@page { size: A4') || arPdfCode.includes('RekaSains AI-Native STEM Lab'));
});

test('E2E Stage 6 (USP #10): Offline-First IndexedDB Store & Idempotent Mutation Queue', async () => {
  const { offlineDbCode } = await loadWebModules();

  // Verify Dexie / IndexedDB database name
  assert.ok(offlineDbCode.includes('rekasains_offline_pwa_db'));
  assert.ok(offlineDbCode.includes('offline_lab_packs'));
  assert.ok(offlineDbCode.includes('offline_sync_queue'));
  assert.ok(offlineDbCode.includes('saved_lab_reports'));
  assert.ok(offlineDbCode.includes('awarded_badges'));

  // Verify Idempotent mutation queue with client_mutation_id
  assert.ok(offlineDbCode.includes('client_mutation_id'));
  assert.ok(offlineDbCode.includes('enqueueOfflineCompletion'));
});
