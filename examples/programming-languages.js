// GitHub Code Search hit counts (public repositories, 2024).
// Columns: [JS%, Python%, Rust%, total hits, term]
// Toggle terms by commenting/uncommenting individual lines.
const data = [
    // [ 0, 99,  0,  2177536, 'numpy'],
    // [66, 30,  4,  7617920, 'async'],
    [79, 18,  3,  4204272, 'json'],
    [17, 16, 68,   410304, 'borrow'],
    [34, 48, 18,   333696, 'ownership'],
    // [58, 35,  7,  2752512, 'callback'],
    [95,  4,  1,  1490944, 'promise'],
    // [ 1, 98,  0,  1035480, 'pandas'],
    [ 3, 97,  0,  1924384, 'django'],
    [33, 17, 50,    27480, 'lifetimes'],
    // [64, 28,  9,  5562624, 'await'],
    [14, 67, 19,  1500672, 'thread'],
    // [25, 66,  9,  1384064, 'memory'],
    [84, 10,  6,  2628224, 'pointer'],
    // [50, 45,  5, 10473088, 'api'],
    [40, 53,  7, 17865216, 'http'],
    // [48, 50,  2,   396416, 'websocket'],
    [16, 32, 52,  1044832, 'serialize'],
    [28, 27, 45,   539872, 'deserialize'],
    [25, 70,  5,  1360992, 'schema'],
    // [56, 38,  6, 26206720, 'type'],
    [17, 55, 28,  1122944, 'generic'],
    [54, 45,  1, 26139392, 'class'],
    // [50, 47,  3, 10345472, 'module'],
    [64, 31,  4, 13951488, 'function'],
    // [62, 31,  7,  9371136, 'cli'],
    // [49, 48,  3, 13048064, 'config'],
    // [15, 83,  2,  3752832, 'logger'],
    // [18, 73,  9,  2147328, 'cache'],
    // [31, 65,  5,  1884672, 'performance'],
    // [13, 74, 13,   690560, 'benchmark'],
    // [52,  7, 42,   178752, 'wasm'],
    // [19, 40, 41,   788864, 'iterator'],
    // [28, 70,  2,   424096, 'decorator'],
    // [31, 49, 20,   503264, 'macro'],
    // [25, 62, 13,  1654784, 'future'],
    // [29, 34, 37,   572160, 'spawn'],
    // [83, 15,  2, 20107776, 'select'],
    // [24, 66, 10,  1138944, 'poll'],
    // [70, 23,  6,   396416, 'defer'],
    // [ 4,  4, 92,    41280, 'axum'],
    // [49, 39, 12,   108480, 'rocket'],
    // [ 5,  4, 91,    28840, 'bevy'],
    // [ 4, 86, 10,   422432, 'criterion'],
    // [45, 38, 17,    52448, 'miri'],
    // [63, 21, 16,  9329408, 'option'],
    // [40, 51,  9,  6676928, 'result'],
    // [33, 33, 35,  4674816, 'some'],
    // [25, 64, 12, 11541504, 'none'],
    // [50, 41,  9, 17052672, 'ok'],
    // [14, 21, 65,  2338432, 'clone'],
    // [29, 59, 12,  5723392, 'copy'],
    // [73, 23,  4, 19916032, 'default'],
    // [23, 47, 30,  4320256, 'debug'],
    // [70, 25,  4,   199072, 'debugger'],
    // [30, 32, 38,  1097216, 'formatter'],
    // [33, 39, 27,   237584, 'cow'],
    // [38, 44, 19,  6587904, 'vec'],
    // [42, 47, 11, 17747968, 'err'],
    // [29, 68,  3,  3509440, 'drop'],
    // [21, 39, 40,  5460736, 'fn'],
    // [47, 35, 18, 11578880, 'let'],
    // [33, 30, 37,  4880384, 'mut'],
    // [24, 56, 20,  9059840, 'impl'],
    // [36, 29, 36,  7038976, 'pub'],
    // [52, 26, 22,  8299520, 'struct'],
    // [32, 48, 20,  6562304, 'enum'],
    // [24, 53, 23,  6420224, 'match'],
    // [ 5, 79, 15,  9120256, 'Self'],
    // [42, 49,  9, 35176448, 'use']
];

const points = data.map(([a, b, c, total, name]) => ({ a, b, c, total, name }));

Highcharts.chart('chart-languages', {
    chart: {
        type: 'ternaryscatter',
        ternary: {
            spacing: 80
        },
        height: 700
    },

    credits: {
        enabled: false
    },

    title: {
        text: 'Programming Language Vocabulary Landscape',
        style: {
            fontSize: '30px',
            fontFamily: 'Inter',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)'
        }
    },

    subtitle: {
        text: 'How technical terms distribute between JavaScript, Python, and Rust — ' +
            'position shows relative usage, bubble size shows total hit frequency<br/>' +
            '<span style="font-size: 10px;">Data source: GitHub API — Code Search (public repositories)</span>',
        style: {
            fontSize: '16px',
            fontFamily: 'Inter',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.55)'
        }
    },

    legend: {
        enabled: false
    },

    ternaryAxis: {
        plotOptions: {
            tickInterval: 10,
            median: {
                color: 'rgba(255,255,255,0.08)'
            },
            gridLineWidth: 1,
            gridLineColor: 'rgba(255,255,255,1)',
            gridLineExtension: 0,
            title: {
                titlePosition: 'corner',
                margin: 26
            },
            labels: {
                enabled: false
            }
        },
        a: {
            gridLineColor: 'red',
            title: {
                text: 'JS',
                style: {
                    fontWeight: '500',
                    fontSize: '40px',
                    color: '#fcdc00'
                }
            }
        },
        b: {
            title: {
                text: 'Python',
                style: {
                    fontWeight: '500',
                    fontSize: '40px',
                    color: '#3776ab'
                }
            }
        },
        c: {
            title: {
                text: 'Rust',
                style: {
                    fontWeight: '500',
                    fontSize: '40px',
                    color: '#a72145'
                }
            }
        }
    },

    series: [{
        name: 'Programming languages',
        data: points,
        componentColors: {
            a: 'rgb(253, 220, 0)',   // JS
            b: 'rgb(55, 118, 171)',  // Python
            c: 'rgb(167, 33, 69)',   // Rust
            alpha: 0.15
        },
        minSize: 6,
        maxSize: 48,
        tooltip: {
            headerFormat: '',
            pointFormat:
                '<b>{point.name}:</b><br/>' +
                'JS: {point.a}%<br/>' +
                'Python: {point.b}%<br/>' +
                'Rust: {point.c}%'
        },
        states: {
            hover: {
                halo: { size: 0 }
            }
        },
        marker: {
            lineWidth: 1
        },
        dataLabels: {
            enabled: true,
            crop: false,
            overflow: 'allow',
            formatter() {
                return '<span style="color: ' + this.ternaryColor + '">' +
                    this.name + '</span>';
            },
            style: {
                fontSize: '16px',
                fontWeight: '400',
                textOutline: 'none'
            }
        }
    }]
});
