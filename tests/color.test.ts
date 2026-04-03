import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

// Test the real getTernaryColor method from the ternaryscatter series prototype.
// We call it on a minimal fake series that carries only what the method reads:
// options.componentColors and chart.ternaryOpts.sumTo.

type ComponentColors = { a: string; b: string; c: string; alpha?: number };

const H = Highcharts as any;

function makeSeries(componentColors: ComponentColors, sumTo: number) {
    return {
        options: { componentColors },
        chart: { ternaryOpts: { sumTo } }
    };
}

function getTernaryColor(
    componentColors: ComponentColors,
    sumTo: number,
    a: number,
    b: number,
    c: number,
    alpha?: number
): string {
    const series = makeSeries(componentColors, sumTo);
    return H.seriesTypes.ternaryscatter.prototype.getTernaryColor.call(series, a, b, c, alpha);
}

beforeAll(() => {
    TernaryPlotPlugin(H);
});

// Corner colors: pure red / green / blue for easy mental arithmetic
const colors: ComponentColors = { a: '#ff0000', b: '#00ff00', c: '#0000ff' };
const sumTo = 100;

describe('getTernaryColor — barycentric blending', () => {

    it('corner A (100, 0, 0) returns pure color A', () => {
        expect(getTernaryColor(colors, sumTo, 100, 0, 0)).toBe('rgba(255, 0, 0, 1)');
    });

    it('corner B (0, 100, 0) returns pure color B', () => {
        expect(getTernaryColor(colors, sumTo, 0, 100, 0)).toBe('rgba(0, 255, 0, 1)');
    });

    it('corner C (0, 0, 100) returns pure color C', () => {
        expect(getTernaryColor(colors, sumTo, 0, 0, 100)).toBe('rgba(0, 0, 255, 1)');
    });

    it('midpoint AB (50, 50, 0) blends A and B equally', () => {
        // r: round(255*0.5) = 128, g: round(255*0.5) = 128, b: 0
        expect(getTernaryColor(colors, sumTo, 50, 50, 0)).toBe('rgba(128, 128, 0, 1)');
    });

    it('centroid (33.33, 33.33, 33.33) blends all three corners equally', () => {
        // Each channel: round(255/3) = 85
        const t = 100 / 3;
        expect(getTernaryColor(colors, sumTo, t, t, t)).toBe('rgba(85, 85, 85, 1)');
    });

    it('rgb() color strings are parsed correctly', () => {
        const rgbColors: ComponentColors = {
            a: 'rgb(255,0,0)',
            b: 'rgb(0,255,0)',
            c: 'rgb(0,0,255)'
        };
        expect(getTernaryColor(rgbColors, sumTo, 100, 0, 0)).toBe('rgba(255, 0, 0, 1)');
    });

    it('returns transparent rgba(0,0,0,0) when a color string is unparseable', () => {
        const badColors: ComponentColors = { a: 'notacolor', b: '#00ff00', c: '#0000ff' };
        expect(getTernaryColor(badColors, sumTo, 100, 0, 0)).toBe('rgba(0,0,0,0)');
    });

});

describe('getTernaryColor — alpha', () => {

    it('defaults alpha to 1 when neither argument nor componentColors.alpha is set', () => {
        expect(getTernaryColor(colors, sumTo, 100, 0, 0)).toMatch(/rgba\(255, 0, 0, 1\)/);
    });

    it('explicit alpha argument takes precedence over componentColors.alpha', () => {
        const withAlpha: ComponentColors = { ...colors, alpha: 0.5 };
        expect(getTernaryColor(withAlpha, sumTo, 100, 0, 0, 0.2)).toBe('rgba(255, 0, 0, 0.2)');
    });

    it('componentColors.alpha is used when no explicit alpha argument is passed', () => {
        const withAlpha: ComponentColors = { ...colors, alpha: 0.5 };
        expect(getTernaryColor(withAlpha, sumTo, 100, 0, 0)).toBe('rgba(255, 0, 0, 0.5)');
    });

});

describe('getTernaryColor — sumTo', () => {

    it('respects custom sumTo=1 — proportional inputs give same result as sumTo=100', () => {
        const r1 = getTernaryColor(colors, 1,   0.5, 0.25, 0.25);
        const r2 = getTernaryColor(colors, 100, 50,  25,   25);
        expect(r1).toBe(r2);
    });

});
