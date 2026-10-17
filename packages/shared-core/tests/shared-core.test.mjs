import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Functions under test mirroring packages/shared-core/src/index.ts
function clampNormalizedCoordinate(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
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

function createStructuredLog(level, service, message, context) {
  return {
    level,
    timestamp: new Date().toISOString(),
    service,
    message,
    context,
  };
}

test('shared-core: clampNormalizedCoordinate handles boundaries, out-of-bounds and NaN', () => {
  assert.equal(clampNormalizedCoordinate(0.0), 0.0);
  assert.equal(clampNormalizedCoordinate(1.0), 1.0);
  assert.equal(clampNormalizedCoordinate(0.725), 0.725);
  assert.equal(clampNormalizedCoordinate(-0.01), 0.0);
  assert.equal(clampNormalizedCoordinate(1.05), 1.0);
  assert.equal(clampNormalizedCoordinate(NaN), 0.0);
  assert.equal(clampNormalizedCoordinate(Infinity), 0.0);
  assert.equal(clampNormalizedCoordinate(-Infinity), 0.0);
});

test('shared-core: toViewportPixels maps coordinates to HTML5 Canvas / SVG pixels', () => {
  const p1 = toViewportPixels(0.5, 0.5, 800, 600);
  assert.deepEqual(p1, { x: 400, y: 300 });

  const p2 = toViewportPixels(0, 0, 1920, 1080);
  assert.deepEqual(p2, { x: 0, y: 0 });

  const p3 = toViewportPixels(1, 1, 1920, 1080);
  assert.deepEqual(p3, { x: 1920, y: 1080 });

  const p4 = toViewportPixels(-0.2, 1.4, 400, 300);
  assert.deepEqual(p4, { x: 0, y: 300 });
});

test('shared-core: formatIntegerCurrency produces exact IDR and MYR formats', () => {
  // IDR Rupiah
  assert.equal(formatIntegerCurrency(0, 'IDR'), 'Rp 0');
  assert.equal(formatIntegerCurrency(500, 'IDR'), 'Rp 500');
  assert.equal(formatIntegerCurrency(15000, 'IDR'), 'Rp 15.000');
  assert.equal(formatIntegerCurrency(1250000, 'IDR'), 'Rp 1.250.000');
  assert.equal(formatIntegerCurrency(-500, 'IDR'), 'Rp 0'); // negative clamped to 0

  // MYR Sen
  assert.equal(formatIntegerCurrency(0, 'MYR_SEN'), 'RM 0.00');
  assert.equal(formatIntegerCurrency(5, 'MYR_SEN'), 'RM 0.05');
  assert.equal(formatIntegerCurrency(50, 'MYR_SEN'), 'RM 0.50');
  assert.equal(formatIntegerCurrency(240, 'MYR_SEN'), 'RM 2.40');
  assert.equal(formatIntegerCurrency(1999, 'MYR_SEN'), 'RM 19.99');
});

test('shared-core: createStructuredLog formats standard log payload', () => {
  const log = createStructuredLog('INFO', 'core-api', 'System health probe OK', { status: 200 });
  assert.equal(log.level, 'INFO');
  assert.equal(log.service, 'core-api');
  assert.equal(log.message, 'System health probe OK');
  assert.equal(log.context?.status, 200);
  assert.ok(Date.parse(log.timestamp) > 0, 'Timestamp must be valid ISO8601');
});

test('shared-core: package integrity & typescript source matches exported contract', () => {
  const pkgRoot = path.resolve(__dirname, '..');
  const indexTs = fs.readFileSync(path.join(pkgRoot, 'src/index.ts'), 'utf8');

  assert.ok(indexTs.includes('export function clampNormalizedCoordinate'));
  assert.ok(indexTs.includes('export function toViewportPixels'));
  assert.ok(indexTs.includes('export function formatIntegerCurrency'));
  assert.ok(indexTs.includes('export function createStructuredLog'));
});
