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
    const SQRT3_OVER_2 = Math.sqrt(3) / 2;
    const { addEvent, merge, pick, correctFloat, fireEvent, seriesType, wrap, Chart, Series } = H;
    const defaultTernary = {
        tickInterval: 50,
        gridLineWidth: 1,
        gridLineColor: '#d6d6d6',
        minorTickInterval: 0,
        minorGridLineWidth: 0,
        minorGridLineColor: '#d6d6d6',
        title: {
            text: 'Axis',
            style: {
                align: 'center',
                zIndex: 2,
                fontSize: '0.8em',
                color: '#000000'
            }
        },
        labels: {
            align: 'center',
            zIndex: 2,
            style: {
                fontSize: '0.8em'
            }
        }
    };
    // Render ternary axis gridlines. Keep it on chart for easy access
    Chart.prototype.getGrids = function (index, width, interval, stroke) {
        const ticks = {};
        if (!interval || interval <= 0)
            return ticks;
        const chart = this, sumTo = chart.options.chart.sumTo;
        for (let cursor = 0; cursor <= sumTo; cursor += interval) {
            let pos, posEnd, tick;
            switch (index) {
                case 1:
                    pos = chart.toPerspective([0, cursor], true);
                    posEnd = chart.toPerspective([sumTo - cursor, cursor], true);
                    tick = [posEnd[0] + 4, posEnd[1]];
                    break;
                case 2:
                    pos = chart.toPerspective([cursor, 0], true);
                    posEnd = chart.toPerspective([0, cursor], true);
                    tick = [posEnd[0] - 2, posEnd[1] - 4];
                    break;
                default:
                    pos = chart.toPerspective([cursor, sumTo - cursor], true);
                    posEnd = chart.toPerspective([cursor, 0], true);
                    tick = [posEnd[0] - 2, posEnd[1] + 4];
            }
            const { plotLeft, plotTop } = chart;
            ticks[cursor] = chart.renderer
                .path()
                .attr({
                'stroke-width': width,
                stroke,
                zIndex: 2,
                d: [
                    'M', plotLeft + pos[0], plotTop + pos[1],
                    'L', plotLeft + posEnd[0], plotTop + posEnd[1],
                    'L', plotLeft + tick[0], plotTop + tick[1]
                ]
            })
                .add();
        }
        return ticks;
    };
    // Render ternary axis labels. Keep it on chart for easy access
    Chart.prototype.getLabels = function (axis, index, interval) {
        const labels = {};
        if (!interval || interval <= 0)
            return labels;
        const chart = this, sumTo = chart.options.chart.sumTo;
        for (let tick = 0; tick <= sumTo; tick += interval) {
            const distance = 20;
            let pos, offsetX = 0, offsetY = 0;
            switch (index) {
                case 0: // horizontal
                    pos = chart.toPerspective([tick, 0], true);
                    // TODO: parameterize 3
                    offsetY = distance + 3;
                    offsetX = 0;
                    break;
                case 1: // vertical right
                    pos = chart.toPerspective([sumTo - tick, tick], true);
                    offsetY = 3;
                    offsetX = distance;
                    break;
                default: // vertical left
                    pos = chart.toPerspective([0, sumTo - tick], true);
                    offsetY = 3;
                    offsetX = -distance;
            }
            const { plotLeft, plotTop } = chart, { align, zIndex, style } = axis.labels;
            labels[tick] = chart.renderer
                .text(tick, plotLeft + pos[0] + offsetX, plotTop + pos[1] + offsetY)
                .attr({ align, zIndex })
                .css(style)
                .add();
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
        // przerzucić to do const zmiennych w if-ie zależnym od opcji
        const axes = [{
                // Horizontal
                axisCenters: [[50, 0], [100, 0]],
                rotDefaults: [0, 0, 0],
                // Two different positions (margin directions):
                // perpendicular to the axis line, or purely horizontal
                titleDirections: [[0, 1], [0, 1], [0, 1]]
            }, {
                // Vertical right 
                axisCenters: [[50, 50], [0, 100]],
                rotDefaults: [63.43, 60, 0],
                titleDirections: [[-SQRT3_OVER_2, -1 / 2], [-1, 0], [0, -1]]
            }, {
                // Vertical left
                axisCenters: [[0, 50], [0, 0]],
                rotDefaults: [-63.43, -60, 0],
                titleDirections: [[SQRT3_OVER_2, -1 / 2], [1, 0], [0, 1]]
            }];
        chart.ternaryAxis = axes.map(({ axisCenters, rotDefaults, titleDirections }, i) => {
            var _a, _b, _c;
            const userAxes = chart.options.ternaryAxis || [], axis = merge(defaultTernary, (_a = userAxes[i]) !== null && _a !== void 0 ? _a : {});
            let rotation, axisCenter;
            if (axis.title.stickToCorner) {
                //axis.title.marginXOnly = false;
                axisCenter = axisCenters[1];
                rotation = rotDefaults[2];
            }
            else {
                axisCenter = axisCenters[0];
                const isCartesian = chartOptions.ternaryProjection === 'cartesian';
                rotation = pick((_c = (_b = userAxes[i]) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c.rotation, rotDefaults[isCartesian ? 0 : 1]);
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
                const [x0, y0] = chart.toPerspective(axis.axisCenter), [dirX, dirY] = title.titleDirection, bbox = axis.titleElem.getBBox();
                // The pixel distance between the axis line and the title.
                const titleMargin = pick(title.margin, 50);
                // Move 2 bottom titles down to avoid overlapping
                // with gridLines
                let offsetY = 0;
                if (i !== 1) {
                    offsetY = bbox.height;
                }
                // TODO: Add option for direction alignment
                // TODO: Consider moving AXES values into methods
                axis.titleElem.translate(x0 + (-titleMargin * dirX) + chart.plotLeft, y0 + (titleMargin * dirY) + chart.plotTop + offsetY);
            }
            // Axis grid lines and labels: destroy previous
            destroyCollection(axis.gridlineTicks);
            destroyCollection(axis.gridlineLabels);
            destroyCollection(axis.minorGridlineTicks);
            // Recreate
            if (axis.gridLineWidth >= 1) {
                axis.gridlineTicks = chart.getGrids(i, axis.gridLineWidth, axis.tickInterval, axis.gridLineColor);
            }
            if (axis.minorGridLineWidth >= 1) {
                axis.minorGridlineTicks = chart.getGrids(i, axis.minorGridLineWidth, axis.minorTickInterval, axis.minorGridLineColor);
            }
            if (axis.labels.enabled !== false) {
                axis.gridlineLabels = chart.getLabels(axis, i, axis.tickInterval);
            }
        });
    });
    // chart: {
    //     ternaryProjection: 'cartesian' | 'equilateral'
    // }
    // Convert ternary (x, y) to perspective (plotX, plotY)
    Chart.prototype.toPerspective = function (point, useSumTo) {
        const chart = this, chartOptions = chart.options.chart, spacing = chart.ternarySpacing * 2, isCartesian = chartOptions.ternaryProjection === 'cartesian', 
        // Either equilateral or cartesian projection
        projectionHeightRatio = isCartesian ? 1 : SQRT3_OVER_2, 
        // Determine the length of the triangle's
        // base based on the available space
        baseWidth = Math.min(chart.plotWidth, chart.plotHeight / projectionHeightRatio), 
        // Then shrink by spacing to get the final width
        width = Math.max(baseWidth - spacing, 5), 
        // TODO: consider summing to a constant value different than 100
        sumTo = useSumTo ? chartOptions.sumTo : 100, x = pick(point.x, point[0]) * width / sumTo, y = pick(point.y, point[1]) * width / sumTo, 
        // Center within plot area
        centerX = (chart.plotWidth - width) / 2, centerY = (chart.plotHeight - width * projectionHeightRatio) / 2;
        return [
            x + y / 2 + centerX,
            chart.plotHeight - y * projectionHeightRatio - centerY
        ];
    };
    // Only [x, y] is needed in projection.
    // pH - plotHeight
    //
    // For the equilateral projection:
    // (doesn't look like equilateral here but it is)
    //
    //                               (50, 100·√3/2)
    //                                     / \
    //                                    /   \
    //                                   /     \
    //                                  /       \
    //                                 /         \
    //                                /           \
    //                               /             \
    //                              /               \
    //                             /                 \
    //                            /                   \
    //                           /                     \
    //                          /                       \
    //                         /                         \
    //                        /                           \
    //                       /                             \
    //                      /     P(x+y/2, pH-√3/2*y)       \
    //                     /             ○                   \---
    //                    /             /|                    \
    //                   /             / |                     \
    //                  /             /  |                      \ 
    //                 /           y /   | √3/2*y                \ y
    //                /             /    |                        \      
    //               /             /     |                         \     
    //              /60°          /60°   |                       60°\
    //             /_____________/_______|___________________________\--- 
    //     (0, 0)  |      x      |  y/2  |                             (100, 0)
    // Define the new ternaryscatter series type
    seriesType('ternaryscatter', 'scatter', {
        tooltip: {
            headerFormat: '{point.name}<br/>',
            pointFormat: '{point.x}, {point.y}, {point.z}'
        }
    }, {
        directTouch: true,
        isCartesian: false,
        noSharedTooltip: true,
        axisTypes: [],
        zoneAxis: '',
        pointArrayMap: ['y', 'z'],
        parallelArrays: ['x', 'y', 'z'],
        // Translate data points from ternary x,y to plotX,plotY
        translate() {
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
                const perspectivePoint = chart.toPerspective(point, true);
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
            }
            series.closestPointRangePx = closestPointRangePx;
            fireEvent(this, 'afterTranslate');
        },
        // Override to return the plot box of the ternary plot area
        getPlotBox(name) {
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
    });
}

TernaryPlotPlugin(Highcharts);
}));