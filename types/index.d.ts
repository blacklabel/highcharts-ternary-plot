import * as _Highcharts from 'highcharts';

declare module 'highcharts' {
    interface TernaryAxisGroupOptions {
        plotOptions?: _Highcharts.AxisOptions;
        a?: _Highcharts.AxisOptions;
        b?: _Highcharts.AxisOptions;
        c?: _Highcharts.AxisOptions;
    }

    interface Options {
        ternaryAxis?: TernaryAxisGroupOptions;
    }

    interface TernaryOptions {
        enabled?: boolean;
        angle?: number;
        spacing?: number;
        sumTo?: number;
    }

    interface ChartOptions {
        ternary?: boolean | TernaryOptions;
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