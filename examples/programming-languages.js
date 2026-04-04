// GitHub Code Search hit counts (public repositories, 2024).
// Columns: [JS%, Python%, Rust%, total hits, term]
const allData = [
    [0, 99, 0, 2177536, 'numpy'],
    [66, 30, 4, 7617920, 'async'],
    [79, 18, 3, 4204272, 'json'],
    [17, 16, 68, 410304, 'borrow'],
    [34, 48, 18, 333696, 'ownership'],
    [58, 35, 7, 2752512, 'callback'],
    [95, 4, 1, 1490944, 'promise'],
    [1, 98, 0, 1035480, 'pandas'],
    [3, 97, 0, 1924384, 'django'],
    [33, 17, 50, 27480, 'lifetimes'],
    [64, 28, 9, 5562624, 'await'],
    [14, 67, 19, 1500672, 'thread'],
    [25, 66, 9, 1384064, 'memory'],
    [84, 10, 6, 2628224, 'pointer'],
    [50, 45, 5, 10473088, 'api'],
    [40, 53, 7, 17865216, 'http'],
    [48, 50, 2, 396416, 'websocket'],
    [16, 32, 52, 1044832, 'serialize'],
    [28, 27, 45, 539872, 'deserialize'],
    [25, 70, 5, 1360992, 'schema'],
    [56, 38, 6, 26206720, 'type'],
    [17, 55, 28, 1122944, 'generic'],
    [54, 45, 1, 26139392, 'class'],
    [50, 47, 3, 10345472, 'module'],
    [64, 31, 4, 13951488, 'function'],
    [62, 31, 7, 9371136, 'cli'],
    [49, 48, 3, 13048064, 'config'],
    [15, 83, 2, 3752832, 'logger'],
    [18, 73, 9, 2147328, 'cache'],
    [31, 65, 5, 1884672, 'performance'],
    [13, 74, 13, 690560, 'benchmark'],
    [52, 7, 42, 178752, 'wasm'],
    [19, 40, 41, 788864, 'iterator'],
    [28, 70, 2, 424096, 'decorator'],
    [31, 49, 20, 503264, 'macro'],
    [25, 62, 13, 1654784, 'future'],
    [29, 34, 37, 572160, 'spawn'],
    [83, 15, 2, 20107776, 'select'],
    [24, 66, 10, 1138944, 'poll'],
    [70, 23, 6, 396416, 'defer'],
    [4, 4, 92, 41280, 'axum'],
    [49, 39, 12, 108480, 'rocket'],
    [5, 4, 91, 28840, 'bevy'],
    [4, 86, 10, 422432, 'criterion'],
    [45, 38, 17, 52448, 'miri'],
    [63, 21, 16, 9329408, 'option'],
    [40, 51, 9, 6676928, 'result'],
    [33, 33, 35, 4674816, 'some'],
    [25, 64, 12, 11541504, 'none'],
    [50, 41, 9, 17052672, 'ok'],
    [14, 21, 65, 2338432, 'clone'],
    [29, 59, 12, 5723392, 'copy'],
    [73, 23, 4, 19916032, 'default'],
    [23, 47, 30, 4320256, 'debug'],
    [70, 25, 4, 199072, 'debugger'],
    [30, 32, 38, 1097216, 'formatter'],
    [33, 39, 27, 237584, 'cow'],
    [38, 44, 19, 6587904, 'vec'],
    [42, 47, 11, 17747968, 'err'],
    [29, 68, 3, 3509440, 'drop'],
    [21, 39, 40, 5460736, 'fn'],
    [47, 35, 18, 11578880, 'let'],
    [33, 30, 37, 4880384, 'mut'],
    [24, 56, 20, 9059840, 'impl'],
    [36, 29, 36, 7038976, 'pub'],
    [52, 26, 22, 8299520, 'struct'],
    [32, 48, 20, 6562304, 'enum'],
    [24, 53, 23, 6420224, 'match'],
    [5, 79, 15, 9120256, 'Self'],
    [42, 49, 9, 35176448, 'use']
];

const LANG_COLORS = {
    js: '#E8C830',
    python: '#3776AB',
    rust: '#CE412B'
};

const defaultTerms = new Set([
    'json', 'borrow', 'ownership', 'promise', 'django', 'lifetimes',
    'thread', 'pointer', 'http', 'serialize', 'deserialize', 'schema',
    'generic', 'class', 'function'
]);

function getLang(d) {
    if (d[0] >= d[1] && d[0] >= d[2]) return 'js';
    if (d[1] > d[0] && d[1] >= d[2]) return 'python';

    return 'rust';
}

