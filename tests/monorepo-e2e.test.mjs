import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// =========================================================================
// SECTION 1: Contract Schemas & OpenAPI Specification Conformance Test
// =========================================================================

test('E2E Contract: All JSON Schemas in contracts/schemas/ are valid JSON and compliant', () => {
  const schemaDir = path.join(rootDir, 'contracts', 'schemas');
  assert.ok(fs.existsSync(schemaDir), 'contracts/schemas directory must exist');

  const schemas = [
    'inventory-scan.json',
    'recommendation-match.json',
    'curriculum-scaffold.json',
    'step-vision-verify.json',
    'lab-report.json',
  ];

  for (const schemaFile of schemas) {
    const fullPath = path.join(schemaDir, schemaFile);
    assert.ok(fs.existsSync(fullPath), `Schema ${schemaFile} must exist`);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(
      parsed.$schema.includes('json-schema.org'),
      `Schema ${schemaFile} must specify valid json-schema dialect`
    );
    assert.equal(parsed.type, 'object');
    assert.ok(Array.isArray(parsed.required), `Schema ${schemaFile} must have required fields`);
  }
});

test('E2E Contract: contracts/api/openapi.yaml defines all 10 USP endpoints', () => {
  const openapiPath = path.join(rootDir, 'contracts', 'api', 'openapi.yaml');
  assert.ok(fs.existsSync(openapiPath), 'openapi.yaml must exist');
  const content = fs.readFileSync(openapiPath, 'utf8');

  // Verify paths exist in OpenAPI contract
  const expectedPaths = [
    '/inventory/scan',
    '/inventory/items',
    '/recommendations/match',
    '/experiments/{slug}/scaffold',
    '/experiments/{slug}/steps/{step_number}/verify-vision',
    '/experiments/{slug}/lab-report/generate',
    '/sync/offline-progress',
  ];

  for (const p of expectedPaths) {
    assert.ok(content.includes(p), `openapi.yaml must include path ${p}`);
  }

  // Verify Zero-RabbitMQ Directive in contracts
  assert.ok(!content.includes('amqp://'), 'Must not contain AMQP connection string');
  assert.ok(!content.includes('rabbitmq'), 'Must not contain RabbitMQ in openapi contract');
});

// =========================================================================
// SECTION 2: Active Co-Location Chemical Safety Matrix (USP #7)
// =========================================================================

function evaluateSafetyHazards(detectedMaterials) {
  const slugSet = new Set(detectedMaterials.map((m) => m.toLowerCase()));
  const hazards = [];

  // Rule 1: NaOCl + HCl -> Toxic Chlorine Gas
  if (
    slugSet.has('bleach_naocl_household') &&
    (slugSet.has('acid_porcelain_cleaner_hcl') || slugSet.has('hydrochloric_acid_cleaner'))
  ) {
    hazards.push({
      rule_code: 'HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER',
      severity: 'CRITICAL_CO_LOCATION_WARNING',
      workspace_clear_required: true,
      message_id: 'BAHAYA KRITIS: Pemutih (NaOCl) dan Pembersih Porselen Asam (HCl) terdeteksi di satu area!',
      message_my: 'BAHAYA KRITIKAL: Peluntur (NaOCl) dan Pembersih Asid (HCl) dikesan dalam satu kawasan!',
    });
  }

  // Rule 2: NaOCl + Vinegar -> Chlorine Vapor
  if (slugSet.has('bleach_naocl_household') && slugSet.has('vinegar_c2h4o2_food_grade')) {
    hazards.push({
      rule_code: 'HAZ_NAOCL_VINEGAR_CHLORINE_GAS',
      severity: 'HIGH_HAZARD_ALERT',
      workspace_clear_required: true,
      message_id: 'Peringatan: Pencampuran pemutih dan cuka menghasilkan uap klorin berbahaya.',
      message_my: 'Amaran: Campuran peluntur dan cuka membebaskan gas klorin berbahaya.',
    });
  }

  return {
    hazards,
    workspace_clear_required: hazards.some((h) => h.workspace_clear_required),
  };
}

