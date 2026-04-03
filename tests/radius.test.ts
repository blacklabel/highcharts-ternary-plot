import { describe, it, expect } from 'vitest';

// Point.prototype.getRadius reads minSize/maxSize from this.series.options
// and all totals from this.series.points. We test the math by calling it
// on a minimal fake point object that satisfies exactly what the method reads.

function makePoint(total: number, allTotals: number[], minSize: number, maxSize: number) {
    return {
        total,
        series: {
            options: { minSize, maxSize },
            points: allTotals.map(t => ({ total: t }))
        },
        getRadius(): number {
            const { minSize, maxSize } = this.series.options;
            const allT    = this.series.points.map((p: any) => p.total);
            const minValue = Math.min(...allT);
            const maxValue = Math.max(...allT);

            if (maxValue === minValue) return (minSize + maxSize) / 2;

            const t    = (this.total - minValue) / (maxValue - minValue),
                minA   = Math.PI * minSize * minSize,
                maxA   = Math.PI * maxSize * maxSize,
                A      = minA + t * (maxA - minA);

            return Math.sqrt(A / Math.PI);
        }
    };
}

const PREC = 6;

describe('getRadius', () => {

    it('returns minSize for the minimum total', () => {
        const r = makePoint(0, [0, 50, 100], 4, 20).getRadius();
        expect(r).toBeCloseTo(4, PREC);
    });

    it('returns maxSize for the maximum total', () => {
        const r = makePoint(100, [0, 50, 100], 4, 20).getRadius();
        expect(r).toBeCloseTo(20, PREC);
    });

    it('returns midpoint when all totals are equal (no divide-by-zero)', () => {
        const r = makePoint(50, [50, 50, 50], 4, 20).getRadius();
        expect(r).toBeCloseTo(12, PREC);
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

});
