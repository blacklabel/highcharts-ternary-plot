import * as _Highcharts from 'highcharts';

declare module 'highcharts' {

    // ---- Ternary plugin options ----

    interface TernaryOptions {
        enabled?: boolean;
        angle?: number;
        spacing?: number;
        sumTo?: number;
    }

    interface ChartOptions {
        ternary?: boolean | TernaryOptions;
    }

    interface TernaryAxisGroupOptions {
        plotOptions?: _Highcharts.AxisOptions;
        a?: _Highcharts.AxisOptions;
        b?: _Highcharts.AxisOptions;
        c?: _Highcharts.AxisOptions;
    }

    interface Options {
        ternaryAxis?: TernaryAxisGroupOptions;
    }

    interface TernaryComponentColors {
        /** Color at the vertex where component A = 100% */
        a: string;
        /** Color at the vertex where component B = 100% */
        b: string;
        /** Color at the vertex where component C = 100% */
        c: string;
        /**
         * Opacity of all points. Overrides any alpha in the color strings.
         * @default 1
         */
        alpha?: number;
    }

    interface SeriesTernaryScatterOptions
        extends _Highcharts.SeriesOptions,
            _Highcharts.PlotScatterOptions {
        type: 'ternaryscatter';
        data?: Array<number | [number | string, number | null] | null | PointOptionsObject>;
        minSize?: number;
        maxSize?: number;
        /**
         * Barycentric color interpolation across the triangle. Each point's
         * color is a weighted blend of the three corner colors, proportional
         * to its a/b/c component values.
         */
        componentColors?: TernaryComponentColors;
    }

    interface SeriesOptionsRegistry {
        ternaryscatter: SeriesTernaryScatterOptions;
    }

    // ---- Chart prototype extensions ----

    interface Chart {
        getGridLines(axis: unknown, index: number): Record<string, SVGElement | null>;
        getLabels(axis: unknown, index: number): Record<string, SVGElement | null>;
        ternaryToPlot(point: unknown, useSumTo?: boolean): [number, number];
        /** Added in Highcharts 12.1.0 */
        getClipBox?(series?: Series, chartCoords?: boolean): BBoxObject;
    }

    // ---- Internal Series APIs used by the plugin ----

    interface Series {
        /** @internal */
        pointAttribs(point: Point, state: string): SVGAttributes;
        /** @internal */
        generatePoints(): void;
        /** @internal */
        pointPlacementToXValue(): number;
        /** @internal */
        closestPointRangePx: number;
        /** @internal */
        plotGroup?: SVGElement;
    }

    interface Axis {
        /** @internal */
        translate(val: number, backwards?: boolean, cvsCoord?: boolean, old?: boolean, handleLog?: boolean, pointPlacement?: number): number;
    }

    // ---- Internal Point properties used by the plugin ----

    interface Point {
        yBottom?: number;
        isInside?: boolean;
        isNull: boolean;
        clientX?: number;
        zone?: unknown;
        marker?: PointMarkerOptionsObject & { radius?: number };
        dataLabel?: SVGElement & { placed?: boolean };
        formatPrefix?: string;
        readonly tooltipPos?: readonly number[];
        readonly shapeArgs?: Readonly<SVGAttributes>;
    }
}

export function factory(highcharts: typeof Highcharts): void;
export default factory;
export let Highcharts: typeof _Highcharts;
