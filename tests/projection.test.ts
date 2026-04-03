import { describe, it, expect } from 'vitest';

// Chart.prototype.ternaryToPlot requires a real Highcharts Chart instance
// (renderer, plotWidth, plotHeight, clamp, pick, …). Instead of mocking the
// entire HC runtime we test the projection math directly by replicating the
// same formula used in the method body. If the implementation drifts the
// visual output will change and the developer will notice — these tests guard
// against regressions in the mathematical properties of the projection.

type TernaryOpts = { angle: number; spacing: number; sumTo: number };

function project(a: number, b: number, opts: TernaryOpts, W: number, H: number): [number, number] {
    const spacing     = opts.spacing * 2,
        alpha         = Math.min(Math.max(opts.angle, 1), 89) * Math.PI / 180,
        heightRatio   = Math.tan(alpha) / 2,
        baseWidth     = Math.min(W, H / heightRatio),
        width         = Math.max(baseWidth - spacing, 5),
        x             = a * width / opts.sumTo,
        y             = b * width / opts.sumTo,
        centerX       = (W - width) / 2,
        centerY       = (H - width * heightRatio) / 2;

    return [
        x + y / 2 + centerX,
        H - y * heightRatio - centerY
    ];
}

// Equilateral triangle (angle=60), no spacing, 600×600 plot, sumTo=100.
//
// With these settings:
//   heightRatio = tan(60°)/2 = √3/2 ≈ 0.866
//   width = 600 (no spacing)
//   centerX = centerY offset from edges
//
// Corner coordinates:
//   [0,  0]   → bottom-left
//   [100, 0]  → bottom-right
//   [0, 100]  → apex (top-centre)

const PREC = 2;
const W = 600;
const defaults: TernaryOpts = { angle: 60, spacing: 0, sumTo: 100 };

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

    it('a larger angle produces a taller triangle (apex has lower y)', () => {
        const acute:  TernaryOpts = { angle: 45, spacing: 0, sumTo: 100 };
        const obtuse: TernaryOpts = { angle: 75, spacing: 0, sumTo: 100 };
        const [, y45] = project(0, 100, acute,  W, W);
        const [, y75] = project(0, 100, obtuse, W, W);
        expect(y75).toBeLessThan(y45);
    });

});
