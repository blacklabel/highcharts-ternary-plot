const energyMixData = {
    'World': [
        { year: 2015, renewables: 22.97, fossil: 66.48, nuclear: 10.55 },
        { year: 2016, renewables: 23.73, fossil: 65.86, nuclear: 10.41 },
        { year: 2017, renewables: 24.47, fossil: 65.34, nuclear: 10.2  },
        { year: 2018, renewables: 25.09, fossil: 64.86, nuclear: 10.05 },
        { year: 2019, renewables: 26.09, fossil: 63.65, nuclear: 10.26 },
        { year: 2020, renewables: 28,    fossil: 62.09, nuclear:  9.91 },
        { year: 2021, renewables: 28.1,  fossil: 62.12, nuclear:  9.78 },
        { year: 2022, renewables: 29.45, fossil: 61.42, nuclear:  9.13 },
        { year: 2023, renewables: 30.26, fossil: 60.64, nuclear:  9.1  },
        { year: 2024, renewables: 31.82, fossil: 59.2,  nuclear:  8.98 }
    ],
    'United States': [
        { year: 2015, renewables: 13.63, fossil: 66.85, nuclear: 19.52 },
        { year: 2016, renewables: 15.29, fossil: 65,    nuclear: 19.71 },
        { year: 2017, renewables: 17.45, fossil: 62.68, nuclear: 19.86 },
        { year: 2018, renewables: 17.45, fossil: 63.34, nuclear: 19.21 },
        { year: 2019, renewables: 18.29, fossil: 62.24, nuclear: 19.46 },
        { year: 2020, renewables: 20.32, fossil: 60.15, nuclear: 19.54 },
        { year: 2021, renewables: 20.74, fossil: 60.49, nuclear: 18.77 },
        { year: 2022, renewables: 22.35, fossil: 59.65, nuclear: 18    },
        { year: 2023, renewables: 22.68, fossil: 59.11, nuclear: 18.22 },
        { year: 2024, renewables: 24.06, fossil: 58.13, nuclear: 17.81 }
    ],
    'Europe (EI)': [
        { year: 2015, renewables: 31.71, fossil: 41.99, nuclear: 24.3  },
        { year: 2016, renewables: 32.12, fossil: 42.41, nuclear: 23.42 },
        { year: 2017, renewables: 32.08, fossil: 42.82, nuclear: 23.04 },
        { year: 2018, renewables: 34.52, fossil: 40.45, nuclear: 23.02 },
        { year: 2019, renewables: 36.64, fossil: 38.13, nuclear: 23.25 },
        { year: 2020, renewables: 40.79, fossil: 35.73, nuclear: 21.46 },
        { year: 2021, renewables: 39.6,  fossil: 36.66, nuclear: 21.83 },
        { year: 2022, renewables: 41.25, fossil: 37.58, nuclear: 19.01 },
        { year: 2023, renewables: 46.64, fossil: 31.9,  nuclear: 19.27 },
        { year: 2024, renewables: 49.17, fossil: 28.92, nuclear: 19.71 }
    ],
    'China': [
        { year: 2015, renewables: 23.97, fossil: 73.08, nuclear: 2.95 },
        { year: 2016, renewables: 24.83, fossil: 71.7,  nuclear: 3.48 },
        { year: 2017, renewables: 25.24, fossil: 71,    nuclear: 3.76 },
        { year: 2018, renewables: 25.61, fossil: 70.27, nuclear: 4.12 },
        { year: 2019, renewables: 26.85, fossil: 68.5,  nuclear: 4.65 },
        { year: 2020, renewables: 28.09, fossil: 67.2,  nuclear: 4.71 },
        { year: 2021, renewables: 28.69, fossil: 66.53, nuclear: 4.77 },
        { year: 2022, renewables: 30.18, fossil: 65.1,  nuclear: 4.72 },
        { year: 2023, renewables: 30.61, fossil: 64.8,  nuclear: 4.6  },
        { year: 2024, renewables: 33.7,  fossil: 61.83, nuclear: 4.47 }
    ],
    'India': [
        { year: 2015, renewables: 14.63, fossil: 82.45, nuclear: 2.92 },
        { year: 2016, renewables: 14.44, fossil: 82.85, nuclear: 2.72 },
        { year: 2017, renewables: 15.45, fossil: 81.99, nuclear: 2.56 },
        { year: 2018, renewables: 16.29, fossil: 81.22, nuclear: 2.48 },
        { year: 2019, renewables: 18.14, fossil: 79.06, nuclear: 2.8  },
        { year: 2020, renewables: 19.4,  fossil: 77.76, nuclear: 2.84 },
        { year: 2021, renewables: 19.01, fossil: 78.38, nuclear: 2.61 },
        { year: 2022, renewables: 20.26, fossil: 77.19, nuclear: 2.56 },
        { year: 2023, renewables: 19.32, fossil: 78.17, nuclear: 2.51 },
        { year: 2024, renewables: 19.56, fossil: 77.75, nuclear: 2.69 }
    ]
};

