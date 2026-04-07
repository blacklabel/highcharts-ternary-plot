import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

// Test the real pointAttribs method from the ternaryscatter series prototype.
// pointAttribs delegates to Series.prototype.pointAttribs for the base attr,
// then overrides fill/stroke with barycentric color when componentColors is set.
//
// Fake series needs: options.marker.states (read by HC's base pointAttribs),
// chart.ternaryOpts.sumTo (read by getTernaryColor), and getTernaryColor itself
// (inherited from the series prototype).

const H = Highcharts as any;

const markerOpts = {
    fillColor: null,
    lineColor: null,
    lineWidth: 1,
    states: { normal: {}, hover: {}, select: {} }
};

function makeSeries(componentColors?: { a: string; b: string; c: string; alpha?: number }) {
    const proto = H.seriesTypes.ternaryscatter.prototype;
    const series = Object.create(proto);
    series.color = '#333333';
    series.options = {
        color: '#333333',
        opacity: 1,
        marker: markerOpts,
        states: { normal: { opacity: 1 }, hover: {}, select: {} },
        ...(componentColors ? { componentColors } : {})
    };
    series.chart = { ternaryOpts: { sumTo: 100 }, styledMode: false };
    series.zones = [];
    return series;
}

function makePoint(
    a: number, b: number, c: number,
    overrides: Record<string, unknown> = {}
) {
    return { a, b, c, isNull: false, options: { marker: {} }, marker: {}, ...overrides };
}

const colors = { a: '#ff0000', b: '#00ff00', c: '#0000ff' };

beforeAll(() => {
    TernaryPlotPlugin(H);
});

describe('pointAttribs — bypass (no ternary color applied)', () => {

    it('skips ternary color when componentColors is not set', () => {
        const series = makeSeries(); // no componentColors
        const point = makePoint(100, 0, 0);
        H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        expect((point as any).ternaryColor).toBeUndefined();
    });

    it('skips ternary color when point.isNull is true', () => {
        const series = makeSeries(colors);
        const point = makePoint(100, 0, 0, { isNull: true });
        H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        expect((point as any).ternaryColor).toBeUndefined();
    });

});

describe('pointAttribs — ternary color applied', () => {

    it('sets attr.fill to the barycentric color', () => {
        const series = makeSeries(colors);
        const point = makePoint(100, 0, 0);
        const attr = H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        expect(attr.fill).toBe('rgba(255, 0, 0, 1)');
    });

    it('sets point.ternaryColor with alpha forced to 1', () => {
        const series = makeSeries({ ...colors, alpha: 0.5 });
        const point = makePoint(100, 0, 0);
        H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        // attr.fill uses componentColors.alpha (0.5), ternaryColor always uses alpha=1
        expect((point as any).ternaryColor).toBe('rgba(255, 0, 0, 1)');
    });

    it('sets attr.stroke to point.ternaryColor when marker has no lineColor', () => {
        const series = makeSeries(colors);
        const point = makePoint(100, 0, 0);
        const attr = H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        expect(attr.stroke).toBe((point as any).ternaryColor);
    });

    it('sets attr.stroke to marker.lineColor when present', () => {
        const series = makeSeries(colors);
        const point = makePoint(100, 0, 0, { marker: { lineColor: '#0000ff' } });
        const attr = H.seriesTypes.ternaryscatter.prototype.pointAttribs.call(series, point, 'normal');
        expect(attr.stroke).toBe('#0000ff');
    });

});