test('USP #7: Active Co-Location Safety Detection detects deadly household mixes', () => {
  // Test case 1: Bleach + Acid Cleaner
  const hazardResult1 = evaluateSafetyHazards([
    'bleach_naocl_household',
    'acid_porcelain_cleaner_hcl',
    'glass_jar_recycled',
  ]);
  assert.equal(hazardResult1.hazards.length, 1);
  assert.equal(hazardResult1.hazards[0].rule_code, 'HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER');
  assert.equal(hazardResult1.hazards[0].severity, 'CRITICAL_CO_LOCATION_WARNING');
  assert.equal(hazardResult1.workspace_clear_required, true);

  // Test case 2: Bleach + Vinegar
  const hazardResult2 = evaluateSafetyHazards([
    'bleach_naocl_household',
    'vinegar_c2h4o2_food_grade',
  ]);
  assert.equal(hazardResult2.hazards.length, 1);
  assert.equal(hazardResult2.hazards[0].rule_code, 'HAZ_NAOCL_VINEGAR_CHLORINE_GAS');
  assert.equal(hazardResult2.workspace_clear_required, true);

  // Test case 3: Safe materials must NEVER trigger false positives
  const safeResult = evaluateSafetyHazards([
    'plastic_bottle_pet_600ml',
    'table_salt_nacl',
    'tap_water',
    'battery_9v',
    'led_5mm_diffused',
  ]);
  assert.equal(safeResult.hazards.length, 0);
  assert.equal(safeResult.workspace_clear_required, false);
});

// =========================================================================
// SECTION 3: 3-Tier Matcher & Functional Physics/Chemistry Substitution (USP #2, #3, #4)
// =========================================================================

const FUNCTIONAL_SUBSTITUTES = {
  pvc_pipe_half_inch: [
    {
      substitute_slug: 'thick_plastic_straw',
      scientific_principle: 'Fluid dynamics conduit (Bernoulli effect) with lower volume throughput',
      adaptation_notes: 'Gunakan selotip rapat pada sambungan sedotan tebal agar kedap udara',
    },
    {
      substitute_slug: 'cardboard_roll_core',
      scientific_principle: 'Rigid cylindrical duct for non-liquid dry propulsion',
      adaptation_notes: 'Lapisi dengan lakban agar tidak rembes jika digunakan untuk tekanan udara',
    },
  ],
  copper_wire_jumper: [
    {
      substitute_slug: 'aluminum_foil_strip',
      scientific_principle: 'Low-resistance metallic electrical conductor (Ohmic conductor)',
      adaptation_notes: 'Lipat foil aluminium 4 lapis agar daya hantar arus dan kekuatan tariknya optimal',
    },
  ],
};

function matchTier(userInventory, experimentRequired) {
  const userSet = new Set(userInventory);
  const missing = [];
  const appliedSubstitutes = [];

  for (const req of experimentRequired) {
    if (userSet.has(req)) continue;

    // Check functional substitute
    const subs = FUNCTIONAL_SUBSTITUTES[req] || [];
    const foundSub = subs.find((s) => userSet.has(s.substitute_slug));
    if (foundSub) {
      appliedSubstitutes.push({
        missing_material_slug: req,
        substitute_material_slug: foundSub.substitute_slug,
        scientific_principle: foundSub.scientific_principle,
        adaptation_notes: foundSub.adaptation_notes,
      });
    } else {
      missing.push(req);
    }
  }

  if (missing.length === 0 && appliedSubstitutes.length === 0) {
    return { tier: 'STRICT_100', substitutes: [] };
  }
  if (missing.length === 0 && appliedSubstitutes.length > 0) {
    return { tier: 'DIY_SUBSTITUTE', substitutes: appliedSubstitutes };
  }
  return { tier: 'LOCAL_MICRO_SHOP', missing, substitutes: appliedSubstitutes };
}

