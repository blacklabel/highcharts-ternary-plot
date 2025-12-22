function TernaryPlotPlugin(Highcharts) {
    (function (H) {
        const seriesType = H.seriesType,
            wrap = H.wrap,
            merge = H.merge,
            Series_correctFloat = H.correctFloat,
            pick = H.pick,
            Series_fireEvent = H.fireEvent;

        /***
         ** When initializing, setup some default options:
        ***/
        wrap(H.Chart.prototype, 'init', function (p, userOptions, callback) {
            if (userOptions.chart.ternary) {
            userOptions.chart.ternarySpacing = pick(
                userOptions.chart.ternarySpacing,
                25
            );
            }

            p.call(this, userOptions, callback);
        });

        H.wrap(H.Chart.prototype, 'getClipBox', function (p, series, chartCoords) {
            const ret = p.call(this, series, chartCoords);

            ret.width = this.xAxis[0].len;
        
            return ret;
        });

        /***
         ** During first render setup basic options. 
        ***/
        H.wrap(H.Chart.prototype, 'firstRender', function (p) {
            const chart = this,
            options = chart.options,
            defaultTernary = {
                tickInterval: 50,
                minorTickInterval: 10,
                gridlineWidth: 1,
                minorGridlineWidth: 0,
                title: {
                text: 'Axis',
                style: {
                    align: 'center',
                    zIndex: 2,
                    fontSize: '0.8em',
                    color: "#000000"
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

            if (options.chart.ternary) {
            this.ternaryAxis = [];
            this.ternarySpacing = options.chart.ternarySpacing;

            [
                [50, 0, 0, 0, [0, -1]],
                [50, 50, 0, 63, [-1, 0]],
                [0, 50, 0, -63, [1, 0]]
            ].forEach(function (corner, i) {
                const axis = merge(defaultTernary, pick(options.ternaryAxis[i], {}));

                axis.corner = corner;
                axis.title.style.rotation = corner[3];
                axis.title.pos = corner[4];
                axis.gridlineTicks = {};
                axis.gridlineMinorTicks = {};

                chart.ternaryAxis.push(axis);
            });
            }

            p.call(this);
        });

        // Render Axes when size is already calculated and set:
        H.wrap(H.Chart.prototype, 'setChartSize', function (p) {
            const chart = this,
            options = chart.options;

            let pos,
            bbox,
            t;

            p.call(this);

            if (options.chart.ternary && chart.ternaryAxis) {
            chart.ternaryAxis.forEach(function (axis, i) {
                if (axis.title && axis.title.text) {
                if (!axis.titleElem) {
                    axis.titleElem = chart.renderer.text(
                    axis.title.text,
                    0,
                    0
                    ).css(axis.title.style).attr(axis.title.style).add();
                }

                // Axis Tittle position:
                pos = chart.toPerspective(axis.corner);

                bbox = axis.titleElem.getBBox(true);

                pos[1] = i !== 0 ?
                    (pos[1] - chart.ternarySpacing * axis.title.pos[1]) :
                    pos[1] + bbox.height + chart.ternarySpacing;

                axis.titleElem.translate(pos[0], pos[1] + chart.plotTop);

                axis.titleElem.attr({
                    x: -50 * axis.title.pos[0]
                });
                }

                // Axis grid lines and labels:
                for (t in axis.gridlineTicks) {
                axis.gridlineTicks[t] = axis.gridlineTicks[t].destroy();
                }

                for (t in axis.gridlineLabels) {
                axis.gridlineLabels[t] = axis.gridlineLabels[t].destroy();
                }

                for (t in axis.minorGridlineTicks) {
                axis.minorGridlineTicks[t] = axis.minorGridlineTicks[t].destroy();
                }

                if (axis.gridlineWidth >= 1) {
                axis.gridlineTicks = chart.getGrids(
                    i,
                    axis.gridlineWidth,
                    axis.tickInterval
                );
                }

                if (axis.minorGridlineWidth >= 1) {
                axis.minorGridlineTicks = chart.getGrids(
                    i,
                    axis.minorGridlineWidth,
                    axis.minorTickInterval
                );
                }

                axis.gridlineLabels = chart.getLabels(
                axis,
                i,
                axis.gridLineWidth,
                axis.tickInterval
                );

            });
            }
        });

        /***
         ** Get gridlines or minor-gridlines on the x/y/z axis
        ***/
        H.Chart.prototype.getGrids = function (index, width, interval) {
            const chart = this,
            plotTop = chart.plotTop,
            ticks = {};

            let cursor = 0,
            pos,
            posEnd,
            tick;

            while (cursor <= 100) {
            if (index === 1) {
                pos = chart.toPerspective([0, cursor, 0]);
                posEnd = chart.toPerspective([100 - cursor, cursor, 0]);
                tick = [posEnd[0] + 4, posEnd[1]];
            } else if (index === 2) {
                pos = chart.toPerspective([cursor, 0, 0]);
                posEnd = chart.toPerspective([0, cursor, 0]);
                tick = [posEnd[0] - 2, posEnd[1] - 4];
            } else {
                pos = chart.toPerspective([cursor, 100 - cursor, 0]);
                posEnd = chart.toPerspective([cursor, 0, 0]);
                tick = [posEnd[0] - 2, posEnd[1] + 4];
            }

            ticks[cursor] = chart.renderer.path('').attr({
                'stroke-width': width,
                'stroke': '#dedede',
                zIndex: 2,
                d: [
                'M',
                pos[0],
                pos[1] + plotTop,
                'L',
                posEnd[0],
                posEnd[1] + plotTop,
                'L',
                tick[0],
                tick[1] + plotTop
                ]
            }).add();

            cursor += interval;
            }

            return ticks;
        }

        /***
         ** Render x/y/z axis labels
        ***/
        H.Chart.prototype.getLabels = function (axis, index, width, interval) {
            const chart = this,
            plotTop = chart.plotTop,
            labels = {},
            distance = 20;

            let cursor = 0,
            pos,
            offsetY,
            offsetX;

            while (cursor <= 100) {
            if (index === 2) {
                // vertical left
                pos = chart.toPerspective([0, 100 - cursor, 0]);
                offsetY = 3;
                offsetX = -distance;
            } else if (index === 0) {
                // horizontal
                pos = chart.toPerspective([cursor, 0, 0]);
                offsetY = distance + 3;
                offsetX = 0;
            } else {
                // vertical right
                pos = chart.toPerspective([100 - cursor, cursor, 0]);
                offsetY = 3;
                offsetX = distance;
            }

            labels[cursor] = chart.renderer.text(
                cursor,
                pos[0] + offsetX,
                pos[1] + plotTop + offsetY
            ).attr({
                align: axis.labels.align,
                zIndex: axis.labels.zIndex
            }).css(axis.labels.style).add();

            cursor += interval;
            }

            return labels;
        }

        /***
         ** Calculate point x-y-z to x'-y' coordinates
        ***/
        H.Chart.prototype.toPerspective = function (point) {
            const chart = this,
            scale = pick(chart.options.ternaryRange, 100),
            spacing = chart.ternarySpacing * 2;

            let width = chart.plotHeight,
            a,
            b;

            if (chart.plotWidth - 90 < width) {
            width = chart.containerBox.width;
            }

            width -= spacing;
            width = Math.max(width, 5);

            a = pick(point.x, point[0]) * width / scale;
            b = pick(point.y, point[1]) * width / scale;

            return [
            a + b / 2 + (chart.containerBox.width - width) / 2,
            chart.plotHeight - b - spacing * 0.7
            ];
        }

        seriesType(
            'ternaryscatter',
            'scatter',
            {
            tooltip: {
                headerFormat: '{point.name}<br/>',
                pointFormat: '{point.x}, {point.y}, {point.z}'
            }
            },
            {
            directTouch: true,
            isCartesian: false,
            noSharedTooltip: true,
            axisTypes: [],
            zoneAxis: '',
            pointArrayMap: ['y', 'z'],
            parallelArrays: ['x', 'y', 'z'],
            translate() {
                this.generatePoints();

                this.xAxis = {
                isRadial: false,
                options: {
                    type: 'linear'
                }
                };

                const series = this,
                chart = series.chart,
                options = series.options,
                xAxis = series.xAxis,
                points = series.points,
                dataLength = points.length,
                pointPlacement = series.pointPlacementToXValue(), // #7860
                dynamicallyPlaced = Boolean(pointPlacement),
                threshold = options.threshold;

                let i,
                plotX,
                lastPlotX,
                closestPointRangePx = Number.MAX_VALUE;

                // Translate each point
                for (i = 0; i < dataLength; i++) {
                const point = points[i],
                    xValue = point.x;

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
                    Series_correctFloat(xAxis.translate(
                    xValue,
                    false,
                    false,
                    false,
                    true,
                    pointPlacement
                    )) :
                    plotX; // #1514, #5383, #5518

                // Do we need this?
                // point.negative = (point.y || 0) < (threshold || 0);

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
                }

                series.closestPointRangePx = closestPointRangePx;

                Series_fireEvent(this, 'afterTranslate');
            },
            getPlotBox(name) {
                const { plotLeft, plotTop } = this.chart;

                const params = {
                name,
                scale: 1,
                translateX: plotLeft,
                translateY: plotTop
                };

                Series_fireEvent(this, 'getPlotBox', params);

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
            }
        );
    }(Highcharts));
}