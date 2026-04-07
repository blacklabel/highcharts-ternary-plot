import * as Highcharts from 'highcharts';

// ---------------------------------------------------------------------------
// Plugin-internal types
// ---------------------------------------------------------------------------

type Vec2 = [number, number];

type TernaryOptsInput = {
    enabled?: boolean;
    angle?: number;
    spacing?: number;
    sumTo?: number;
};
type TernaryOpts = Required<TernaryOptsInput>;

type MedianOptsInput = {
    enabled?: boolean;
    color?: string;
    width?: number;
    dashStyle?: string;
};
type MedianOpts = Required<MedianOptsInput>;

// User-configurable axis options (mirrors chart.ternaryAxis.a / .b / .c)
type TernaryAxisOptions = {
    tickInterval: number;
    lineWidth: number;
    lineColor: string;
    lineDashStyle: string;
    gridLineWidth: number;
    gridLineColor: string;
    gridLineDashStyle: string;
    gridLineExtension?: number;
    median?: boolean | {
        enabled?: boolean;
        color?: string;
        width?: number;
        dashStyle?: string;
    };
    labels: {
        enabled?: boolean;
        align: string;
        zIndex: number;
        distance: number;
        x: number;
        y: number;
        style: Record<string, string | number>;
    };
    title: {
        text?: string;
        margin: number;
        x: number;
        y: number;
        position?: 'side' | 'corner';
        offsetDirection?: 'perpendicular' | 'horizontal';
        rotation?: number;
        style: Record<string, string | number>;
    };
};

// Runtime rendering state attached to each axis by the plugin
type TernaryAxisState = {
    axisCenter?: Vec2;
    titleDirection?: Vec2;
    titleElem?: Highcharts.SVGElement;
    gridlineTicks?: Record<string, Highcharts.SVGElement | null>;
    gridlineLabels?: Record<string, Highcharts.SVGElement | null>;
};

type TernaryAxisConfig = TernaryAxisOptions & TernaryAxisState;

type TernaryChart = Highcharts.Chart & {
    ternaryOpts: TernaryOpts;
    ternaryAxis: TernaryAxisConfig[];
    resolveTernary(
        opt: boolean | TernaryOptsInput | undefined
    ): TernaryOpts | null;
    resolveMedian(
        opt: boolean | MedianOptsInput | undefined
    ): MedianOpts | null;
    ternaryToPlot(
        point: TernaryPlotInput,
        useSumTo?: boolean
    ): Vec2;
    getGridLines(
        axis: TernaryAxisConfig,
        index: number
    ): Record<string, Highcharts.SVGElement | null>;
    getLabels(
        axis: TernaryAxisConfig,
        index: number
    ): Record<string, Highcharts.SVGElement | null>;
};

type TernaryPoint = Highcharts.Point & {
    a: number;
    b: number;
    c: number;
    total: number;
    ternaryColor?: string;
    formatPrefix: string;
    getRadius(): number;
};

type ComponentColors = {
    a: string;
    b: string;
    c: string;
    alpha?: number;
    strokeAlpha?: number;
};

type TernarySeriesOptions = Highcharts.SeriesOptions & {
    minSize?: number;
    maxSize?: number;
    componentColors?: ComponentColors;
};

type TernarySeries = Highcharts.Series & {
    options: TernarySeriesOptions;
    points: TernaryPoint[];
    chart: TernaryChart;
    _radiusCache?: { min: number; max: number };
    getTernaryColor(
        a: number,
        b: number,
        c: number,
        alpha?: number
    ): string;
};

// Both object-form (TernaryPoint) and array-form ([a, b] or [a, b, c])
// are valid inputs to ternaryToPlot
type TernaryPlotInput = {
    a?: number;
    b?: number;
} | number[];

// Geometry for each of the 3 axes, computed from ternaryOpts.angle
type AxisDef = {
    axisCenters: [Vec2, Vec2];
    rotationSign: number;
    titleDirections: [Vec2, Vec2, Vec2];
};

// Return type of Series.getPlotBox — the coordinate transform for the plot group
type PlotBoxTransform = {
    translateX: number;
    translateY: number;
    rotation: number;
    rotationOriginX: number;
    rotationOriginY: number;
    scaleX: number;
    scaleY: number;
};

