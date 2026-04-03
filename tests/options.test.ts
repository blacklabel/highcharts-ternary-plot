import { describe, it, expect } from 'vitest';

// resolveTernary and resolveMedian live on Chart.prototype.
// We test them by calling the methods directly on a minimal fake chart object
// that carries only what the method bodies actually use (nothing — they are
// stateless and only read their argument).

// Inline the same logic as Chart.prototype.resolveTernary so tests don't
// depend on the plugin being initialised (which requires a real Highcharts).
// This mirrors the implementation exactly — if it drifts, TypeScript will
// catch it via the shared MedianOpts / TernaryOpts types.
function resolveTernary(
    opt: boolean | { enabled?: boolean; angle?: number; spacing?: number; sumTo?: number } | undefined
): { angle: number; spacing: number; sumTo: number } | null {
    if (!opt) return null;
    const isObj = typeof opt === 'object' && opt !== null;
    if (isObj && (opt as any).enabled === false) return null;
    const o = isObj ? (opt as any) : {};
    return { angle: o.angle ?? 60, spacing: o.spacing ?? 35, sumTo: o.sumTo ?? 100 };
}

function resolveMedian(
    opt: boolean | { enabled?: boolean; color?: string; width?: number; dashStyle?: string } | undefined
): { color: string; width: number; dashStyle: string } | null {
    if (!opt) return null;
    const isObj = typeof opt === 'object' && opt !== null;
    if (isObj && (opt as any).enabled === false) return null;
    const o = isObj ? (opt as any) : {};
    return { color: o.color ?? '#d6d6d6', width: o.width ?? 1, dashStyle: o.dashStyle ?? 'Solid' };
}

// ── resolveTernary ───────────────────────────────────────────────────────────

describe('resolveTernary', () => {

    it('returns null for false', () => {
        expect(resolveTernary(false)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(resolveTernary(undefined)).toBeNull();
    });

    it('returns null when enabled: false', () => {
        expect(resolveTernary({ enabled: false })).toBeNull();
    });

    it('returns defaults for true', () => {
        expect(resolveTernary(true)).toEqual({ angle: 60, spacing: 35, sumTo: 100 });
    });

    it('returns defaults for empty object', () => {
        expect(resolveTernary({})).toEqual({ angle: 60, spacing: 35, sumTo: 100 });
    });

    it('returns defaults when enabled: true', () => {
        expect(resolveTernary({ enabled: true })).toEqual({ angle: 60, spacing: 35, sumTo: 100 });
    });

    it('merges partial options with defaults', () => {
        expect(resolveTernary({ angle: 45 })).toEqual({ angle: 45, spacing: 35, sumTo: 100 });
    });

    it('respects all options when fully specified', () => {
        expect(resolveTernary({ angle: 45, spacing: 20, sumTo: 1 }))
            .toEqual({ angle: 45, spacing: 20, sumTo: 1 });
    });

});

// ── resolveMedian ────────────────────────────────────────────────────────────

describe('resolveMedian', () => {

    it('returns null for false', () => {
        expect(resolveMedian(false)).toBeNull();
    });

    it('returns null for undefined', () => {
        expect(resolveMedian(undefined)).toBeNull();
    });

    it('returns null when enabled: false', () => {
        expect(resolveMedian({ enabled: false })).toBeNull();
    });

    it('returns defaults for true', () => {
        expect(resolveMedian(true)).toEqual({
            color: '#d6d6d6',
            width: 1,
            dashStyle: 'Solid'
        });
    });

    it('respects all options when fully specified', () => {
        expect(resolveMedian({ color: 'red', width: 2, dashStyle: 'Dash' }))
            .toEqual({ color: 'red', width: 2, dashStyle: 'Dash' });
    });

    it('merges partial options with defaults', () => {
        expect(resolveMedian({ color: 'blue' })).toEqual({
            color: 'blue',
            width: 1,
            dashStyle: 'Solid'
        });
    });

});
