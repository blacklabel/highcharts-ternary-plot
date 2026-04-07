import { beforeAll, describe, it, expect } from 'vitest';
import * as Highcharts from 'highcharts';
import TernaryPlotPlugin from '../ts/ternary-plot';

const H = Highcharts as any;

beforeAll(() => {
    TernaryPlotPlugin(H);
});

// Minimal fake chart that captures SVG attrs passed to the renderer.
// Uses real ternaryToPlot and resolveMedian from the prototype.
function makeChart() {
    const calls: Record<string, unknown>[] = [];

    const elem = {
        attr(attrs: Record<string, unknown>) { calls.push({ ...attrs }); return elem; },
        add() { return elem; }
    };

    const chart: any = {
        ternaryOpts: { angle: 60, spacing: 0, sumTo: 100, enabled: true },
        plotLeft: 0,
        plotTop: 0,
        plotWidth: 600,
        plotHeight: 400,
        renderer: { path: () => elem }
    };

    chart.resolveMedian = H.Chart.prototype.resolveMedian.bind(chart);
    chart.ternaryToPlot = H.Chart.prototype.ternaryToPlot.bind(chart);
    chart.getGridLines = H.Chart.prototype.getGridLines.bind(chart);

    return { chart, calls };
}

function makeAxis(overrides: Record<string, unknown> = {}) {
    return {
        tickInterval: 50,
        lineWidth: 2,
        lineColor: '#000000',
        gridLineWidth: 1,
        gridLineColor: '#d6d6d6',
        ...overrides
    };
}

// ── Without median ────────────────────────────────────────────────────────────

describe('getGridLines without median', () => {

    it('axis line at cursor=0 uses lineColor and lineWidth', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis(), 0);
        // tickInterval=50, sumTo=100 → cursors: 0, 50, 100
        expect(calls[0].stroke).toBe('#000000');
        expect(calls[0]['stroke-width']).toBe(2);
    });

    it('internal grid line uses gridLineColor and gridLineWidth', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis(), 0);
        expect(calls[1].stroke).toBe('#d6d6d6');
        expect(calls[1]['stroke-width']).toBe(1);
    });

    it('axis line at cursor=sumTo uses lineColor and lineWidth', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis(), 0);
        expect(calls[2].stroke).toBe('#000000');
        expect(calls[2]['stroke-width']).toBe(2);
    });

    it('axis line has no dashStyle when lineDashStyle is not set', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ gridLineDashStyle: 'Dash' }), 0);
        expect(calls[0].dashstyle).toBeUndefined();
    });

    it('axis line applies lineDashStyle', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ lineDashStyle: 'Dash' }), 0);
        expect(calls[0].dashstyle).toBe('Dash');
    });

    it('axis line with lineDashStyle gets shape-rendering geometricPrecision', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ lineDashStyle: 'ShortDot' }), 0);
        expect(calls[0]['shape-rendering']).toBe('geometricPrecision');
    });

    it('solid axis line does not get shape-rendering', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ lineDashStyle: 'Solid' }), 0);
        expect(calls[0]['shape-rendering']).toBeUndefined();
    });

    it('lineDashStyle does not affect internal grid lines', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ lineDashStyle: 'Dash' }), 0);
        expect(calls[1].dashstyle).toBeUndefined();
    });

    it('internal grid line applies gridLineDashStyle', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ gridLineDashStyle: 'Dash' }), 0);
        expect(calls[1].dashstyle).toBe('Dash');
    });

    it('produces 3 lines for tickInterval=50 (cursor 0, 50, 100)', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis(), 0);
        expect(calls).toHaveLength(3);
    });

    it('works the same for all three axis indices', () => {
        for (const index of [0, 1, 2]) {
            const { chart, calls } = makeChart();
            chart.getGridLines(makeAxis(), index);
            expect(calls[0].stroke).toBe('#000000');   // axis line
            expect(calls[1].stroke).toBe('#d6d6d6');   // grid line
            expect(calls[2].stroke).toBe('#000000');   // axis line
        }
    });

});

// ── With median ───────────────────────────────────────────────────────────────

describe('getGridLines with median', () => {

    it('side (i=0) uses lineColor and lineWidth', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ median: true }), 0);
        expect(calls[0].stroke).toBe('#000000');
        expect(calls[0]['stroke-width']).toBe(2);
    });

    it('median line (i=1) uses median color and width', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(
            makeAxis({ median: { color: '#ff0000', width: 3 } }),
            0
        );
        expect(calls[1].stroke).toBe('#ff0000');
        expect(calls[1]['stroke-width']).toBe(3);
    });

    it('produces exactly 2 lines when median is enabled', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(makeAxis({ median: true }), 0);
        expect(calls).toHaveLength(2);
    });

    it('side has no dashStyle even when gridLineDashStyle is set', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(
            makeAxis({ median: true, gridLineDashStyle: 'Dash' }),
            0
        );
        expect(calls[0].dashstyle).toBeUndefined();
    });

    it('median line applies its own dashStyle', () => {
        const { chart, calls } = makeChart();
        chart.getGridLines(
            makeAxis({ median: { dashStyle: 'ShortDot' } }),
            0
        );
        expect(calls[1].dashstyle).toBe('ShortDot');
    });

    it('works the same for all three axis indices', () => {
        for (const index of [0, 1, 2]) {
            const { chart, calls } = makeChart();
            chart.getGridLines(makeAxis({ median: true }), index);
            expect(calls[0].stroke).toBe('#000000');   // side → lineColor
            expect(calls[1].stroke).toBeDefined();     // median → its own color
        }
    });

});