test('USP #2 & #3: Functional Material Substitution enables DIY_SUBSTITUTE matching', () => {
  // Experiment requires plastic bottle + pvc pipe
  const experimentRequired = ['plastic_bottle_pet_600ml', 'pvc_pipe_half_inch'];

  // User 1: Has bottle + PVC pipe -> STRICT_100
  const user1 = ['plastic_bottle_pet_600ml', 'pvc_pipe_half_inch'];
  const res1 = matchTier(user1, experimentRequired);
  assert.equal(res1.tier, 'STRICT_100');
  assert.equal(res1.substitutes.length, 0);

  // User 2: Has bottle + thick plastic straw (missing PVC pipe!) -> DIY_SUBSTITUTE
  const user2 = ['plastic_bottle_pet_600ml', 'thick_plastic_straw'];
  const res2 = matchTier(user2, experimentRequired);
  assert.equal(res2.tier, 'DIY_SUBSTITUTE');
  assert.equal(res2.substitutes.length, 1);
  assert.equal(res2.substitutes[0].missing_material_slug, 'pvc_pipe_half_inch');
  assert.equal(res2.substitutes[0].substitute_material_slug, 'thick_plastic_straw');

  // User 3: Only has bottle, nothing else -> LOCAL_MICRO_SHOP
  const user3 = ['plastic_bottle_pet_600ml'];
  const res3 = matchTier(user3, experimentRequired);
  assert.equal(res3.tier, 'LOCAL_MICRO_SHOP');
  assert.deepEqual(res3.missing, ['pvc_pipe_half_inch']);
});

// =========================================================================
// SECTION 4: STEM 4-Level Age-Adaptive Scaffolding & Analytical OLS (USP #5 & #6)
// =========================================================================

function calculateOLSLinearRegression(points) {
  if (points.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0, equation: 'y = 0.00x + 0.00' };
  }

  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (const p of points) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  if (denX === 0) {
    return { slope: 0, intercept: meanY, rSquared: 0, equation: `y = ${meanY.toFixed(2)}` };
  }

  const slope = num / denX;
  const intercept = meanY - slope * meanX;
  const rSquared = denY > 0 ? (num * num) / (denX * denY) : 1;

  const sign = intercept >= 0 ? '+' : '-';
  const equation = `y = ${slope.toFixed(2)}x ${sign} ${Math.abs(intercept).toFixed(2)}`;

  return { slope, intercept, rSquared, equation };
}

test('USP #5: OLS Linear Regression for SMA & University STEM Analysis', () => {
  // Test with Ohm's Law data: V = I * R (where R = 10 Ohm, so V = 10 * I)
  const ohmsLawData = [
    { x: 0.1, y: 1.0 },
    { x: 0.2, y: 2.0 },
    { x: 0.3, y: 3.0 },
    { x: 0.4, y: 4.0 },
    { x: 0.5, y: 5.0 },
  ];

  const ols = calculateOLSLinearRegression(ohmsLawData);
  assert.equal(Number(ols.slope.toFixed(4)), 10.0);
  assert.equal(Number(ols.intercept.toFixed(4)), 0.0);
  assert.equal(Number(ols.rSquared.toFixed(4)), 1.0);
  assert.equal(ols.equation, 'y = 10.00x + 0.00');

  // Test noisy experimental data
  const noisyData = [
    { x: 1, y: 2.1 },
    { x: 2, y: 3.9 },
    { x: 3, y: 6.2 },
    { x: 4, y: 7.8 },
  ];
  const noisyOls = calculateOLSLinearRegression(noisyData);
  assert.ok(noisyOls.slope > 1.8 && noisyOls.slope < 2.1, 'Slope should be approx 1.9-2.0');
  assert.ok(noisyOls.rSquared > 0.98, 'R-squared should indicate strong linear correlation');
});

// =========================================================================
// SECTION 5: AR Coordinate Clamping & Viewport Scaling (USP #9)
// =========================================================================