// Highcharts exposes clamp internally but not in its public types
type HighchartsPlugin = typeof Highcharts & {
    clamp(
        value: number,
        min: number,
        max: number
    ): number;
    ternaryPlotPluginLoaded?: boolean;
};

// ---------------------------------------------------------------------------

export type {
    TernaryOptsInput,
    MedianOptsInput,
    TernaryOpts,
    MedianOpts
};

export default function TernaryPlotPlugin(H: HighchartsPlugin): void {
    if (H.ternaryPlotPluginLoaded) return;
    H.ternaryPlotPluginLoaded = true;

    // ---- Utils ----

    const {
        addEvent,
        Chart,
        clamp,
        color,
        correctFloat,
        defined,
        fireEvent,
        isNumber,
        merge,
        pick,
        Series,
        seriesType,
        wrap
    } = H;

    // ---- Defaults ----

    const defaultTernary = {
        tickInterval: 50,
        lineWidth: 1,
        lineColor: '#d6d6d6',
        lineDashStyle: 'Solid',
        gridLineWidth: 1,
        gridLineColor: '#d6d6d6',
        gridLineDashStyle: 'Solid',
        title: {
            text: 'Axis',
            margin: 30,
            x: 0,
            y: 0,
            style: {
                align: 'center',
                zIndex: 2,
                fontSize: '0.8em',
                color: '#000000'
            }
        },
        labels: {
            zIndex: 2,
            align: 'center',
            distance: 6,
            x: 0,
            y: 0,
            style: {
                fontSize: '0.8em'
            }
        }
    };

    // ---- Chart prototype methods ----

    Chart.prototype.resolveTernary = function (
        this: TernaryChart,
        ternaryOpt: boolean | TernaryOptsInput | undefined
    ): TernaryOpts | null {
        if (!ternaryOpt) return null;

        const isObj = typeof ternaryOpt === 'object' && ternaryOpt !== null;

        if (isObj && ternaryOpt.enabled === false) return null;

        const opts = isObj ? ternaryOpt : {};

        return {
            enabled: true,
            angle: opts.angle ?? 60,
            spacing: opts.spacing ?? 35,
            sumTo: opts.sumTo ?? 100
        };
    };

    Chart.prototype.resolveMedian = function (
        this: TernaryChart,
        medianOpt: boolean | MedianOptsInput | undefined
    ): MedianOpts | null {
        if (!medianOpt) return null;

        const isObj = typeof medianOpt === 'object' && medianOpt !== null;

        if (isObj && medianOpt.enabled === false) return null;

        const opts = isObj ? medianOpt : {};

        return {
            enabled: true,
            color: opts.color ?? '#d6d6d6',
            width: opts.width ?? 1,
            dashStyle: opts.dashStyle ?? 'Solid'
        };
    };

    // Render ternary axis gridlines. Keep it on chart for easy access
    Chart.prototype.getGridLines = function (
        this: TernaryChart,
        axis: TernaryAxisConfig,
        index: number
    ): Record<string, Highcharts.SVGElement | null> {
        const gridLines: Record<string, Highcharts.SVGElement | null> = {};
        const interval = axis.tickInterval;

        if (!interval || interval <= 0) return gridLines;

        const chart = this,
            ternaryOpts = chart.ternaryOpts,
            sumTo = ternaryOpts.sumTo;

        let p1: Vec2,
            p2: Vec2;

        const medianOpts = chart.resolveMedian(axis.median);

        function renderLine(
            path: (string | number)[],
            median?: MedianOpts,
            isAxisLine?: boolean
        ): Highcharts.SVGElement {
            const stroke = median ? median.color
                    : (isAxisLine ? axis.lineColor : axis.gridLineColor),
                strokeWidth = median ? median.width
                    : (isAxisLine ? axis.lineWidth : axis.gridLineWidth),
                dashStyle = median ? median.dashStyle
                    : (isAxisLine ? axis.lineDashStyle : axis.gridLineDashStyle);

            const attrs: Record<string, unknown> = {
                'stroke-width': strokeWidth,
                stroke,
                zIndex: 2
            };

            if (median || (isAxisLine && dashStyle && dashStyle !== 'Solid')) {
                attrs['shape-rendering'] = 'geometricPrecision';
            }

            if (dashStyle && dashStyle !== 'Solid') {
                attrs.dashstyle = dashStyle;
            }

            return chart.renderer
                .path(path as unknown as Highcharts.SVGPathArray)
                .attr(attrs)
                .add();
        }

        if (medianOpts) {
            const sidesAndMedians = [
                // Sides: ordered to match axes (a=bottom, b=right, c=left)
                [[0, 0], [100, 0]],    // bottom side (axis a)
                [[100, 0], [0, 100]],  // right side  (axis b)
                [[0, 100], [0, 0]],    // left side   (axis c)
                // Medians: opposite vertex → midpoint of axis side
                [[0, 100], [50, 0]],   // top → bottom midpoint   (axis a)
                [[0, 0], [50, 50]],    // bottom-left → right midpoint (axis b)
                [[100, 0], [0, 50]]    // bottom-right → left midpoint (axis c)
            ];

            for (let i = 0; i < 2; i++) {
                const [from, to] = sidesAndMedians[index + i * 3];

                p1 = chart.ternaryToPlot(from);
                p2 = chart.ternaryToPlot(to);

                const path = [
                    'M', chart.plotLeft + p1[0], p1[1] + chart.plotTop,
                    'L', chart.plotLeft + p2[0], p2[1] + chart.plotTop
                ];

                gridLines[i] = renderLine(
                    path,
                    i % 2 === 1 ? medianOpts : undefined,
                    i % 2 === 0
                );
            }
        } else {
            for (let cursor = 0; cursor <= sumTo; cursor += interval) {
                const gridLineExtension = axis.gridLineExtension || 0,
                    alpha =
                        clamp(ternaryOpts.angle, 1, 89)
                        * Math.PI / 180,
                    heightRatio = Math.tan(alpha) / 2;

                switch (index) {
                    // First grid (bottom axis)
                    case 0:
                        p1 = chart.ternaryToPlot(
                            [cursor, sumTo - cursor], true
                        );
                        p2 = chart.ternaryToPlot([cursor, 0], true);
                        p2[0] = p2[0] - gridLineExtension / 2;
                        p2[1] = p2[1] + heightRatio * gridLineExtension;
                        break;
                    // Second grid (right axis)
                    case 1:
                        p1 = chart.ternaryToPlot([0, cursor], true);
                        p2 = chart.ternaryToPlot(
                            [sumTo - cursor, cursor], true
                        );
                        p2[0] = p2[0] + gridLineExtension;
                        break;
                    // Third grid (left axis)
                    default:
                        p1 = chart.ternaryToPlot([cursor, 0], true);
                        p2 = chart.ternaryToPlot([0, cursor], true);
                        p2[0] = p2[0] - gridLineExtension / 2;
                        p2[1] = p2[1] - heightRatio * gridLineExtension;
                }

                const { plotLeft, plotTop } = chart;
                const path = [
                    'M', plotLeft + p1[0], plotTop + p1[1],
                    'L', plotLeft + p2[0], plotTop + p2[1]
                ];

                gridLines[cursor] = renderLine(
                    path,
                    undefined,
                    cursor === 0 || cursor === sumTo
                );
            }
        }

        return gridLines;
    };

    // Render ternary axis labels. Keep it on chart for easy access
    Chart.prototype.getLabels = function (
        this: TernaryChart,
        axis: TernaryAxisConfig,
        index: number
    ): Record<string, Highcharts.SVGElement | null> {
        const labels: Record<string, Highcharts.SVGElement | null> = {},
            interval = axis.tickInterval;

        if (!interval || interval <= 0) return labels;

        const chart = this,
            ternaryOpts = chart.ternaryOpts,
            sumTo = ternaryOpts.sumTo,
            { plotLeft, plotTop } = chart,
            { align, zIndex, style, x, y } = axis.labels,
            gridLineExtension = axis.gridLineExtension || 0,
            labelMargin = axis.labels.distance || 0,
            distance = gridLineExtension + labelMargin,
            alpha = clamp(ternaryOpts.angle, 1, 89) * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2;

        for (let tick = 0; tick <= sumTo; tick += interval) {
            const label = labels[tick] = chart.renderer
                .text(String(tick), x, y)
                .attr({ align, zIndex })
                .css(style)
                .add();

            const fm = chart.renderer.fontMetrics(label),
                bb = label.getBBox();

            let pos: Vec2,
                offsetX = 0,
                offsetY = 0;

            switch (index) {
                case 0: // horizontal
                    pos = chart.ternaryToPlot([tick, 0], true);
                    if (gridLineExtension) {
                        offsetX = - distance / 2;
                        offsetY = heightRatio * distance + fm.b;
                    } else {
                        offsetY = distance + fm.b;
                    }
                    break;
                case 1: // vertical right
                    pos = chart.ternaryToPlot([sumTo - tick, tick], true);
                    offsetX = distance + bb.width / 2;
                    break;
                default: // vertical left
                    pos = chart.ternaryToPlot([0, sumTo - tick], true);
                    if (gridLineExtension) {
                        offsetX = - distance / 2;
                        offsetY = - heightRatio * distance;
                    } else {
                        offsetX = - distance - bb.width / 2;
                    }
            }

            label.translate(
                plotLeft + pos[0] + offsetX,
                plotTop + pos[1] + offsetY
            );
        }

        return labels;
    };

    // Convert ternary (a, b) to plot coordinates
    // using 2D barycentric projection
    Chart.prototype.ternaryToPlot = function (
        this: TernaryChart,
        point: TernaryPlotInput,
        useSumTo?: boolean
    ): Vec2 {
        const chart = this,
            ternaryOpts = chart.ternaryOpts,
            spacing = ternaryOpts.spacing * 2,
            // α — angle between the triangle side and the base (0° < α < 90°)
            alpha = clamp(ternaryOpts.angle, 1, 89) * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2,
            // Determine the length of the triangle's base from available space
            baseWidth = Math.min(chart.plotWidth, chart.plotHeight / heightRatio),
            // Shrink by spacing to get the final width
            width = Math.max(baseWidth - spacing, 5),
            sumTo = useSumTo ? ternaryOpts.sumTo : 100,
            a = pick((point as { a?: number }).a, (point as number[])[0]),
            b = pick((point as { b?: number }).b, (point as number[])[1]),
            x = a * width / sumTo,
            y = b * width / sumTo,
            // Center within the plot area
            centerX = (chart.plotWidth - width) / 2,
            centerY = (chart.plotHeight - width * heightRatio) / 2;

        return [
            x + y / 2 + centerX,
            chart.plotHeight - y * heightRatio - centerY
        ];
    };
    // 2D barycentric projection
    //
    // Only [x, y] is needed for calculations (x + y + z = sumTo)
    //
    // pH - plotHeight
    //
    // For any 0 < α < 90
    //                            (50, 100·tan(α)/2)
    //                                   / \
    //                                  /   \
    //                                 /     \
    //                                /       \
    //                               /         \
    //                              /           \
    //                             /             \
    //                            /               \
    //                           /                 \
    //                          /                   \
    //                         /                     \
    //                        /                       \
    //                       /                         \
    //                      /                           \
    //                     /                             \
    //                    /     P(x+y/2, pH-(tan(α)/2)*y) \___
    //                   /             ○                   \
    //                  /             /|                    \
    //                 /             / |                     \
    //                /             /  |                      \
    //               /           y /   | (tan(α)/2)*y          \ y
    //              /             /    |                        \
    //             /             /     |                         \
    //            /α            / α    |                       α  \
    //           /_____________/_______|___________________________\___
    //   (0, 0)  |      x      |  y/2  |                             (100, 0)


    // Fix for NaN clip box width issue after v12.1.0
    // (getClipBox moved to Chart prototype)
    if (Chart.prototype.getClipBox) {
        wrap(Chart.prototype, 'getClipBox', function (
            this: TernaryChart,
            proceed: Highcharts.WrapProceedFunction,
            series: Highcharts.Series,
            chartCoords: boolean
        ) {
            const ret = proceed.call(this, series, chartCoords) as Record<string, number>;

            ret.width = this.xAxis[0].len;

            return ret;
        });
    }

    // ---- Series prototype methods ----

    // Translate data points from ternary x,y to plotX,plotY
    function translate(this: TernarySeries): void {
        this.generatePoints();

        if (!this.chart.ternaryOpts) {
            this.points.forEach(p => { p.isNull = true; });
            return;
        }

        // Stub xAxis so that pointPlacementToXValue() and isRadial checks
        // inside Highcharts internals don't throw on a non-cartesian series
        this.xAxis = {
            isRadial: false,
            options: {
                type: 'linear'
            }
        } as unknown as Highcharts.Axis;

        const series = this,
            chart = series.chart,
            xAxis = series.xAxis,
            points = series.points,
            dataLength = points.length,
            sumTo = chart.ternaryOpts.sumTo,
            pointPlacement = series.pointPlacementToXValue(), // #7860
            dynamicallyPlaced = Boolean(pointPlacement);

        let i: number,
            lastPlotX: number,
            closestPointRangePx = Number.MAX_VALUE;

        // Pre-compute min/max totals once per translate pass for getRadius()
        if (series.options.minSize && series.options.maxSize) {
            const allTotals = points.map((p: TernaryPoint) => p.total);

            series._radiusCache = {
                min: Math.min(...allTotals),
                max: Math.max(...allTotals)
            };
        }

        // Translate each point
        for (i = 0; i < dataLength; i++) {
            const point = points[i],
                xValue = point.a;

            point.yBottom = undefined;

            const perspectivePoint = chart.ternaryToPlot(point, true);

            point.plotX = perspectivePoint[0];
            point.plotY = perspectivePoint[1];

            // Derive c from a + b if not explicitly provided.
            // The projection only needs a and b, but c must be a valid number
            // for tooltips and color interpolation.
            if (!isNumber(point.c)) {
                point.c = sumTo - point.a - point.b;
            }

            // Preserve user-provided total (independent 4th dimension, e.g.
            // raw count for bubble sizing). Fall back to component sum only
            // when absent.
            if (!isNumber(point.total)) {
                point.total = point.a + point.b + point.c;
            }

            (point as { shapeArgs: Highcharts.SVGAttributes }).shapeArgs = {
                x: point.plotX,
                y: point.plotY
            };

            // Do we need it? Perhaps for the future
            //point.isInside = this.isPointInside(point);
            point.isInside = true;

            // Ensure the tooltip engine resolves to pointFormat/headerFormat.
            // Custom series types may not inherit the default 'point' prefix,
            // causing an empty tooltip.
            point.formatPrefix = 'point';

            // Keep Highcharts internals happy: isNull check, getLabelConfig
            // and yData all rely on point.y being a valid number
            point.y = point.b;
            point.isNull = false;

            (point as unknown as { tooltipPos: number[] }).tooltipPos =
                [point.plotX, point.plotY];

            // Set client related positions for mouse tracking
            point.clientX = dynamicallyPlaced ?
                correctFloat(
                    xAxis.translate(
                        xValue,
                        false,
                        false,
                        false,
                        true,
                        pointPlacement
                    )
                ) :
                point.plotX!; // #1514, #5383, #5518

            // Determine auto enabling of markers (#3635, #5099)
            if (!point.isNull && point.visible !== false) {
                if (defined(lastPlotX)) {
                    closestPointRangePx = Math.min(
                        closestPointRangePx,
                        Math.abs(point.plotX! - lastPlotX)
                    );
                }

                lastPlotX = point.plotX!;
            }

            if (
                (
                    !point.marker ||
                    !defined(point.marker.radius)
                ) &&
                series.options.minSize &&
                series.options.maxSize
            ) {
                point.marker = {
                    radius: point.getRadius()
                };
            }
        }

        series.closestPointRangePx = closestPointRangePx;

        fireEvent(this, 'afterTranslate');
    }

    function getTernaryColor(
        this: TernarySeries,
        a: number,
        b: number,
        c: number,
        alpha?: number
    ): string {
        const { componentColors } = this.options;

        // H.color handles all formats HC supports (hex, rgb, rgba, named,
        // 8-digit hex, etc.) — new formats added to HC work here for free.
        // Alpha from the color string is intentionally ignored; use
        // componentColors.alpha to control opacity uniformly.
        const ca = color(componentColors!.a).rgba,
            cb = color(componentColors!.b).rgba,
            cc = color(componentColors!.c).rgba;

        // Return transparent if any color string was unparseable.
        // H.color() always returns an rgba array, but invalid strings produce
        // NaN values — isNumber(NaN) is false, so we check the red channel.
        if (!isNumber(ca[0]) || !isNumber(cb[0]) || !isNumber(cc[0])) {
            return 'rgba(0,0,0,0)';
        }

        // Barycentric interpolation: each point color is a weighted blend
        // of the three corner colors, where weights = a/b/c component values
        const sumTo = this.chart.ternaryOpts.sumTo,
            wa = a / sumTo,
            wb = b / sumTo,
            wc = c / sumTo,
            rCh = Math.round(ca[0] * wa + cb[0] * wb + cc[0] * wc),
            gCh = Math.round(ca[1] * wa + cb[1] * wb + cc[1] * wc),
            bCh = Math.round(ca[2] * wa + cb[2] * wb + cc[2] * wc),
            finalAlpha = alpha ?? componentColors!.alpha ?? 1;

        return `rgba(${rCh}, ${gCh}, ${bCh}, ${finalAlpha})`;
    }

    function pointAttribs(
        this: TernarySeries,
        point: TernaryPoint,
        state: string
    ): Highcharts.SVGAttributes {
        const attr = Series.prototype.pointAttribs.call(
            this,
            point,
            state
        );

        if (!point || point.isNull || !this.options.componentColors) {
            return attr;
        }

        const [a, b, c] = [point.a, point.b, point.c];

        attr.fill = this.getTernaryColor(a, b, c);

        point.ternaryColor = this.getTernaryColor(a, b, c, 1);

        const strokeAlpha = this.options.componentColors?.strokeAlpha;
        attr.stroke = point.marker?.lineColor ||
            (strokeAlpha !== undefined
                ? this.getTernaryColor(a, b, c, strokeAlpha)
                : point.ternaryColor);

        return attr;
    }

    // Return the plot box of the ternary plot area
    function getPlotBox(
        this: TernarySeries,
        name: string
    ): PlotBoxTransform {
        const { plotLeft, plotTop } = this.chart;
        const params = {
            name,
            scale: 1,
            translateX: plotLeft,
            translateY: plotTop
        };

        fireEvent(this, 'getPlotBox', params);

        return {
            translateX: plotLeft,
            translateY: plotTop,
            rotation: 0,
            rotationOriginX: 0,
            rotationOriginY: 0,
            scaleX: 1,
            scaleY: 1
        };
    }

    function getRadius(this: TernaryPoint): number {
        const series = this.series as TernarySeries,
            minSize = series.options.minSize!,
            maxSize = series.options.maxSize!,
            cache = series._radiusCache,
            allTotals = cache ? null : series.points.map((p: TernaryPoint) => p.total),
            minValue = cache ? cache.min : Math.min(...allTotals),
            maxValue = cache ? cache.max : Math.max(...allTotals);

        if (maxValue === minValue) return (minSize + maxSize) / 2;

        const t = (this.total - minValue) / (maxValue - minValue),
            minA = Math.PI * minSize * minSize,
            maxA = Math.PI * maxSize * maxSize,
            A = minA + t * (maxA - minA);

        return Math.sqrt(A / Math.PI);
    }

    // ---- Events ----

    // Initialize ternary axes before rendering the chart
    function buildTernaryAxis(chart: TernaryChart): void {
        const ternaryOpts = chart.ternaryOpts,
            ternaryAngle = clamp(ternaryOpts.angle, 1, 89),
            alpha = ternaryAngle * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2;

        const axes: AxisDef[] = [{
            // Horizontal
            axisCenters: [[50, 0], [100, 0]],
            rotationSign: 0,
            // Two different positions (margin directions):
            // perpendicular to the axis line, or purely horizontal
            titleDirections: [[0, 1], [0, 1], [0, 1]]
        }, {
            // Vertical right
            axisCenters: [[50, 50], [0, 100]],
            rotationSign: 1,
            titleDirections: [[-heightRatio, -1 / 2], [-1, 0], [0, -1]]
        }, {
            // Vertical left
            axisCenters: [[0, 50], [0, 0]],
            rotationSign: -1,
            titleDirections: [[heightRatio, -1 / 2], [1, 0], [0, 1]]
        }];

        const axisKeys = ['a', 'b', 'c'] as const,
            userTernaryAxis = (chart.options as Highcharts.Options).ternaryAxis || {};

        chart.ternaryAxis = axes.map(({
            axisCenters,
            rotationSign,
            titleDirections
        }, i) => {
            const axis = merge(
                    defaultTernary,
                    userTernaryAxis.common ?? {},
                    userTernaryAxis[axisKeys[i]] ?? {}
                ) as TernaryAxisConfig;

            let rotation = 0,
                axisCenter: Vec2;

            if (axis.title.position === 'corner') {
                axisCenter = axisCenters[1];
            } else {
                axisCenter = axisCenters[0];

                rotation = pick(
                    userTernaryAxis[axisKeys[i]]?.title?.rotation,
                    rotationSign * ternaryAngle
                );
            }

            axis.axisCenter = axisCenter;

            axis.title.style['rotation'] = rotation;

            axis.titleDirection =
                titleDirections[axis.title.position === 'corner' ?
                    2 :
                    (axis.title.offsetDirection === 'horizontal' ? 1 : 0)];

            axis.gridlineTicks = {};

            return axis;
        });
    }

    addEvent(Chart, 'beforeRender', function (this: TernaryChart) {
        const chart = this,
            ternaryOpts = chart.resolveTernary(
                (chart.options.chart as Highcharts.ChartOptions).ternary
            );

        if (!ternaryOpts) return;

        chart.ternaryOpts = ternaryOpts;
        buildTernaryAxis(chart);
    });

    // Position ternary axis titles and render gridlines/labels after
    // setting chart size
    addEvent(Chart, 'afterSetChartSize', function (this: TernaryChart) {
        const chart = this;

        if (!chart.ternaryOpts || !chart.ternaryAxis) return;

        const destroyCollection = (
            coll: Record<string, Highcharts.SVGElement | null> | undefined
        ): void => {
            if (!coll) return;

            for (const k in coll) {
                if (coll[k]) {
                    coll[k]!.destroy();
                    coll[k] = null;
                }
            }
        };

        chart.ternaryAxis.forEach((axis: TernaryAxisConfig, i: number) => {
            const title = axis.title;

            if (title?.text) {
                if (!axis.titleElem) {
                    axis.titleElem = chart.renderer
                        .text(title.text, title.x, title.y)
                        .css(title.style)
                        .attr(title.style)
                        .add();
                }

                const [x0, y0] = chart.ternaryToPlot(axis.axisCenter!),
                    [dirX, dirY] = axis.titleDirection!,
                    // The pixel distance between the axis line and the title.
                    titleMargin = title.margin;

                // Move one or two bottom titles down to avoid overlapping
                // with gridLines
                let offsetY = 0;
                if (i !== 1 && (title.position === 'corner' || i === 0)) {
                    // Font metrics baseline is better than bbox.height
                    // for better baseline alignment
                    const fm = chart.renderer.fontMetrics(axis.titleElem!);

                    offsetY = fm.b - 5;
                }

                axis.titleElem.translate(
                    x0 + (-titleMargin * dirX) + chart.plotLeft,
                    y0 + (titleMargin * dirY) + chart.plotTop + offsetY
                );
            }

            // Axis grid lines and labels: destroy previous
            destroyCollection(axis.gridlineTicks);
            destroyCollection(axis.gridlineLabels);

            // Recreate
            if (axis.gridLineWidth >= 1) {
                axis.gridlineTicks = chart.getGridLines(axis, i);
            }

            if (axis.labels.enabled !== false) {
                axis.gridlineLabels = chart.getLabels(axis, i);
            }
        });
    });

    function destroyTernaryAxis(chart: TernaryChart): void {
        if (!chart.ternaryAxis) return;

        chart.ternaryAxis.forEach(axis => {
            axis.titleElem?.destroy();
            axis.titleElem = undefined;

            [axis.gridlineTicks, axis.gridlineLabels].forEach(coll => {
                if (!coll) return;
                for (const k in coll) {
                    coll[k]?.destroy();
                    coll[k] = null;
                }
            });
        });
    }

    addEvent(Chart, 'destroy', function (this: TernaryChart) {
        destroyTernaryAxis(this);
    });

    // Rebuild ternary axis config when chart options change via chart.update()
    addEvent(Chart, 'afterUpdate', function (this: TernaryChart) {
        const chart = this,
            ternaryOpts = chart.resolveTernary(
                (chart.options.chart as Highcharts.ChartOptions).ternary
            );

        if (!ternaryOpts) return;

        // Destroy old SVG elements before rebuilding axis objects,
        // otherwise the old titleElem references would be lost and leaked
        destroyTernaryAxis(chart);

        chart.ternaryOpts = ternaryOpts;

        // Rebuild axis config from updated options
        buildTernaryAxis(chart);

        // afterSetChartSize already ran during chart.update() with old config —
        // re-render now that ternaryAxis has been rebuilt
        fireEvent(chart, 'afterSetChartSize');
    });

    addEvent(Chart, 'afterIsInsidePlot', function (
        this: TernaryChart,
        e: { x: number; y: number; isInsidePlot: boolean }
    ) {
        const chart = this;

        if (!chart.ternaryOpts) {
            return;
        }

        // Barycentric technique to determine if point is inside triangle
        function pointInTriangle(
            px: number, py: number,
            ax: number, ay: number,
            bx: number, by: number,
            cx: number, cy: number
        ): boolean {
            const v0x = cx - ax, v0y = cy - ay,
                v1x = bx - ax, v1y = by - ay,
                v2x = px - ax, v2y = py - ay,
                dot00 = v0x * v0x + v0y * v0y,
                dot01 = v0x * v1x + v0y * v1y,
                dot02 = v0x * v2x + v0y * v2y,
                dot11 = v1x * v1x + v1y * v1y,
                dot12 = v1x * v2x + v1y * v2y,
                invDenom = 1 / (dot00 * dot11 - dot01 * dot01),
                u = (dot11 * dot02 - dot01 * dot12) * invDenom,
                v = (dot00 * dot12 - dot01 * dot02) * invDenom,
                // Allow points very close to the edge
                // (floating point precision)
                eps = 0.01;

            return u >= -eps && v >= -eps && u + v <= 1 + eps;
        }

        const [Ax, Ay] = chart.ternaryToPlot([0, 0]),
            [Bx, By] = chart.ternaryToPlot([100, 0]),
            [Cx, Cy] = chart.ternaryToPlot([0, 100]),
            px = e.x,
            py = e.y;

        e.isInsidePlot = pointInTriangle(
            px, py,
            Ax, Ay,
            Bx, By,
            Cx, Cy
        );
    });

    addEvent(Series, 'afterDrawDataLabels', function (this: TernarySeries) {
        if (!(this.options.minSize && this.options.maxSize)) {
            return;
        }

        this.points.forEach(point => {
            // Is there a better TS type?
            const dataLabel = point.dataLabel as Highcharts.SVGElement & {
                placed?:
                boolean;
                y: number;
                height: number
            };

            dataLabel[dataLabel.placed ? 'animate' : 'attr']({
                y: dataLabel.y - point.marker.radius + 5
            });
        });
    });

    // ---- New Series ----

    // Define the new ternaryscatter series type
    seriesType(
        'ternaryscatter',
        'scatter',
        // Default series options
        {
            tooltip: {
                headerFormat: '{point.name}<br/>',
                pointFormat: '{point.a}, {point.b}, {point.c}'
            }
        },
        // Series proto
        {
            directTouch: true,
            isCartesian: false,
            noSharedTooltip: true,
            axisTypes: [],
            pointArrayMap: ['a', 'b', 'c'],
            parallelArrays: ['a', 'b', 'c'],
            // Override Series prototype methods
            translate: translate,
            getPlotBox: getPlotBox,
            getTernaryColor: getTernaryColor,
            pointAttribs: pointAttribs
        },
        // Point proto
        {
            getRadius: getRadius
        }
    );
}
