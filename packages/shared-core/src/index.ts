/**
 * @rekasains/shared-core
 * Pure cross-cutting technical helpers (Zero business logic).
 * - Normalized coordinate clamping [0.0, 1.0] for HTML5 Canvas/SVG rendering
 * - Integer currency display formatting (IDR & MYR_SEN)
 * - Structured JSON logging helper
 */

/**
 * Clamps a normalized coordinate value strictly into [0.0, 1.0].
 */
export function clampNormalizedCoordinate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1.0, Math.max(0.0, value));
}

/**
 * Converts a normalized [0.0, 1.0] coordinate pair into pixel coordinates
 * for a given HTML5 Canvas or SVG viewport width and height.
 */
export function toViewportPixels(
  xNorm: number,
  yNorm: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  return {
    x: Math.round(clampNormalizedCoordinate(xNorm) * viewportWidth),
    y: Math.round(clampNormalizedCoordinate(yNorm) * viewportHeight),
  };
}

/**
 * Formats integer currency representation into human-readable string without floating-point drift.
 * - IDR: integer Rupiah (e.g. 2500 -> "Rp 2.500")
 * - MYR_SEN: integer Sen Ringgit (e.g. 240 -> "RM 2.40")
 */
export function formatIntegerCurrency(amountInt: number, currency: 'IDR' | 'MYR_SEN'): string {
  const safeInt = Math.max(0, Math.trunc(amountInt));
  if (currency === 'IDR') {
    const formatted = safeInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `Rp ${formatted}`;
  }
  const ringgit = Math.floor(safeInt / 100);
  const sen = (safeInt % 100).toString().padStart(2, '0');
  return `RM ${ringgit}.${sen}`;
}

export interface StructuredLogEntry {
  level: 'INFO' | 'WARN' | 'ERROR';
  timestamp: string;
  service: string;
  message: string;
  context?: Record<string, unknown>;
}

export function createStructuredLog(
  level: 'INFO' | 'WARN' | 'ERROR',
  service: string,
  message: string,
  context?: Record<string, unknown>
): StructuredLogEntry {
  return {
    level,
    timestamp: new Date().toISOString(),
    service,
    message,
    context,
  };
}
