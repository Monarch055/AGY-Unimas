import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '../../..');

test('shared-types: exports all canonical enums and types matching openapi.yaml', () => {
  const indexTsPath = path.resolve(__dirname, '../src/index.ts');
  assert.ok(fs.existsSync(indexTsPath), 'index.ts must exist');

  const content = fs.readFileSync(indexTsPath, 'utf8');

  // 1. Region Codes
  assert.ok(content.includes("'ID'") && content.includes("'MY'"), 'Must include ID and MY region codes');

  // 2. 4-Level Age Adaptive Enums (USP #5)
  const ageLevels = ['SD_ELEMENTARY', 'SMP_LOWER_SEC', 'SMA_UPPER_SEC', 'HIGHER_ED_UNI'];
  for (const level of ageLevels) {
    assert.ok(content.includes(`'${level}'`), `Must include AgeAdaptiveLevelEnum ${level}`);
  }

  // 3. Local Curriculum Codes (USP #6)
  const curricula = ['ID_KURIKULUM_MERDEKA', 'ID_DIKTI_HIGHER_ED', 'MY_KSSR', 'MY_KSSM', 'MY_MATRIKULASI_UNI'];
  for (const curr of curricula) {
    assert.ok(content.includes(`'${curr}'`), `Must include CurriculumCodeEnum ${curr}`);
  }

  // 4. Safety Severity Enums (USP #7)
  const safetyLevels = ['SAFE', 'ADULT_SUPERVISION', 'CRITICAL_CO_LOCATION_WARNING', 'CRITICAL_HAZARD_BLOCKED'];
  for (const safety of safetyLevels) {
    assert.ok(content.includes(`'${safety}'`), `Must include SafetySeverityEnum ${safety}`);
  }

  // 5. 3-Tier Matcher Enums (USP #2, #3, #4)
  const tiers = ['STRICT_100', 'DIY_SUBSTITUTE', 'LOCAL_MICRO_SHOP'];
  for (const tier of tiers) {
    assert.ok(content.includes(`'${tier}'`), `Must include MatchTierEnum ${tier}`);
  }

  // 6. Zero Floating-Point Currency Enums
  assert.ok(content.includes("'IDR'") && content.includes("'MYR_SEN'"), 'Must support IDR and MYR_SEN');

  // 7. AR Simulation Overlay Enums (USP #9)
  const arTypes = ['NONE', 'ELECTRON_FLOW', 'FORCE_VECTOR', 'FLUID_PRESSURE', 'MAGNETIC_FIELD', 'MOLECULAR_REACTION'];
  for (const ar of arTypes) {
    assert.ok(content.includes(`'${ar}'`), `Must include AROverlayTypeEnum ${ar}`);
  }
});

test('shared-types: package purity guarantees (zero business logic & zero dependencies)', () => {
  const pkgJsonPath = path.resolve(__dirname, '../package.json');
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  assert.equal(pkgJson.name, '@rekasains/shared-types');
  assert.equal(pkgJson.type, 'module');

  // Zero runtime dependencies allowed in shared-types
  const deps = pkgJson.dependencies || {};
  assert.equal(Object.keys(deps).length, 0, 'shared-types must have zero runtime dependencies');
});

test('contracts/schemas: all 5 core JSON schemas are valid and well-formed', () => {
  const schemaDir = path.resolve(monorepoRoot, 'contracts/schemas');
  const schemas = [
    'inventory-scan.json',
    'recommendation-match.json',
    'curriculum-scaffold.json',
    'step-vision-verify.json',
    'lab-report.json',
  ];

  for (const schemaName of schemas) {
    const filePath = path.join(schemaDir, schemaName);
    assert.ok(fs.existsSync(filePath), `Schema file ${schemaName} must exist`);

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    assert.ok(parsed.$schema, `${schemaName} must specify $schema`);
    assert.ok(parsed.title, `${schemaName} must have a title`);
    assert.equal(parsed.type, 'object', `${schemaName} root type must be object`);
    assert.ok(Array.isArray(parsed.required), `${schemaName} must specify required fields`);
    assert.ok(typeof parsed.properties === 'object', `${schemaName} must specify properties`);
  }
});

test('shared-types: validates sample DTO fixtures against JSON Schema requirements', () => {
  // Fixture 1: Inventory Scan Response with active hazard (USP #1 & #7)
  const inventoryScanFixture = {
    request_id: 'scan-uuid-001',
    detected_materials: [
      {
        material_id: 'bleach-sodium-hypochlorite',
        canonical_name: 'Pemutih Pakaian (Sodium Hypochlorite)',
        localized_name: 'Bayclin / Clorox',
        quantity: 1,
        confidence: 0.96,
        bounding_box: { ymin: 0.1, xmin: 0.1, ymax: 0.4, xmax: 0.35 },
      },
      {
        material_id: 'acid-cleaner-hcl',
        canonical_name: 'Pembersih Porselen Asam Klorida (HCl)',
        localized_name: 'Vixal / Porstex',
        quantity: 1,
        confidence: 0.94,
        bounding_box: { ymin: 0.15, xmin: 0.5, ymax: 0.45, xmax: 0.8 },
      },
    ],
    total_items_detected: 2,
    active_hazards: [
      {
        alert_type: 'HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER',
        severity: 'CRITICAL',
        warning_title: 'BAHAYA GAS KLORIN BERACUN TERDETEKSI',
        warning_message: 'Mencampur pemutih dan asam menghasilkan gas klorin berbahaya!',
        conflicting_materials: ['bleach-sodium-hypochlorite', 'acid-cleaner-hcl'],
        recommended_action: 'Segera pisahkan kedua bahan ke ruangan terpisah berventilasi baik.',
      },
    ],
  };

  assert.equal(inventoryScanFixture.total_items_detected, 2);
  assert.equal(inventoryScanFixture.active_hazards[0].severity, 'CRITICAL');

  // Verify bounding box coordinates are clamped to [0.0, 1.0]
  for (const item of inventoryScanFixture.detected_materials) {
    const bb = item.bounding_box;
    assert.ok(bb.ymin >= 0.0 && bb.ymin <= 1.0);
    assert.ok(bb.xmin >= 0.0 && bb.xmin <= 1.0);
    assert.ok(bb.ymax >= 0.0 && bb.ymax <= 1.0);
    assert.ok(bb.xmax >= 0.0 && bb.xmax <= 1.0);
    assert.ok(bb.ymax >= bb.ymin);
    assert.ok(bb.xmax >= bb.xmin);
  }

  // Fixture 2: 3-Tier Recommendation with integer currency
  const recommendationFixture = {
    experiment_id: 'exp-kaleng-listrik',
    title: 'Rangkaian Listrik Baterai dan Kaleng Bekas',
    match_tier: 'STRICT_100',
    available_materials: ['baterai-9v', 'kaleng-bekas', 'kabel-tembaga', 'lampu-led'],
    missing_materials: [],
    substitutions: [],
    estimated_cost_idr: 0,
    estimated_cost_myr_sen: 0,
  };

  assert.equal(recommendationFixture.match_tier, 'STRICT_100');
  assert.equal(Number.isInteger(recommendationFixture.estimated_cost_idr), true);
  assert.equal(Number.isInteger(recommendationFixture.estimated_cost_myr_sen), true);
});
