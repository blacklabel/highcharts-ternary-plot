import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

// Test the real Chart.prototype.resolveTernary / resolveMedian methods.
// Both are stateless (they only read their argument), so a bare empty object
// is a sufficient `this` context.

const H = Highcharts as any;
let resolveTernary: (opt: unknown) => unknown;
let resolveMedian:  (opt: unknown) => unknown;

beforeAll(() => {
    TernaryPlotPlugin(H);
    resolveTernary = (opt) => H.Chart.prototype.resolveTernary.call({}, opt);
    resolveMedian  = (opt) => H.Chart.prototype.resolveMedian.call({}, opt);
});

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
        expect(resolveTernary(true)).toEqual({ enabled: true, angle: 60, spacing: 35, sumTo: 100 });
    });

    it('returns defaults for empty object', () => {
        expect(resolveTernary({})).toEqual({ enabled: true, angle: 60, spacing: 35, sumTo: 100 });
    });

    it('returns defaults when enabled: true', () => {
        expect(resolveTernary({ enabled: true })).toEqual({ enabled: true, angle: 60, spacing: 35, sumTo: 100 });
    });

    it('merges partial options with defaults', () => {
        expect(resolveTernary({ angle: 45 })).toEqual({ enabled: true, angle: 45, spacing: 35, sumTo: 100 });
    });

    it('ignores enabled: true and still merges data fields', () => {
        expect(resolveTernary({ enabled: true, angle: 45 })).toEqual({ enabled: true, angle: 45, spacing: 35, sumTo: 100 });
    });

    it('respects all options when fully specified', () => {
        expect(resolveTernary({ angle: 45, spacing: 20, sumTo: 1 }))
            .toEqual({ enabled: true, angle: 45, spacing: 20, sumTo: 1 });
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
            enabled: true, color: '#d6d6d6', width: 1, dashStyle: 'Solid'
        });
    });

    it('returns defaults for empty object', () => {
        expect(resolveMedian({})).toEqual({
            enabled: true, color: '#d6d6d6', width: 1, dashStyle: 'Solid'
        });
    });

    it('respects all options when fully specified', () => {
        expect(resolveMedian({ color: 'red', width: 2, dashStyle: 'Dash' }))
            .toEqual({ enabled: true, color: 'red', width: 2, dashStyle: 'Dash' });
    });

    it('merges partial options with defaults', () => {
        expect(resolveMedian({ color: 'blue' })).toEqual({
            enabled: true, color: 'blue', width: 1, dashStyle: 'Solid'
        });
    });

});
