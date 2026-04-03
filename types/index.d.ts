import * as _Highcharts from 'highcharts';

declare module 'highcharts' {

    // ---- Ternary plugin options ----

    interface TernaryOptions {
        /**
         * Set to `false` to disable the ternary plot while keeping the
         * configuration object in place.
         */
        enabled?: boolean;
        /**
         * Angle in degrees between the base of the triangle and its sides.
         * Controls the shape: 60 produces an equilateral triangle.
         * Values below ~15 or above ~75 produce visually extreme shapes.
         * Must be in the open range (0, 90).
         * @default 60
         */
        angle?: number;
        /**
         * Pixel padding applied uniformly around the triangle within the
         * plot area. Increase to make room for axis labels.
         * @default 35
         */
        spacing?: number;
        /**
         * The value that the three components must sum to.
         * Use `100` for percentages, `1` for fractions.
         * @default 100
         */
        sumTo?: number;
    }

    interface ChartOptions {
        /**
         * Enable and configure the ternary plot coordinate system.
         * Set to `true` to use all defaults, or pass an options object.
         */
        ternary?: boolean | TernaryOptions;
    }

    interface TernaryAxisGroupOptions {
        /**
         * Shared options applied to all three axes before per-axis overrides.
         */
        plotOptions?: _Highcharts.AxisOptions;
        /** Options for the bottom axis (component A). */
        a?: _Highcharts.AxisOptions;
        /** Options for the right axis (component B). */
        b?: _Highcharts.AxisOptions;
        /** Options for the left axis (component C). */
        c?: _Highcharts.AxisOptions;
    }

    interface Options {
        ternaryAxis?: TernaryAxisGroupOptions;
    }

    interface TernaryComponentColors {
        /** Color at the vertex where component A = 100%. */
        a: string;
        /** Color at the vertex where component B = 100%. */
        b: string;
        /** Color at the vertex where component C = 100%. */
        c: string;
        /**
         * Opacity applied to all points. Alpha values in the color strings
         * (e.g. `rgba(...)`) are ignored — use this property instead.
         * @default 1
         */
        alpha?: number;
    }

    interface TernaryPointOptions extends PointOptionsObject {
        /** Component A value. */
        a: number;
        /** Component B value. */
        b: number;
        /**
         * Component C value. If omitted, derived automatically as
         * `sumTo - a - b`.
         */
        c?: number;
        /**
         * Independent 4th dimension used for bubble sizing (`minSize` /
         * `maxSize`). If omitted, defaults to `a + b + c`.
         */
        total?: number;
    }

    interface SeriesTernaryScatterOptions
        extends _Highcharts.SeriesOptions,
            _Highcharts.PlotScatterOptions {
        type: 'ternaryscatter';
        data?: Array<TernaryPointOptions | [number, number, number] | null>;
        /**
         * Minimum marker radius in pixels for bubble sizing.
         * Requires `maxSize` to be set.
         */
        minSize?: number;
        /**
         * Maximum marker radius in pixels for bubble sizing.
         * Requires `minSize` to be set.
         */
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
        /**
         * Resolve `chart.ternary` option into a normalized options object,
         * or `null` if ternary mode is disabled.
         */
        resolveTernary(
            opt: boolean | TernaryOptions | undefined
        ): Required<TernaryOptions> | null;
        /**
         * Resolve a `median` axis option into a normalized options object,
         * or `null` if medians are disabled.
         */
        resolveMedian(
            opt: boolean | { enabled?: boolean; color?: string; width?: number; dashStyle?: string } | undefined
        ): { enabled: boolean; color: string; width: number; dashStyle: string } | null;
        /** @internal */
        getGridLines(axis: unknown, index: number): Record<string, SVGElement | null>;
        /** @internal */
        getLabels(axis: unknown, index: number): Record<string, SVGElement | null>;
        /** @internal */
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
        translate(
            val: number,
            backwards?: boolean,
            cvsCoord?: boolean,
            old?: boolean,
            handleLog?: boolean,
            pointPlacement?: number
        ): number;
    }

    // ---- Internal Point properties used by the plugin ----

    interface Point {
        /** @internal */
        yBottom?: number;
        /** @internal */
        isInside?: boolean;
        /** @internal */
        isNull: boolean;
        /** @internal */
        clientX?: number;
        /** @internal */
        marker?: PointMarkerOptionsObject & { radius?: number };
        /** @internal */
        dataLabel?: SVGElement & { placed?: boolean };
        /** @internal */
        formatPrefix?: string;
        readonly tooltipPos?: readonly number[];
        readonly shapeArgs?: Readonly<SVGAttributes>;
    }
}

export function factory(highcharts: typeof _Highcharts): void;
export default factory;