const sortedData = [...allData].sort((a, b) => {
    const order = { js: 0, python: 1, rust: 2 },
        diff = order[getLang(a)] - order[getLang(b)];

    return diff !== 0 ? diff : a[4].localeCompare(b[4]);
});

const dataByName = Object.fromEntries(allData.map(d => [d[4], d]));

// Fixed global scale — mirrors the plugin's getRadius() formula with global min/max
const GLOBAL_Z_MIN = Math.min(...allData.map(d => d[3])),
    GLOBAL_Z_MAX = Math.max(...allData.map(d => d[3]));
const _minA = Math.PI * 8 * 8, // minSize = 8
    _maxA = Math.PI * 48 * 48; // maxSize = 48

function calcRadius(total) {
    const t = (total - GLOBAL_Z_MIN) / (GLOBAL_Z_MAX - GLOBAL_Z_MIN);
    return Math.sqrt((_minA + t * (_maxA - _minA)) / Math.PI);
}

function formatHits(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';

    return n.toString();
}

const rankByTotal = Object.fromEntries(
    [...allData].sort((a, b) => b[3] - a[3]).map((d, i) => [d[4], i + 1])
);

const presets = {
    defaults: defaultTerms,
    all: new Set(allData.map(d => d[4])),
    js: new Set(allData.filter(d => getLang(d) === 'js').map(d => d[4])),
    python: new Set(allData.filter(d => getLang(d) === 'python').map(d => d[4])),
    rust: new Set(allData.filter(d => getLang(d) === 'rust').map(d => d[4]))
};

let activeTerms = new Set(defaultTerms),
    activeLanguages = new Set(); // which language presets are currently toggled on

function buildPointTooltipHTML(p) {
    const row = (color, label, val) =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:2px 0;">' +
            '<span style="display:flex;align-items:center;gap:7px;">' +
                '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + color + ';"></span>' +
                '<span style="color:rgba(255,255,255,0.5);">' + label + '</span>' +
            '</span>' +
            '<span style="font-weight:500;">' + val + '%</span>' +
        '</div>';

    return '<div style="min-width:148px;font-family:Inter,system-ui,sans-serif;">' +
        '<div style="font-size:13px;font-weight:500;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);">' + p.name + '</div>' +
        row(LANG_COLORS.js, 'JS', p.a) +
        row(LANG_COLORS.python, 'Python', p.b) +
        row(LANG_COLORS.rust, 'Rust', p.c) +
        '<div style="margin-top:7px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.07);font-size:10px;color:rgba(255,255,255,0.28);display:flex;justify-content:space-between;">' +
            '<span>#' + rankByTotal[p.name] + ' of ' + allData.length + '</span>' +
            '<span>' + formatHits(p.total) + ' hits</span>' +
        '</div>' +
    '</div>';
}

function buildChipTooltipHTML(a, b, c, total, name) {
    const row = (color, label, val) =>
        '<div class="chip-tooltip-row">' +
            '<span class="chip-tooltip-dot" style="background:' + color + '"></span>' +
            '<span class="chip-tooltip-lang">' + label + '</span>' +
            '<span class="chip-tooltip-val">' + val + '%</span>' +
        '</div>';

    return '<div class="chip-tooltip-name">' + name + '</div>' +
        row(LANG_COLORS.js, 'JS', a) +
        row(LANG_COLORS.python, 'Python', b) +
        row(LANG_COLORS.rust, 'Rust', c) +
        '<div class="chip-tooltip-hits">' +
            '<span>#' + rankByTotal[name] + ' of ' + allData.length + '</span>' +
            '<span>' + formatHits(total) + ' hits</span>' +
        '</div>';
}

function toPoints(terms) {
    return sortedData
        .filter(d => terms.has(d[4]))
        .map(([a, b, c, total, name]) => ({
            a, b, c, total, name,
            marker: {
                radius: calcRadius(total)
            }
        }));
}

