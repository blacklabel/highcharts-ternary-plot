// Internal Highcharts API augmentations used by the plugin implementation.
// `export {}` makes this file a module so `declare module` is treated as
// augmentation (merges with existing types) rather than redeclaration.
export {};

declare module 'highcharts' {

    interface ChartOptions {
        ternary?: boolean | {
            enabled?: boolean;
            angle?: number;
            spacing?: number;
            sumTo?: number;
        };
    }

    interface Options {
        ternaryAxis?: {
            plotOptions?: AxisOptions;
            a?: AxisOptions;
            b?: AxisOptions;
            c?: AxisOptions;
        };
    }

    interface Chart {
        getGridLines(
            axis: unknown,
            index: number
        ): Record<string, SVGElement | null>;
        getLabels(
            axis: unknown,
            index: number
        ): Record<string, SVGElement | null>;
        ternaryToPlot(point: unknown, useSumTo?: boolean): [number, number];
        /** Added in Highcharts 12.1.0 */
        getClipBox?(series?: Series, chartCoords?: boolean): BBoxObject;
    }

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

    interface Color {
        /** @internal [r, g, b, a] where r/g/b are 0–255 and a is 0–1 */
        rgba: [number, number, number, number];
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
        zone?: unknown;
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
