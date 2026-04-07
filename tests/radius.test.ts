import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

// Test the real Point.prototype.getRadius method from the ternaryscatter series.
// We call it on a minimal fake point that carries only what the method reads:
// this.total, this.series.options.{minSize,maxSize}, this.series.points[].total.

const H = Highcharts as any;
const PREC = 6;

function makePoint(total: number, allTotals: number[], minSize: number, maxSize: number) {
    const pointProto = H.seriesTypes.ternaryscatter.prototype.pointClass.prototype;
    const point = Object.create(pointProto);
    point.total = total;
    point.series = {
        options: { minSize, maxSize },
        points: allTotals.map(t => ({ total: t }))
    };
    return point;
}

beforeAll(() => {
    TernaryPlotPlugin(H);
});

describe('getRadius', () => {

    it('returns minSize for the minimum total', () => {
        expect(makePoint(0, [0, 50, 100], 4, 20).getRadius()).toBeCloseTo(4, PREC);
    });

    it('returns maxSize for the maximum total', () => {
        expect(makePoint(100, [0, 50, 100], 4, 20).getRadius()).toBeCloseTo(20, PREC);
    });

    it('returns midpoint when all totals are equal (no divide-by-zero)', () => {
        expect(makePoint(50, [50, 50, 50], 4, 20).getRadius()).toBeCloseTo(12, PREC);
    });

    it('is monotonically increasing with total', () => {
        const totals = [0, 25, 50, 75, 100];
        const radii = totals.map(t => makePoint(t, [0, 100], 4, 20).getRadius());
        for (let i = 1; i < radii.length; i++) {
            expect(radii[i]).toBeGreaterThan(radii[i - 1]);
        }
    });

    it('area at midpoint is the mean of min and max areas', () => {
        const minSize = 4, maxSize = 20;
        const r = makePoint(50, [0, 100], minSize, maxSize).getRadius();
        const expectedArea   = (Math.PI * minSize ** 2 + Math.PI * maxSize ** 2) / 2;
        const expectedRadius = Math.sqrt(expectedArea / Math.PI);
        expect(r).toBeCloseTo(expectedRadius, PREC);
    });

    it('returns minSize when minSize equals maxSize regardless of total', () => {
        expect(makePoint(75, [0, 50, 100], 10, 10).getRadius()).toBeCloseTo(10, PREC);
    });

});
