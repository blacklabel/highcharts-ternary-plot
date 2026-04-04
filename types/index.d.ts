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

    interface TernaryPerAxisOptions {
        /** Interval between grid lines. @default 50 */
        tickInterval?: number;

        /** Color of the triangle sides. @default '#d6d6d6' */
        lineColor?: string;
        /** Width of the triangle sides in pixels. @default 1 */
        lineWidth?: number;
        /** Dash style of the triangle sides. @default 'Solid' */
        lineDashStyle?: string;

        /** Color of the internal grid lines. @default '#d6d6d6' */
        gridLineColor?: string;
        /** Width of the internal grid lines in pixels. @default 1 */
        gridLineWidth?: number;
        /** Dash style of the internal grid lines. @default 'Solid' */
        gridLineDashStyle?: string;
        /** Extends grid lines beyond the triangle edges, in pixels. @default 0 */
        gridLineExtension?: number;

        /**
         * Show or configure median lines (vertex → midpoint of opposite side).
         * Pass `true` to enable with defaults, or an object to customize.
         */
        median?: boolean | {
            enabled?: boolean;
            /** @default '#d6d6d6' */
            color?: string;
            /** @default 1 */
            width?: number;
            /** @default 'Solid' */
            dashStyle?: string;
        };

        labels?: {
            /** Show or hide tick labels. */
            enabled?: boolean;
            /** CSS style object applied to label text. */
            style?: Record<string, string | number>;
            /** Distance between labels and the triangle edge, in pixels. @default 6 */
            distance?: number;
        };

        title?: {
            /** Axis title text. */
            text?: string;
            /** CSS style object applied to the title. */
            style?: Record<string, string | number>;
            /** Distance between the title and the triangle edge, in pixels. @default 30 */
            margin?: number;
            /** Position of the title relative to the triangle. */
            titlePosition?: 'side' | 'corner';
            /** Direction the title offsets from its axis edge. */
            offsetDirection?: 'perpendicular' | 'horizontal';
            /** Title rotation in degrees. Overrides automatic rotation. */
            rotation?: number;
        };
    }

    interface TernaryAxisGroupOptions {
        /**
         * Shared options applied to all three axes before per-axis overrides.
         */
        plotOptions?: TernaryPerAxisOptions;
        /** Options for the bottom axis (component A). */
        a?: TernaryPerAxisOptions;
        /** Options for the right axis (component B). */
        b?: TernaryPerAxisOptions;
        /** Options for the left axis (component C). */
        c?: TernaryPerAxisOptions;
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
        getGridLines(
            axis: unknown,
            index: number
        ): Record<string, SVGElement | null>;
        /** @internal */
        getLabels(
            axis: unknown,
            index: number
        ): Record<string, SVGElement | null>;
        /** @internal */
        ternaryToPlot(point: unknown, useSumTo?: boolean): [number, number];
        /** Added in Highcharts 12.1.0 */
        getClipBox?(
            series?: Series,
            chartCoords?: boolean
        ): BBoxObject;
    }

    // ---- Internal Series APIs used by the plugin ----

    interface Series {
        /** @internal */
        pointAttribs(
            point: Point,
            state: string
        ): SVGAttributes;
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