const ELECTRICITY_COLORS = {
    'World': '#3B82F6',
    'United States': '#EF4444',
    'Europe (EI)': '#10B981',
    'China': '#F59E0B',
    'India': '#A78BFA'
};

Highcharts.chart('chart-electricity', {
    chart: {
        ternary: true,
        height: 680
    },

    credits: {
        enabled: false
    },

    tooltip: {
        useHTML: true,
        formatter: function () {
            const p = this.point,
                color = this.series.color;

            return '<div style="min-width:200px;font-family:\'Neue Montreal\',system-ui,sans-serif;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--color-border);">' +
                    '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + color + ';flex-shrink:0;"></span>' +
                    '<span style="font-size:14px;font-weight:500;">' + p.entity + '</span>' +
                    '<span style="margin-left:auto;font-size:12px;color:var(--color-text-muted);">' + p.year + '</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;">' +
                    '<span style="color:var(--color-text-muted);">Renewables</span>' +
                    '<span style="font-weight:500;">' + p.a + '%</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;">' +
                    '<span style="color:var(--color-text-muted);">Fossil</span>' +
                    '<span style="font-weight:500;">' + p.b + '%</span>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;">' +
                    '<span style="color:var(--color-text-muted);">Nuclear</span>' +
                    '<span style="font-weight:500;">' + p.c + '%</span>' +
                '</div>' +
            '</div>';
        }
    },

    title: {
        text: 'Changes in Electricity Generation Mix (%)<br/>2015–2024',
        style: {
            fontSize: '30px',
            fontFamily: 'Inter',
            fontWeight: 500
        }
    },

    subtitle: {
        text: 'Each sequence shows annual progression from 2015 to 2024.' +
            '<br/><span style="font-size: 10px;">Data source: Our World in Data</span>',
        style: {
            fontSize: '16px',
            opacity: 0.6,
            fontFamily: 'Inter',
            fontWeight: 500
        }
    },

    ternaryAxis: {
        plotOptions: {
            tickInterval: 20
        },
        a: {
            title: { text: 'Higher renewables share (%)' }
        },
        b: {
            title: { text: 'Higher fossil share (%)' }
        },
        c: {
            title: { text: 'Higher nuclear share (%)' }
        }
    },

    series: Object.entries(energyMixData).map(([entity, points]) => ({
        type: 'ternaryscatter',
        name: entity,
        color: ELECTRICITY_COLORS[entity],
        keys: ['a', 'b', 'c', 'entity', 'year', 'marker'],
        data: points.map(d => ([
            d.renewables,
            d.fossil,
            d.nuclear,
            entity,
            d.year,
            d.year === 2024 ? { radius: 9 } : undefined
        ])),
        marker: {
            radius: 4,
            symbol: 'circle',
            lineWidth: 1
        },
        lineWidth: 2
    }))
});