const langChart = Highcharts.chart('chart-languages', {
    chart: {
        type: 'ternaryscatter',
        ternary: {
            spacing: 80
        },
        spacingTop: 25,
        height: 700
    },

    responsive: {
        rules: [{
            condition: {
                maxWidth: 650
            },
            chartOptions: {
                chart: {
                    height: 700,
                    ternary: {
                        spacing: 65
                    }
                }
            }
        }, {
            condition: {
                maxWidth: 550
            },
            chartOptions: {
                chart: {
                    height: 620,
                    ternary: {
                        spacing: 65
                    }
                },
                ternaryAxis: {
                    plotOptions: {
                        title: {
                            margin: 15
                        }
                    },
                    b: {
                        title: {
                            margin: 30
                        }
                    }
                }
            }
        }, {
            condition: {
                maxWidth: 480
            },
            chartOptions: {
                chart: {
                    height: 550,
                    ternary: {
                        spacing: 60
                    }
                }
            }
        }]
    },

    credits: {
        enabled: false
    },

    tooltip: {
        useHTML: true,
        outside: true,
        backgroundColor: '#1C2129',
        borderColor: 'rgba(255,255,255,0.1)',
        style: {
            color: '#E6E6E4',
            fontSize: '12px'
        },
        formatter: function () {
            return buildPointTooltipHTML(this.point);
        }
    },

    title: {
        text: 'Programming Language Vocabulary Landscape',
        style: {
            fontSize: '24px',
            fontFamily: 'Inter',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.78)'
        }
    },

    subtitle: {
        useHTML: true,
        text: '<span style="color:rgba(255,255,255,0.45);font-size:13px;font-family:Inter,system-ui,sans-serif;font-weight:400;">' +
            'How technical terms distribute between JavaScript, Python, and Rust — ' +
            'position shows relative usage, bubble size shows total hit frequency' +
            '</span><br/>' +
            '<span style="color:rgba(255,255,255,0.28);font-size:11px;font-family:Inter,system-ui,sans-serif;">' +
            'GitHub Code Search · ' + formatHits(GLOBAL_Z_MIN) + '\u2013' + formatHits(GLOBAL_Z_MAX) + ' hits · ' + allData.length + ' terms</span>',
        style: {
            fontSize: '13px',
            fontFamily: 'Inter',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.45)'
        }
    },

    legend: {
        enabled: false
    },

    ternaryAxis: {
        plotOptions: {
            tickInterval: 10,
            median: {
                color: '#1C1F25'
            },
            lineColor: '#3E4145',
            gridLineWidth: 1,
            gridLineColor: '#3E4145',
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
            title: {
                text: 'JS',
                style: {
                    fontWeight: '400',
                    fontSize: '36px',
                    color: LANG_COLORS.js
                }
            }
        },
        b: {
            title: {
                text: 'Python',
                style: {
                    fontWeight: '400',
                    fontSize: '36px',
                    color: LANG_COLORS.python
                }
            }
        },
        c: {
            title: {
                text: 'Rust',
                style: {
                    fontWeight: '400',
                    fontSize: '36px',
                    color: LANG_COLORS.rust
                }
            }
        }
    },

    series: [{
        name: 'Programming languages',
        data: toPoints(activeTerms),
        componentColors: {
            a: LANG_COLORS.js,
            b: LANG_COLORS.python,
            c: LANG_COLORS.rust,
            alpha: 0.15,
            strokeAlpha: 0.65
        },
        minSize: 8,
        maxSize: 48,
        states: {
            hover: {
                halo: {
                    size: 0
                }
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
                fontSize: '12px',
                fontWeight: '400',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '-0.01em',
                textOutline: 'none'
            }
        }
    }]
});

// ── Term filter UI ────────────────────────────────────────────────

function updateChart() {
    langChart.series[0].setData(toPoints(activeTerms), true, false);
}

function updateChips() {
    document.querySelectorAll('.lang-chip').forEach(chip => {
        chip.classList.toggle('active', activeTerms.has(chip.dataset.name));
    });
}

function isPresetActive(key) {
    if (key === 'defaults') {
        return activeTerms.size === defaultTerms.size &&
            [...defaultTerms].every(n => activeTerms.has(n));
    }

    if (key === 'all') return activeTerms.size === allData.length;

    return [...presets[key]].every(name => activeTerms.has(name));
}

function updatePresetStates() {
    document.querySelectorAll('.lang-preset').forEach(btn => {
        const key = btn.dataset.preset;
        const isActive = (key === 'js' || key === 'python' || key === 'rust')
            ? activeLanguages.has(key)
            : isPresetActive(key);

        btn.classList.toggle('active', isActive);
    });
}

function updateCount() {
    const el = document.getElementById('lang-count');

    if (el) el.textContent = activeTerms.size + '\u202f/\u202f' + allData.length + ' terms';
}

