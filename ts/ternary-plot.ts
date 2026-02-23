export default function TernaryPlotPlugin(H: any): void {
    if (H.ternaryPlotPluginLoaded) return;
    H.ternaryPlotPluginLoaded = true;

    // -------------------------------- Utils --------------------------------

    const {
        addEvent,
        Chart,
        clamp,
        correctFloat,
        defined,
        fireEvent,
        isArray,
        isNumber,
        merge,
        pick,
        Series,
        seriesType,
        wrap
    } = H;

    // ------------------------------- Defaults -------------------------------

    const defaultTernary = {
        tickInterval: 50,
        gridLineWidth: 1,
        gridLineColor: '#d6d6d6',
        medianColor: '#d6d6d6',
        minorTickInterval: 0,
        minorGridLineWidth: 0,
        minorGridLineColor: '#d6d6d6',
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
    } as const;

    const defaultChartOpts = {
        ternaryAngle: 60,
        ternarySpacing: 35,
        ternarySumTo: 100
    }

    H.defaultOptions.chart = merge(H.defaultOptions.chart, defaultChartOpts);
    H.defaultOptions.defaultTernary = defaultTernary;

    // ----------------------- Chart prototype methods -----------------------

    // Render ternary axis gridlines. Keep it on chart for easy access
    Chart.prototype.getGridLines = function (
        this: any,
        axis: any,
        index: number
    ) {
        const gridLines: Record<string, any> = {};
        const interval = axis.tickInterval;

        if (!interval || interval <= 0) return gridLines;

        const chart = this,
            chartOptions = chart.options.chart,
            sumTo = chartOptions.ternarySumTo;

        let p1: [number, number],
            p2: [number, number];

        function renderLine(path: any[], isMedian?: boolean): any {
            // TODO: take from options
            const medianColor = axis.medianColor,
                width = axis.gridLineWidth,
                stroke = axis.gridLineColor;

            return chart.renderer
                .path(path)
                .attr({
                    'stroke-width': width,
                    // TODO: for medians add dashStyle, width etc. from options
                    stroke: isMedian ? medianColor : stroke,
                    zIndex: 2
                })
                .add();
        }

        if (axis.medianGrid) {
            const sidesAndMedians = [
                // Sides
                [[0, 100], [0, 0]],
                [[0, 0], [100, 0]],
                [[100, 0], [0, 100]],
                // Medians: vertex -> midpoint of opposite side
                [[100, 0], [0, 50]],
                [[0, 100], [50, 0]],
                [[0, 0,], [50, 50]]
            ];

            for (let i = 0; i < 2; i++) {
                let [from, to] = sidesAndMedians[index + i * 3];

                p1 = chart.ternaryToPlot(from);
                p2 = chart.ternaryToPlot(to);

                const path = [
                    'M', chart.plotLeft + p1[0], p1[1] + chart.plotTop,
                    'L', chart.plotLeft + p2[0], p2[1] + chart.plotTop
                ];

                const isMedian = i % 2 === 1;
                gridLines[i] = renderLine(path, isMedian);
            }
        } else {
            for (let cursor = 0; cursor <= sumTo; cursor += interval) {
                // TODO: use axis.tickLength instead and other tick options (color, width)
                const gridLineExtension = axis.gridLineExtension || 0,
                    alpha =
                        clamp(chartOptions.ternaryAngle, 1, 89)
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

                const { plotLeft, plotTop } = chart,
                    path = [
                        'M', plotLeft + p1[0], plotTop + p1[1],
                        'L', plotLeft + p2[0], plotTop + p2[1]
                    ];

                gridLines[cursor] = renderLine(path);
            }
        }

        return gridLines;
    };

    // Render ternary axis labels. Keep it on chart for easy access
    Chart.prototype.getLabels = function (
        this: any,
        axis: any,
        index: number
    ) {
        const labels: Record<string, any> = {},
            interval = axis.tickInterval;

        if (!interval || interval <= 0) return labels;

        const chart = this,
            chartOptions = chart.options.chart,
            sumTo = chart.options.chart.ternarySumTo,
            { plotLeft, plotTop } = chart,
            { align, zIndex, style, x, y } = axis.labels,
            gridLineExtension = axis.gridLineExtension || 0,
            labelMargin = axis.labels.distance || 0,
            distance = gridLineExtension + labelMargin,
            alpha = clamp(chartOptions.ternaryAngle, 1, 89) * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2;

        for (let tick = 0; tick <= sumTo; tick += interval) {
            const label = labels[tick] = chart.renderer
                .text(tick, x, y)
                .attr({ align, zIndex })
                .css(style)
                .add();

            const fm = chart.renderer.fontMetrics(label),
                bb = label.getBBox();

            let pos: any,
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

    // Convert ternary (x, y) to plot coordinates
    // using 2D barycentric projection
    Chart.prototype.ternaryToPlot = function (
        this: any,
        point: any,
        useSumTo?: boolean
    ): [number, number] {
        const chart = this,
            chartOptions = chart.options.chart,
            spacing = chart.ternarySpacing * 2,
            // α - angle between the triangle side and the base
            // (0° < α < 90°)
            alpha = clamp(chartOptions.ternaryAngle, 1, 89) * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2,
            // Determine the length of the triangle's
            // base based on the available space
            baseWidth = Math.min(
                chart.plotWidth,
                chart.plotHeight / heightRatio
            ),
            // Then shrink by spacing to get the final width
            width = Math.max(baseWidth - spacing, 5),
            sumTo = useSumTo ? chartOptions.ternarySumTo : 100,
            x = pick(point.x, point[0]) * width / sumTo,
            y = pick(point.y, point[1]) * width / sumTo,
            // Center within plot area
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
            this: any,
            p: any,
            series: any,
            chartCoords: any
        ) {
            const ret = p.call(this, series, chartCoords);

            ret.width = this.xAxis[0].len;

            return ret;
        });
    }

    // ----------------------- Series prototype methods -----------------------

    // Translate data points from ternary x,y to plotX,plotY
    function translate(this: any) {
        this.generatePoints();

        this.xAxis = {
            isRadial: false,
            options: {
                type: 'linear'
            }
        };

        const series = this,
            chart = series.chart,
            xAxis = series.xAxis,
            points = series.points,
            dataLength = points.length,
            pointPlacement = series.pointPlacementToXValue(), // #7860
            dynamicallyPlaced = Boolean(pointPlacement);

        let i: number,
            plotX: number,
            lastPlotX: number,
            closestPointRangePx = Number.MAX_VALUE;

        // Translate each point
        for (i = 0; i < dataLength; i++) {
            const point = points[i],
                xValue = point.x;

            point.yBottom = void 0;

            const perspectivePoint = chart.ternaryToPlot(point, true);

            point.plotX = perspectivePoint[0];
            point.plotY = perspectivePoint[1];

            point.shapeArgs = {
                x: point.plotX,
                y: point.plotY
            };

            // Do we need it? Perhaps for the future
            //point.isInside = this.isPointInside(point);
            point.isInside = true;

            point.tooltipPos = [point.plotX, point.plotY];

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
                plotX; // #1514, #5383, #5518

            // Determine auto enabling of markers (#3635, #5099)
            if (!point.isNull && point.visible !== false) {
                if (typeof lastPlotX !== 'undefined') {
                    closestPointRangePx = Math.min(
                        closestPointRangePx,
                        Math.abs(plotX - lastPlotX)
                    );
                }

                lastPlotX = plotX;
            }

            // Zones disabled for now
            point.zone = void 0;

            if (
                (
                    !point.marker ||
                    !defined(point.marker.radius)
                ) &&
                series.options.minR &&
                series.options.maxR
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
        this: any,
        x: number,
        y: number,
        z: number,
        alpha?: number
    ): string {
        // Parse color input → { r, g, b }
        function parseColor(color: string) {
            // HEX
            if (color[0] === '#') {
                const hex = color.replace('#', '');
                const bigint = parseInt(hex.length === 3
                    ? hex.split('').map(c => c + c).join('')
                    : hex, 16);

                return {
                    r: (bigint >> 16) & 255,
                    g: (bigint >> 8) & 255,
                    b: bigint & 255
                };
            }

            // rgb / rgba
            const m = color.match(
                /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
            );
            if (m) {
                if (!alpha && m[4] !== undefined) {
                    alpha = Number(m[4]);
                }
                return {
                    r: Number(m[1]),
                    g: Number(m[2]),
                    b: Number(m[3])
                };
            }

            return null;
        }

        const colors = this.options.ternaryColors;

        // Resolve base colors: [{ r, g, b }, ...]
        const baseColors = [0, 1, 2].map(i => {
            if (isArray(colors) && colors[i]) {
                return parseColor(colors[i]);
            }
        });

        // Alpha from 4th element if provided
        if (!alpha && isArray(colors) && isNumber(colors[3])) {
            alpha = colors[3];
        }

        const sum = 100,
            wa = x / sum,
            wb = y / sum,
            wc = z / sum,
            r = Math.round(
                baseColors[0].r * wa +
                baseColors[1].r * wb +
                baseColors[2].r * wc
            ),
            g = Math.round(
                baseColors[0].g * wa +
                baseColors[1].g * wb +
                baseColors[2].g * wc
            ),
            b = Math.round(
                baseColors[0].b * wa +
                baseColors[1].b * wb +
                baseColors[2].b * wc
            );

        return `rgba(${r}, ${g}, ${b}, ${alpha || 1})`;
    }

    function pointAttribs(this: any, point: any, state: any) {
        const attr = Series.prototype.pointAttribs.call(
            this,
            point,
            state
        );

        if (point?.isNull || !this.options.ternaryColors) {
            return attr;
        }

        const [x, y, z] = [point.x, point.y, point.z];

        attr.fill = this.getTernaryColor(x, y, z);

        point.ternaryColor = this.getTernaryColor(x, y, z, 1);

        attr.stroke = point.marker?.lineColor || point.ternaryColor;

        return attr;
    }

    // Return the plot box of the ternary plot area
    function getPlotBox(this: any, name: any) {
        const { plotLeft, plotTop } = this.chart,
            params = {
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

    function getRadius(this: any) {
        const series = this.series,
            minR = series.options.minR,
            maxR = series.options.maxR;

        const allValues = series.points.map(p => p.total),
            minValue = Math.min(...allValues),
            maxValue = Math.max(...allValues);

        if (maxValue === minValue) return (minR + maxR) / 2;

        const t = (this.total - minValue) / (maxValue - minValue),
            minA = Math.PI * minR * minR,
            maxA = Math.PI * maxR * maxR,
            A = minA + t * (maxA - minA);

        return Math.sqrt(A / Math.PI);
    }

    // -------------------------------- Events --------------------------------

    // Initialize ternary axes before rendering the chart
    addEvent(Chart, 'beforeRender', function (this: any) {
        const chart = this,
            chartOptions = chart.options.chart;

        if (!chartOptions.ternary) return;

        chart.ternarySpacing = chartOptions.ternarySpacing;

        type Vec2 = [number, number];

        type AxisDef = {
            axisCenters: [Vec2, Vec2];
            rotationSign: number;
            titleDirections: [Vec2, Vec2, Vec2];
        };

        const ternaryAngle = clamp(chartOptions.ternaryAngle, 1, 89),
            alpha = ternaryAngle * Math.PI / 180,
            heightRatio = Math.tan(alpha) / 2,
            axes: AxisDef[] = [{
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

        chart.ternaryAxis = axes.map(({
            axisCenters,
            rotationSign,
            titleDirections
        }, i) => {
            const userAxes = chart.options.ternaryAxis || [],
                axis = merge(defaultTernary, userAxes[i] ?? {});

            let rotation = 0,
                axisCenter: [number, number];

            if (axis.title.stickToCorner) {
                //axis.title.marginXOnly = false;
                axisCenter = axisCenters[1];
            } else {
                axisCenter = axisCenters[0];

                rotation = pick(
                    userAxes[i]?.title?.rotation,
                    rotationSign * ternaryAngle
                )
            }

            axis.axisCenter = axisCenter;

            axis.title.style.rotation = rotation;

            axis.title.titleDirection =
                titleDirections[axis.title.stickToCorner ?
                    2 :
                    (axis.title.marginXOnly ? 1 : 0)];

            axis.gridlineTicks = {};
            axis.gridlineMinorTicks = {};

            return axis;
        });
    });

    // Position ternary axis titles and render gridlines/labels after
    // setting chart size
    addEvent(Chart, 'afterSetChartSize', function (this: any) {
        const chart = this,
            { options } = chart;

        if (!options.chart.ternary || !chart.ternaryAxis) return;

        const destroyCollection = (coll: Record<string, any> | undefined) => {
            if (!coll) return;

            for (const k in coll) {
                coll[k] = coll[k].destroy();
            }
        };

        chart.ternaryAxis.forEach((axis: any, i: number) => {
            const title = axis.title;

            if (title?.text) {
                if (!axis.titleElem) {
                    axis.titleElem = chart.renderer
                        .text(title.text, title.x, title.y)
                        .css(title.style)
                        .attr(title.style)
                        .add();
                }

                const [x0, y0] = chart.ternaryToPlot(axis.axisCenter),
                    [dirX, dirY] = title.titleDirection,
                    // The pixel distance between the axis line and the title.
                    titleMargin = title.margin;

                // Move one or two bottom titles down to avoid overlapping
                // with gridLines
                let offsetY = 0;
                if (i !== 1 && (title.stickToCorner || i === 0)) {
                    // Font metrics baseline is better than bbox.height
                    // for better baseline alignment
                    const fm = chart.renderer.fontMetrics(axis.titleElem);

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
            destroyCollection(axis.minorGridlineTicks);

            // Recreate
            if (axis.gridLineWidth >= 1) {
                // TODO: consider having the getGridLines method on axis class
                axis.gridlineTicks = chart.getGridLines(axis, i);
            }

            // TODO: test minor gridlines with medianGrid
            if (axis.minorGridLineWidth >= 1) {
                axis.minorGridlineTicks = chart.getGridLines(axis, i);
            }

            if (axis.labels.enabled !== false) {
                axis.gridlineLabels = chart.getLabels(axis, i);
            }
        });
    });

    H.addEvent(Chart, 'afterIsInsidePlot', function (this: any, e: any) {
        const chart = this;

        if (!chart.options.chart.ternary) {
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

    H.addEvent(Series, 'afterDrawDataLabels', function (this: any) {
        if (!(this.options.minR && this.options.maxR)) {
            return;
        }

        this.points.forEach(point => {
            const dataLabel = point.dataLabel;

            dataLabel[dataLabel.placed ? 'animate' : 'attr']({
                //y: dataLabel.y - point.marker.radius + 5
                //y: dataLabel.y + dataLabel.height / 2
            });
        });
    });

    // ------------------------------ New Series ------------------------------

    // Define the new ternaryscatter series type
    seriesType(
        'ternaryscatter',
        'scatter',
        // Default series options
        {
            tooltip: {
                headerFormat: '{point.name}<br/>',
                pointFormat: '{point.x}, {point.y}, {point.z}'
            }
        },
        // Series proto
        {
            directTouch: true,
            isCartesian: false,
            noSharedTooltip: true,
            axisTypes: [],
            zoneAxis: '',
            pointArrayMap: ['x', 'y', 'z'],
            parallelArrays: ['x', 'y', 'z'],
            // Override Series prorotype methods
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