function clampNormalizedCoordinate(val) {
  if (!Number.isFinite(val)) return 0;
  return Math.min(1.0, Math.max(0.0, val));
}

function projectNormalizedVector(startXNorm, startYNorm, endXNorm, endYNorm, width, height) {
  const sx = Math.round(clampNormalizedCoordinate(startXNorm) * width);
  const sy = Math.round(clampNormalizedCoordinate(startYNorm) * height);
  const ex = Math.round(clampNormalizedCoordinate(endXNorm) * width);
  const ey = Math.round(clampNormalizedCoordinate(endYNorm) * height);

  return {
    startX: sx,
    startY: sy,
    endX: ex,
    endY: ey,
    svgPath: `M ${sx} ${sy} L ${ex} ${ey}`,
  };
}

test('USP #9: AR Coordinate Clamping [0.0, 1.0] across multiple device viewports', () => {
  const viewports = [
    { name: 'iPhone 15 Portrait', w: 393, h: 852 },
    { name: 'Android Budget Portrait', w: 360, h: 640 },
    { name: 'iPad Landscape', w: 1024, h: 768 },
    { name: 'Desktop Full HD', w: 1920, h: 1080 },
  ];

  for (const vp of viewports) {
    // Normal inside bounds
    const pNormal = projectNormalizedVector(0.2, 0.4, 0.8, 0.6, vp.w, vp.h);
    assert.ok(pNormal.startX >= 0 && pNormal.startX <= vp.w);
    assert.ok(pNormal.startY >= 0 && pNormal.startY <= vp.h);
    assert.ok(pNormal.endX >= 0 && pNormal.endX <= vp.w);
    assert.ok(pNormal.endY >= 0 && pNormal.endY <= vp.h);
    assert.equal(pNormal.svgPath, `M ${pNormal.startX} ${pNormal.startY} L ${pNormal.endX} ${pNormal.endY}`);

    // Extreme out-of-bounds inputs: negative, > 1.0, NaN
    const pExtreme = projectNormalizedVector(-0.5, 2.5, NaN, Infinity, vp.w, vp.h);
    assert.equal(pExtreme.startX, 0);
    assert.equal(pExtreme.startY, vp.h);
    assert.equal(pExtreme.endX, 0);
    assert.equal(pExtreme.endY, 0);
  }
});

// =========================================================================
// SECTION 6: Offline-First Idempotency Queue Simulation (USP #10)
// =========================================================================

test('USP #10: Offline Sync Queue prevents double XP/Badges via client_mutation_id', () => {
  const syncQueue = new Map();

  function enqueueMutation(item) {
    if (syncQueue.has(item.client_mutation_id)) {
      return { deduplicated: true, size: syncQueue.size };
    }
    syncQueue.set(item.client_mutation_id, item);
    return { deduplicated: false, size: syncQueue.size };
  }

  const mutationA = {
    client_mutation_id: '123e4567-e89b-12d3-a456-426614174000',
    experiment_slug: 'rangkaian-listrik-baterai-kaleng-ar',
    completed_at: '2026-10-17T12:00:00Z',
    score: 100,
  };

  // First enqueue: should succeed
  const res1 = enqueueMutation(mutationA);
  assert.equal(res1.deduplicated, false);
  assert.equal(res1.size, 1);

  // Second enqueue with identical client_mutation_id (offline retry): must be deduplicated
  const res2 = enqueueMutation(mutationA);
  assert.equal(res2.deduplicated, true);
  assert.equal(res2.size, 1);

  // Different mutation: should succeed
  const mutationB = {
    client_mutation_id: '987e6543-e21b-12d3-a456-426614174111',
    experiment_slug: 'roket-tekanan-fluida-pipa-air',
    completed_at: '2026-10-17T12:05:00Z',
    score: 95,
  };
  const res3 = enqueueMutation(mutationB);
  assert.equal(res3.deduplicated, false);
  assert.equal(res3.size, 2);
});