function initLangFilter() {
    const container = document.getElementById('lang-filter');

    if (!container) return;

    // ── Presets row ──
    const presetsRow = document.createElement('div');

    presetsRow.className = 'lang-filter-presets';

    const label = document.createElement('span');

    label.className = 'lang-filter-label';
    label.textContent = 'Presets';
    presetsRow.appendChild(label);

    [
        { key: 'defaults', text: 'Defaults', toggle: false },
        { key: 'all', text: 'All', toggle: false },
        { key: 'js', text: 'JS', toggle: true },
        { key: 'python', text: 'Python', toggle: true },
        { key: 'rust', text: 'Rust', toggle: true }
    ].forEach(({ key, text, toggle }) => {
        const btn = document.createElement('button');

        btn.className = 'lang-preset';

        if (key === 'js' || key === 'python' || key === 'rust') {
            btn.classList.add('lang-preset--' + key);
        }

        btn.dataset.preset = key;
        btn.textContent = text;

        btn.addEventListener('click', () => {
            if (toggle) {
                if (activeLanguages.has(key)) {
                    // Toggle OFF: remove this language's terms
                    presets[key].forEach(name => activeTerms.delete(name));
                    activeLanguages.delete(key);
                } else if (activeLanguages.size === 0) {
                    // First language from neutral state (Defaults/All/custom): REPLACE
                    activeTerms = new Set(presets[key]);
                    activeLanguages.add(key);
                } else {
                    // Already in language mode: ADD this language
                    presets[key].forEach(name => activeTerms.add(name));
                    activeLanguages.add(key);
                }
            } else if (key === 'all') {
                if (activeTerms.size === allData.length) {
                    // Already all selected — toggle to None
                    activeTerms = new Set();
                    activeLanguages.clear();
                } else {
                    // Select all and light up all language buttons
                    activeTerms = new Set(presets.all);
                    activeLanguages = new Set(['js', 'python', 'rust']);
                }
            } else {
                // Defaults: set exactly, back to neutral
                activeTerms = new Set(presets[key]);
                activeLanguages.clear();
            }

            updateChips();
            updateCount();
            updatePresetStates();
            updateChart();
        });

        presetsRow.appendChild(btn);
    });

    const count = document.createElement('span');

    count.className = 'lang-filter-count';
    count.id = 'lang-count';
    count.textContent = activeTerms.size + '\u202f/\u202f' + allData.length + ' terms';
    presetsRow.appendChild(count);

    container.appendChild(presetsRow);

    // ── Chips ──
    const chipsEl = document.createElement('div');

    chipsEl.className = 'lang-chips';
    chipsEl.id = 'lang-chips';

    sortedData.forEach(d => {
        const name = d[4],
            lang = getLang(d);

        const chip = document.createElement('button');
        chip.className = 'lang-chip' + (activeTerms.has(name) ? ' active' : '');
        chip.dataset.name = name;
        chip.dataset.lang = lang;
        chip.textContent = name;
        chip.addEventListener('click', () => {
            if (activeTerms.has(name)) {
                activeTerms.delete(name);
            } else {
                activeTerms.add(name);
            }

            chip.classList.toggle('active', activeTerms.has(name));
            activeLanguages.clear(); // manual chip toggle = custom mode

            updatePresetStates();
            updateCount();
            updateChart();
        });
        chipsEl.appendChild(chip);
    });

    container.appendChild(chipsEl);

    updatePresetStates();
}

initLangFilter();

// ── Chip tooltip ──────────────────────────────────────────────────

function initChipTooltip() {
    const tip = document.createElement('div');

    tip.className = 'chip-tooltip';
    document.body.appendChild(tip);

    let hideTimer;

    document.getElementById('lang-chips').addEventListener('mouseover', e => {
        const chip = e.target.closest('.lang-chip');

        if (!chip) return;

        clearTimeout(hideTimer);

        const d = dataByName[chip.dataset.name];

        if (!d) return;

        const [a, b, c, total, name] = d;

        tip.innerHTML = buildChipTooltipHTML(a, b, c, total, name);

        tip.style.display = 'block';

        positionTip(chip);
    });

    document.getElementById('lang-chips').addEventListener('mousemove', e => {
        const chip = e.target.closest('.lang-chip');

        if (chip) positionTip(chip);
    });

    document.getElementById('lang-chips').addEventListener('mouseout', e => {
        if (!e.target.closest('.lang-chip')) return;

        hideTimer = setTimeout(() => { tip.style.display = 'none'; }, 100);
    });

    function positionTip(chip) {
        const rect = chip.getBoundingClientRect(),
            tipW = tip.offsetWidth;
        let left = rect.left + rect.width / 2 - tipW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));

        tip.style.left = left + 'px';
        tip.style.top = (rect.top + window.scrollY - tip.offsetHeight - 10) + 'px';
    }
}

initChipTooltip();
