import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

// Test the real Chart.prototype.ternaryToPlot method.
// We call it on a minimal fake chart that carries only what the method reads:
// plotWidth, plotHeight, and ternaryOpts. No renderer or DOM needed.

type TernaryOpts = { angle: number; spacing: number; sumTo: number };

const H = Highcharts as any;
const PREC = 2;
const W = 600;
const defaults: TernaryOpts = { angle: 60, spacing: 0, sumTo: 100 };

function project(a: number, b: number, opts: TernaryOpts, W: number, H_val: number): [number, number] {
    const fakeChart = { plotWidth: W, plotHeight: H_val, ternaryOpts: opts };
    // useSumTo=true so the method uses ternaryOpts.sumTo instead of the hardcoded 100
    return H.Chart.prototype.ternaryToPlot.call(fakeChart, { a, b }, true);
}

beforeAll(() => {
    TernaryPlotPlugin(H);
});

// Equilateral triangle (angle=60), no spacing, 600×600 plot, sumTo=100.
//
// Corner coordinates:
//   [0,  0]   → bottom-left
//   [100, 0]  → bottom-right
//   [0, 100]  → apex (top-centre)

describe('ternaryToPlot projection — equilateral triangle (angle=60, 600×600, no spacing)', () => {

    it('bottom-left and bottom-right corners have the same y (flat baseline)', () => {
        const [, y0] = project(0,   0, defaults, W, W);
        const [, y1] = project(100, 0, defaults, W, W);
        expect(y0).toBeCloseTo(y1, PREC);
    });

    it('apex [0,100] maps to horizontal centre of the plot', () => {
        const [x] = project(0, 100, defaults, W, W);
        expect(x).toBeCloseTo(W / 2, PREC);
    });

    it('apex is higher (lower y) than the baseline', () => {
        const [, yApex]     = project(0, 100, defaults, W, W);
        const [, yBaseline] = project(0,   0, defaults, W, W);
        expect(yApex).toBeLessThan(yBaseline);
    });

    it('midpoint of base [50,0] is horizontally centred between the two bottom corners', () => {
        const [x0] = project(0,   0, defaults, W, W);
        const [x1] = project(100, 0, defaults, W, W);
        const [x]  = project(50,  0, defaults, W, W);
        expect(x).toBeCloseTo((x0 + x1) / 2, PREC);
    });

    it('centroid [33.33, 33.33] maps to the geometric centre of the three corners', () => {
        const [ax, ay] = project(0,   100, defaults, W, W);
        const [bx, by] = project(0,     0, defaults, W, W);
        const [cx, cy] = project(100,   0, defaults, W, W);
        const [x,  y]  = project(100 / 3, 100 / 3, defaults, W, W);
        expect(x).toBeCloseTo((ax + bx + cx) / 3, PREC);
        expect(y).toBeCloseTo((ay + by + cy) / 3, PREC);
    });

    it('spacing reduces the triangle width symmetrically', () => {
        const spaced: TernaryOpts = { angle: 60, spacing: 50, sumTo: 100 };
        const [x0] = project(0,   0, spaced, W, W);
        const [x1] = project(100, 0, spaced, W, W);
        expect(x1 - x0).toBeCloseTo(W - 2 * 50, PREC);
    });

    it('custom sumTo=1 scales identically to sumTo=100 when data is proportional', () => {
        const opts1: TernaryOpts = { angle: 60, spacing: 0, sumTo: 1 };
        const [x1, y1] = project(0.5, 0.25, opts1, W, W);
        const [x2, y2] = project(50,  25,   defaults, W, W);
        expect(x1).toBeCloseTo(x2, PREC);
        expect(y1).toBeCloseTo(y2, PREC);
    });

    it('triangle height equals width × tan(60°)/2', () => {
        const heightRatio = Math.tan(60 * Math.PI / 180) / 2;
        const [, yApex]     = project(0, 100, defaults, W, W);
        const [, yBaseline] = project(0,   0, defaults, W, W);
        expect(yBaseline - yApex).toBeCloseTo(W * heightRatio, PREC);
    });

    it('a larger angle produces a taller triangle (apex has lower y)', () => {
        const acute:  TernaryOpts = { angle: 45, spacing: 0, sumTo: 100 };
        const obtuse: TernaryOpts = { angle: 75, spacing: 0, sumTo: 100 };
        const [, y45] = project(0, 100, acute,  W, W);
        const [, y75] = project(0, 100, obtuse, W, W);
        expect(y75).toBeLessThan(y45);
    });

});

describe('ternaryToPlot projection — non-square plot area', () => {

    it('baseline corners still share the same y on a wide plot (800×400)', () => {
        const [, y0] = project(0,   0, defaults, 800, 400);
        const [, y1] = project(100, 0, defaults, 800, 400);
        expect(y0).toBeCloseTo(y1, PREC);
    });

    it('apex still maps to horizontal centre on a wide plot (800×400)', () => {
        const [x] = project(0, 100, defaults, 800, 400);
        expect(x).toBeCloseTo(800 / 2, PREC);
    });

    it('baseline corners still share the same y on a tall plot (400×800)', () => {
        const [, y0] = project(0,   0, defaults, 400, 800);
        const [, y1] = project(100, 0, defaults, 400, 800);
        expect(y0).toBeCloseTo(y1, PREC);
    });

    it('apex still maps to horizontal centre on a tall plot (400×800)', () => {
        const [x] = project(0, 100, defaults, 400, 800);
        expect(x).toBeCloseTo(400 / 2, PREC);
    });

});

describe('ternaryToPlot projection — spacing clamped to minimum', () => {

    it('spacing larger than baseWidth clamps triangle width to 5', () => {
        // baseWidth for 600×600 at angle=60 is 600; spacing=500 doubled = 1000 > 600
        const huge: TernaryOpts = { angle: 60, spacing: 500, sumTo: 100 };
        const [x0] = project(0,   0, huge, W, W);
        const [x1] = project(100, 0, huge, W, W);
        expect(x1 - x0).toBeCloseTo(5, PREC);
    });

});
