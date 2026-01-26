import * as _Highcharts from 'highcharts';

declare module 'highcharts' {
    interface Options {
        ternaryAxis?: _Highcharts.AxisOptions[];
    }

    interface ChartOptions {
        ternary?: boolean;
        ternarySpacing?: number;
    }

    interface SeriesTernaryScatterOptions extends _Highcharts.SeriesOptions, _Highcharts.PlotScatterOptions {
        type: 'ternaryscatter';
        data?: Array<number | [number | string, number | null] | null | PointOptionsObject>;
    }

    interface SeriesOptionsRegistry {
        ternaryscatter: SeriesTernaryScatterOptions;
    }
}

export function factory(highcharts: typeof Highcharts): void;
export default factory;
export let Highcharts: typeof _Highcharts;