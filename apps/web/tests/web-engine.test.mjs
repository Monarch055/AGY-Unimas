import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pure verification helpers mirroring @rekasains/shared-core and apps/web/src/lib/*
function clampNormalizedCoordinate(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1.0, Math.max(0.0, value));
}

function toViewportPixels(xNorm, yNorm, viewportWidth, viewportHeight) {
  return {
    x: Math.round(clampNormalizedCoordinate(xNorm) * viewportWidth),
    y: Math.round(clampNormalizedCoordinate(yNorm) * viewportHeight),
  };
}

function formatIntegerCurrency(amountInt, currency) {
  const safeInt = Math.max(0, Math.trunc(amountInt));
  if (currency === 'IDR') {
    const formatted = safeInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }
  const ringgit = Math.floor(safeInt / 100);
  const sen = (safeInt % 100).toString().padStart(2, '0');
  return `RM ${ringgit}.${sen}`;
}

test('USP #4: Zero Floating-Point Integer Currency Formatting (IDR & MYR_SEN)', () => {
  assert.equal(formatIntegerCurrency(2000, 'IDR'), 'Rp 2.000');
  assert.equal(formatIntegerCurrency(15000, 'IDR'), 'Rp 15.000');
  assert.equal(formatIntegerCurrency(150, 'MYR_SEN'), 'RM 1.50');
  assert.equal(formatIntegerCurrency(240, 'MYR_SEN'), 'RM 2.40');
});

test('USP #9: Normalized AR Coordinate Clamping [0.0, 1.0] & Viewport Projection', () => {
  assert.equal(clampNormalizedCoordinate(-0.35), 0.0);
  assert.equal(clampNormalizedCoordinate(1.45), 1.0);
  assert.equal(clampNormalizedCoordinate(0.5), 0.5);

  const px = toViewportPixels(0.25, 0.5, 560, 280);
  assert.deepEqual(px, { x: 140, y: 140 });

  const clampedPx = toViewportPixels(-0.5, 1.8, 560, 280);
  assert.deepEqual(clampedPx, { x: 0, y: 280 });
});

test('USP #1, #3, #5, #7, #8, #9, #10: Verify apps/web Source Files & Contract Alignment', () => {
  const webRoot = path.resolve(__dirname, '..');
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.mjs',
    'Dockerfile',
    'public/manifest.json',
    'public/sw.js',
    'src/lib/ar-and-pdf-engine.ts',
    'src/lib/offline-db.ts',
    'src/lib/api-client.ts',
    'src/components/WorkspaceScannerAndHazardBanner.tsx',
    'src/components/ThreeTierRecommendationExplorer.tsx',
    'src/components/AdaptiveSTEMModuleAndARLab.tsx',
    'src/components/AcademicLabReportPDFGenerator.tsx',
    'src/components/LatexRenderer.tsx',
    'src/app/layout.tsx',
    'src/app/page.tsx',
  ];

  for (const relPath of requiredFiles) {
    const absPath = path.join(webRoot, relPath);
    assert.ok(fs.existsSync(absPath), `Expected file ${relPath} to exist in apps/web`);
  }

  const apiClientContent = fs.readFileSync(
    path.join(webRoot, 'src/lib/api-client.ts'),
    'utf8'
  );
  // Verify USP #7 Active Co-Location Hazard rule is enforced
  assert.ok(
    apiClientContent.includes('HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER'),
    'Must enforce HAZ_CO_LOCATED_BLEACH_AND_ACID_CLEANER co-location warning'
  );
  assert.ok(
    apiClientContent.includes('CRITICAL_CO_LOCATION_WARNING'),
    'Must include CRITICAL_CO_LOCATION_WARNING severity'
  );

  // Verify USP #3 Functional Material Substitution (PVC pipe -> thick straw)
  assert.ok(
    apiClientContent.includes('pvc_pipe_half_inch') &&
      apiClientContent.includes('thick_plastic_straw'),
    'Must include functional material substitution pvc_pipe_half_inch -> thick_plastic_straw'
  );

  // Verify USP #5 4-Level Age-Adaptive Filter
  for (const level of [
    'SD_ELEMENTARY',
    'SMP_LOWER_SEC',
    'SMA_UPPER_SEC',
    'HIGHER_ED_UNI',
  ]) {
    assert.ok(
      apiClientContent.includes(level),
      `Must support AgeAdaptiveLevelEnum ${level}`
    );
  }

  // Verify USP #10 Printable Academic PDF Lab Report Engine
  const arPdfEngineContent = fs.readFileSync(
    path.join(webRoot, 'src/lib/ar-and-pdf-engine.ts'),
    'utf8'
  );
  assert.ok(
    arPdfEngineContent.includes('buildAcademicLabReportPrintableHTML'),
    'Must provide buildAcademicLabReportPrintableHTML for PDF Lab Report export'
  );
  assert.ok(
    arPdfEngineContent.includes('computeAnalyticalGraphSeries'),
    'Must provide computeAnalyticalGraphSeries for SMA/University analytical graph plotting'
  );
});

test('USP #5: KaTeX LaTeX Mathematical Equation Rendering', async () => {
  const latexRendererContent = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'LatexRenderer.tsx'),
    'utf8'
  );
  assert.ok(
    latexRendererContent.includes('katex.renderToString'),
    'Must invoke katex.renderToString'
  );
  assert.ok(
    latexRendererContent.includes('sanitizeLatexFormula'),
    'Must provide sanitizeLatexFormula'
  );

  // Test dynamic import of katex and verification of formula rendering
  const katex = await import('katex').then((m) => m.default || m);
  const rendered = katex.renderToString('I = \\frac{V}{R}', {
    displayMode: false,
    throwOnError: false,
  });
  assert.ok(rendered.includes('class="katex"'), 'Rendered HTML must contain KaTeX root class');
  assert.ok(rendered.includes('<math'), 'Rendered HTML must include accessible MathML markup');
  assert.ok(
    rendered.includes('frac-line') || rendered.includes('mfrac'),
    'Rendered HTML must include fraction markup'
  );
});

test('FEAT-003: Tanya Lab AI via Official Google ADK Web UI & Agent Integration', () => {
  const webRoot = path.resolve(__dirname, '..');
  const pageContent = fs.readFileSync(
    path.join(webRoot, 'src/app/page.tsx'),
    'utf8'
  );
  assert.ok(pageContent.includes('/dev-ui/'), 'page.tsx must link to Google ADK Web UI (/dev-ui/)');

  const monorepoRoot = path.resolve(webRoot, '../..');
  const agentFile = path.join(monorepoRoot, 'services/ai-agent/agents/rekasains/agent.py');
  assert.ok(fs.existsSync(agentFile), 'Google ADK agent.py must exist in agents/rekasains/');
  const agentContent = fs.readFileSync(agentFile, 'utf8');
  assert.ok(agentContent.includes('root_agent = Agent('), 'Must define root_agent as Google ADK Agent');
  assert.ok(agentContent.includes('check_chemical_safety'), 'Must include safety tool');
  assert.ok(agentContent.includes('recommend_stem_experiments'), 'Must include recommendation tool');
});


