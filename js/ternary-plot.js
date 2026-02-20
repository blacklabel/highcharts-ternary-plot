/**
----
*
* Highcharts Ternary Plot v0.1.0
*
* (c) 2012-2025 Black Label, Rafał Sebestjański
*
* License: Creative Commons Attribution (CC)
*/
(function (factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory;
  } else {
    factory(Highcharts);
  }
}(function (Highcharts) {
function TernaryPlotPlugin(H) {
    if (H.ternaryPlotPluginLoaded)
        return;
    H.ternaryPlotPluginLoaded = true;
    const { addEvent, Chart, clamp, correctFloat, defined, fireEvent, isArray, isNumber, merge, pick, Series, seriesType, wrap, } = H;
    const defaultTernary = {
        tickInterval: 50,
        gridLineWidth: 1,
        gridLineColor: '#d6d6d6',
        minorTickInterval: 0,
        minorGridLineWidth: 0,
        minorGridLineColor: '#d6d6d6',
        title: {
            text: 'Axis',
            margin: 30,
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
            margin: 6,
            style: {
                fontSize: '0.8em'
            }
        }
    };
    // Render ternary axis gridlines. Keep it on chart for easy access
    Chart.prototype.getGridLines = function (axis, index) {
        const gridLines = {};
        const interval = axis.tickInterval;
        if (!interval || interval <= 0)
            return gridLines;
        const chart = this, chartOptions = chart.options.chart, sumTo = chartOptions.sumTo;
        let p1, p2;
        function renderLine(path, isMedian) {
            // TODO: take from options
            const medianColor = axis.medianColor, width = axis.gridLineWidth, stroke = axis.gridLineColor;
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
        if (axis.drawMedian) {
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
        }
        else {
            for (let cursor = 0; cursor <= sumTo; cursor += interval) {
                // TODO: use axis.tickLength instead and other tick options (color, width)
                const additionalTickLength = axis.additionalTickLength || 0, alpha = clamp(chartOptions.ternaryAngle, 1, 89)
                    * Math.PI / 180, heightRatio = Math.tan(alpha) / 2;
                switch (index) {
                    // First grid (bottom axis)
                    case 0:
                        p1 = chart.ternaryToPlot([cursor, sumTo - cursor], true);
                        p2 = chart.ternaryToPlot([cursor, 0], true);
                        p2[0] = p2[0] - additionalTickLength / 2;
                        p2[1] = p2[1] + heightRatio * additionalTickLength;
                        break;
                    // Second grid (right axis)
                    case 1:
                        p1 = chart.ternaryToPlot([0, cursor], true);
                        p2 = chart.ternaryToPlot([sumTo - cursor, cursor], true);
                        p2[0] = p2[0] + additionalTickLength;
                        break;
                    // Third grid (left axis)
                    default:
                        p1 = chart.ternaryToPlot([cursor, 0], true);
                        p2 = chart.ternaryToPlot([0, cursor], true);
                        p2[0] = p2[0] - additionalTickLength / 2;
                        p2[1] = p2[1] - heightRatio * additionalTickLength;
                }
                const { plotLeft, plotTop } = chart, path = [
                    'M', plotLeft + p1[0], plotTop + p1[1],
                    'L', plotLeft + p2[0], plotTop + p2[1]
                ];
                gridLines[cursor] = renderLine(path);
            }
        }
        return gridLines;
    };
    // Render ternary axis labels. Keep it on chart for easy access
    Chart.prototype.getLabels = function (axis, index) {
        const labels = {}, interval = axis.tickInterval;
        if (!interval || interval <= 0)
            return labels;
        const chart = this, chartOptions = chart.options.chart, sumTo = chart.options.chart.sumTo, { plotLeft, plotTop } = chart, { align, zIndex, style } = axis.labels, additionalTickLength = axis.additionalTickLength || 0, labelMargin = axis.labels.margin || 0, distance = additionalTickLength + labelMargin, alpha = clamp(chartOptions.ternaryAngle, 1, 89) * Math.PI / 180, heightRatio = Math.tan(alpha) / 2;
        for (let tick = 0; tick <= sumTo; tick += interval) {
            const label = labels[tick] = chart.renderer
                .text(tick, 0, 0)
                .attr({ align, zIndex })
                .css(style)
                .add();
            const fm = chart.renderer.fontMetrics(label), bb = label.getBBox();
            let pos, offsetX = 0, offsetY = 0;
            switch (index) {
                case 0: // horizontal
                    pos = chart.ternaryToPlot([tick, 0], true);
                    if (additionalTickLength) {
                        offsetX = -distance / 2;
                        offsetY = heightRatio * distance + fm.b;
                    }
                    else {
                        offsetY = distance + fm.b;
                    }
                    break;
                case 1: // vertical right
                    pos = chart.ternaryToPlot([sumTo - tick, tick], true);
                    offsetX = distance + bb.width / 2;
                    break;
                default: // vertical left
                    pos = chart.ternaryToPlot([0, sumTo - tick], true);
                    if (additionalTickLength) {
                        offsetX = -distance / 2;
                        offsetY = -heightRatio * distance;
                    }
                    else {
                        offsetX = -distance - bb.width / 2;
                    }
            }
            label.translate(plotLeft + pos[0] + offsetX, plotTop + pos[1] + offsetY);
        }
        return labels;
    };
    // Set ternarySpacing when initializing the chart
    addEvent(Chart, 'init', function (e) {
        const userOptions = e.args[0], chartOptions = userOptions.chart;
        if (!chartOptions.ternary)
            return;
        chartOptions.ternarySpacing = pick(chartOptions.ternarySpacing, 35);
        chartOptions.sumTo = pick(chartOptions.sumTo, 100);
    });
    // Fix for NaN clip box width issue before v12.1.0
    if (Series.prototype.getClipBox) {
        wrap(H.Series.prototype, 'getClipBox', function (p) {
            const ret = p.call(this);
            ret.width = this.chart.xAxis[0].len;
            return ret;
        });
    }
    // Fix for NaN clip box width issue after v12.1.0
    // (getClipBox moved to Chart prototype)
    if (Chart.prototype.getClipBox) {
        wrap(Chart.prototype, 'getClipBox', function (p, series, chartCoords) {
            const ret = p.call(this, series, chartCoords);
            ret.width = this.xAxis[0].len;
            return ret;
        });
    }
    // Initialize ternary axes before rendering the chart
    addEvent(Chart, 'beforeRender', function () {
        const chart = this, chartOptions = chart.options.chart;
        if (!chartOptions.ternary)
            return;
        chart.ternarySpacing = chartOptions.ternarySpacing;
        const ternaryAngle = clamp(chartOptions.ternaryAngle, 1, 89), alpha = ternaryAngle * Math.PI / 180, heightRatio = Math.tan(alpha) / 2, axes = [{
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
        chart.ternaryAxis = axes.map(({ axisCenters, rotationSign, titleDirections }, i) => {
            var _a, _b, _c;
            const userAxes = chart.options.ternaryAxis || [], axis = merge(defaultTernary, (_a = userAxes[i]) !== null && _a !== void 0 ? _a : {});
            let rotation = 0, axisCenter;
            if (axis.title.stickToCorner) {
                //axis.title.marginXOnly = false;
                axisCenter = axisCenters[1];
            }
            else {
                axisCenter = axisCenters[0];
                rotation = pick((_c = (_b = userAxes[i]) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c.rotation, rotationSign * ternaryAngle);
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
    addEvent(Chart, 'afterSetChartSize', function () {
        const chart = this, { options } = chart;
        if (!options.chart.ternary || !chart.ternaryAxis)
            return;
        const destroyCollection = (coll) => {
            if (!coll)
                return;
            for (const k in coll) {
                coll[k] = coll[k].destroy();
            }
        };
        chart.ternaryAxis.forEach((axis, i) => {
            const title = axis.title;
            if (title === null || title === void 0 ? void 0 : title.text) {
                if (!axis.titleElem) {
                    axis.titleElem = chart.renderer
                        .text(title.text, 0, 0)
                        .css(title.style)
                        .attr(title.style)
                        .add();
                }
                const [x0, y0] = chart.ternaryToPlot(axis.axisCenter), [dirX, dirY] = title.titleDirection, 
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
                // TODO: Add option for direction alignment x and y
                axis.titleElem.translate(x0 + (-titleMargin * dirX) + chart.plotLeft, y0 + (titleMargin * dirY) + chart.plotTop + offsetY);
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
            // TODO: test minor gridlines with drawMedian
            if (axis.minorGridLineWidth >= 1) {
                axis.minorGridlineTicks = chart.getGridLines(axis, i);
            }
            if (axis.labels.enabled !== false) {
                axis.gridlineLabels = chart.getLabels(axis, i);
            }
        });
    });
    // Convert ternary (x, y) to plot coordinates
    // using 2D barycentric projection
    Chart.prototype.ternaryToPlot = function (point, useSumTo) {
        const chart = this, chartOptions = chart.options.chart, spacing = chart.ternarySpacing * 2, 
        // α - angle between the triangle side and the base
        // (0° < α < 90°)
        alpha = clamp(chartOptions.ternaryAngle, 1, 89) * Math.PI / 180, heightRatio = Math.tan(alpha) / 2, 
        // Determine the length of the triangle's
        // base based on the available space
        baseWidth = Math.min(chart.plotWidth, chart.plotHeight / heightRatio), 
        // Then shrink by spacing to get the final width
        width = Math.max(baseWidth - spacing, 5), sumTo = useSumTo ? chartOptions.sumTo : 100, x = pick(point.x, point[0]) * width / sumTo, y = pick(point.y, point[1]) * width / sumTo, 
        // Center within plot area
        centerX = (chart.plotWidth - width) / 2, centerY = (chart.plotHeight - width * heightRatio) / 2;
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
    H.addEvent(Chart, 'afterIsInsidePlot', function (e) {
        const chart = this;
        if (!chart.options.chart.ternary) {
            return;
        }
        // Barycentric technique to determine if point is inside triangle
        function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
            const v0x = cx - ax, v0y = cy - ay, v1x = bx - ax, v1y = by - ay, v2x = px - ax, v2y = py - ay, dot00 = v0x * v0x + v0y * v0y, dot01 = v0x * v1x + v0y * v1y, dot02 = v0x * v2x + v0y * v2y, dot11 = v1x * v1x + v1y * v1y, dot12 = v1x * v2x + v1y * v2y, invDenom = 1 / (dot00 * dot11 - dot01 * dot01), u = (dot11 * dot02 - dot01 * dot12) * invDenom, v = (dot00 * dot12 - dot01 * dot02) * invDenom, 
            // Allow points very close to the edge
            // (floating point precision)
            eps = 0.01;
            return u >= -eps && v >= -eps && u + v <= 1 + eps;
        }
        const [Ax, Ay] = chart.ternaryToPlot([0, 0]), [Bx, By] = chart.ternaryToPlot([100, 0]), [Cx, Cy] = chart.ternaryToPlot([0, 100]), px = e.x, py = e.y;
        e.isInsidePlot = pointInTriangle(px, py, Ax, Ay, Bx, By, Cx, Cy);
    });
    // Translate data points from ternary x,y to plotX,plotY
    function translate() {
        var _a;
        this.generatePoints();
        this.xAxis = {
            isRadial: false,
            options: {
                type: 'linear'
            }
        };
        const series = this, chart = series.chart, xAxis = series.xAxis, points = series.points, dataLength = points.length, pointPlacement = series.pointPlacementToXValue(), // #7860
        dynamicallyPlaced = Boolean(pointPlacement);
        let i, plotX, lastPlotX, closestPointRangePx = Number.MAX_VALUE;
        // Translate each point
        for (i = 0; i < dataLength; i++) {
            const point = points[i], xValue = point.x;
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
                correctFloat(xAxis.translate(xValue, false, false, false, true, pointPlacement)) :
                plotX; // #1514, #5383, #5518
            // Determine auto enabling of markers (#3635, #5099)
            if (!point.isNull && point.visible !== false) {
                if (typeof lastPlotX !== 'undefined') {
                    closestPointRangePx = Math.min(closestPointRangePx, Math.abs(plotX - lastPlotX));
                }
                lastPlotX = plotX;
            }
            // Zones disabled for now
            point.zone = void 0;
            if (!defined((_a = point.marker) === null || _a === void 0 ? void 0 : _a.radius) &&
                series.options.minR &&
                series.options.maxR) {
                point.marker.radius = point.getRadius();
            }
        }
        series.closestPointRangePx = closestPointRangePx;
        fireEvent(this, 'afterTranslate');
    }
    function getTernaryColor(x, y, z, alpha) {
        // Parse color input → { r, g, b }
        function parseColor(color) {
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
            const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
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
        const sum = 100, wa = x / sum, wb = y / sum, wc = z / sum, r = Math.round(baseColors[0].r * wa +
            baseColors[1].r * wb +
            baseColors[2].r * wc), g = Math.round(baseColors[0].g * wa +
            baseColors[1].g * wb +
            baseColors[2].g * wc), b = Math.round(baseColors[0].b * wa +
            baseColors[1].b * wb +
            baseColors[2].b * wc);
        return `rgba(${r}, ${g}, ${b}, ${alpha || 1})`;
    }
    function pointAttribs(point, state) {
        const attr = Series.prototype.pointAttribs.call(this, point, state);
        if ((point === null || point === void 0 ? void 0 : point.isNull) || !this.options.ternaryColors) {
            return attr;
        }
        const [x, y, z] = [point.x, point.y, point.z];
        attr.fill = this.getTernaryColor(x, y, z);
        point.ternaryColor = this.getTernaryColor(x, y, z, 1);
        attr.stroke = point.marker.lineColor || point.ternaryColor;
        return attr;
    }
    // Return the plot box of the ternary plot area
    function getPlotBox(name) {
        const { plotLeft, plotTop } = this.chart, params = {
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
    function getRadius() {
        const series = this.series, minR = series.options.minR, maxR = series.options.maxR;
        const allValues = series.points.map(p => p.total), minValue = Math.min(...allValues), maxValue = Math.max(...allValues);
        if (maxValue === minValue)
            return (minR + maxR) / 2;
        const t = (this.total - minValue) / (maxValue - minValue), minA = Math.PI * minR * minR, maxA = Math.PI * maxR * maxR, A = minA + t * (maxA - minA);
        return Math.sqrt(A / Math.PI);
    }
    // Define the new ternaryscatter series type
    seriesType('ternaryscatter', 'scatter', 
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
        pointArrayMap: ['y', 'z'],
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
    });
}

TernaryPlotPlugin(Highcharts);
}));