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
    if (H.ternaryPlotPluginLoaded) {
        return;
    }
    H.ternaryPlotPluginLoaded = true;
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
    const AXES = [
        // horizontal
        { axisCenter: [50, 0], rotDefault: 0, titleDirection: [0, 1] },
        // vertical right
        { axisCenter: [50, 50], rotDefault: 63, titleDirection: [-1, 0] },
        // vertical left
        { axisCenter: [0, 50], rotDefault: -63, titleDirection: [1, 0] }
    ];
    // Render ternary axis gridlines. Keep it on chart for easy access
    Chart.prototype.getGrids = function (index, width, interval, stroke) {
        const chart = this, { plotTop } = chart, ticks = {};
        if (!interval || interval <= 0) {
            return ticks;
        }
        for (let cursor = 0; cursor <= 100; cursor += interval) {
            let pos, posEnd, tick;
            switch (index) {
                case 1:
                    pos = chart.toPerspective([0, cursor]);
                    posEnd = chart.toPerspective([100 - cursor, cursor]);
                    tick = [posEnd[0] + 4, posEnd[1]];
                    break;
                case 2:
                    pos = chart.toPerspective([cursor, 0]);
                    posEnd = chart.toPerspective([0, cursor]);
                    tick = [posEnd[0] - 2, posEnd[1] - 4];
                    break;
                default:
                    pos = chart.toPerspective([cursor, 100 - cursor]);
                    posEnd = chart.toPerspective([cursor, 0]);
                    tick = [posEnd[0] - 2, posEnd[1] + 4];
            }
            ticks[cursor] = chart.renderer
                .path()
                .attr({
                'stroke-width': width,
                stroke,
                zIndex: 2,
                d: [
                    'M', pos[0], pos[1] + plotTop,
                    'L', posEnd[0], posEnd[1] + plotTop,
                    'L', tick[0], tick[1] + plotTop
                ]
            })
                .add();
        }
        return ticks;
    };
    // Render ternary axis labels. Keep it on chart for easy access
    Chart.prototype.getLabels = function (axis, index, interval) {
        const chart = this, { plotTop } = chart, labels = {}, distance = 20;
        if (!interval || interval <= 0) {
            return labels;
        }
        const { align, zIndex, style } = axis.labels;
        for (let tick = 0; tick <= 100; tick += interval) {
            let pos, offsetX = 0, offsetY = 0;
            switch (index) {
                case 0: // horizontal
                    pos = chart.toPerspective([tick, 0]);
                    offsetY = distance + 3;
                    offsetX = 0;
                    break;
                case 1: // vertical right
                    pos = chart.toPerspective([100 - tick, tick]);
                    offsetY = 3;
                    offsetX = distance;
                    break;
                default: // vertical left
                    pos = chart.toPerspective([0, 100 - tick]);
                    offsetY = 3;
                    offsetX = -distance;
            }
            labels[tick] = chart.renderer
                .text(tick, pos[0] + offsetX, pos[1] + plotTop + offsetY)
                .attr({ align, zIndex })
                .css(style)
                .add();
        }
        return labels;
    };
    // Set ternarySpacing when initializing the chart
    addEvent(Chart, 'init', function (e) {
        const userOptions = e.args[0], chartOptions = userOptions.chart;
        if (!chartOptions.ternary) {
            return;
        }
        chartOptions.ternarySpacing = pick(chartOptions.ternarySpacing, 35);
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
        const chart = this, { chart: chartOptions, ternaryAxis: userAxes = [] } = chart.options;
        if (!chartOptions.ternary)
            return;
        chart.ternarySpacing = chartOptions.ternarySpacing;
        chart.ternaryAxis = AXES.map(({ axisCenter, rotDefault, titleDirection }, i) => {
            var _a, _b, _c;
            const axis = merge(defaultTernary, (_a = userAxes[i]) !== null && _a !== void 0 ? _a : {});
            axis.axisCenter = axisCenter;
            axis.title.style.rotation = pick((_c = (_b = userAxes[i]) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c.rotation, rotDefault);
            axis.title.titleDirection = titleDirection;
            axis.gridlineTicks = {};
            axis.gridlineMinorTicks = {};
            return axis;
        });
    });
    // Position ternary axis titles and render gridlines/labels after
    // setting chart size
    addEvent(Chart, 'afterSetChartSize', function () {
        const chart = this, { options } = chart;
        if (!options.chart.ternary || !chart.ternaryAxis) {
            return;
        }
        const destroyCollection = (coll) => {
            if (!coll) {
                return;
            }
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
                const [x0, y0] = chart.toPerspective(axis.axisCenter), [dirX, dirY] = title.titleDirection;
                // 50 is thte distance from axis to title in px
                // TODO: add title.distance or title.margin option
                axis.titleElem.translate(x0 + (-50 * dirX), y0 + 50 * dirY + chart.plotTop);
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
    // Convert ternary x,y (0-100) to perspective plotX,plotY
    Chart.prototype.toPerspective = function (point) {
        const chart = this, spacing = chart.ternarySpacing * 2, baseWidth = Math.min(chart.plotHeight, chart.plotWidth - 90 < chart.plotHeight ?
            chart.containerBox.width :
            chart.plotHeight), width = Math.max(baseWidth - spacing, 5), x = pick(point.x, point[0]) * width / 100, y = pick(point.y, point[1]) * width / 100;
        return [
            x + y / 2 + (chart.containerBox.width - width) / 2,
            chart.plotHeight - y - spacing * 0.7
        ];
    };
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
                const perspectivePoint = chart.toPerspective(point);
                plotX = perspectivePoint[0] - chart.plotLeft;
                point.plotX = plotX;
                point.plotY = perspectivePoint[1];
                point.shapeArgs = {
                    x: point.plotX - chart.plotLeft,
                    y: point.plotY - chart.plotTop
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