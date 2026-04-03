// ── Header height offset ──────────────────────────────────────────
function updateHeaderHeight() {
    const h = document.getElementById('site-header').offsetHeight;
    document.documentElement.style.setProperty('--header-height', h + 'px');
}
updateHeaderHeight();
window.addEventListener('resize', updateHeaderHeight);

// ── Theme management ──────────────────────────────────────────────
const HC_LIGHT = {
    chart: { backgroundColor: null },
    title: {
        style: { color: '#1A1A18' }
    },
    subtitle: {
        style: { color: '#6B6B68' }
    },
    legend: {
        itemStyle: { color: '#333330' },
        itemHoverStyle: { color: '#000000' }
    },
    credits: {
        style: { color: '#999994' }
    },
    tooltip: {
        backgroundColor: '#FFFFFF',
        style: {
            color: '#1A1A18',
            fontSize: '13px'
        },
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        padding: 14,
        shadow: {
            color: 'rgba(0,0,0,0.08)',
            offsetX: 0,
            offsetY: 4,
            opacity: 1,
            width: 20
        }
    },
    plotOptions: {
        series: {
            dataLabels: {
                style: {
                    color: '#1A1A18',
                    textOutline: 'none'
                }
            }
        }
    }
};

const HC_DARK = {
    chart: { backgroundColor: null },
    title: {
        style: { color: '#E6E6E4' }
    },
    subtitle: {
        style: { color: '#8B8B88' }
    },
    legend: {
        itemStyle: { color: '#C8C8C6' },
        itemHoverStyle: { color: '#FFFFFF' }
    },
    credits: {
        style: { color: '#555551' }
    },
    tooltip: {
        backgroundColor: '#1C2129',
        style: {
            color: '#E6E6E4',
            fontSize: '13px'
        },
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        borderWidth: 1,
        padding: 14,
        shadow: {
            color: 'rgba(0,0,0,0.35)',
            offsetX: 0,
            offsetY: 4,
            opacity: 1,
            width: 20
        }
    },
    plotOptions: {
        series: {
            dataLabels: {
                style: {
                    color: '#E6E6E4',
                    textOutline: 'none'
                }
            }
        }
    }
};

function applyHCTheme(isDark) {
    const opts = isDark ? HC_DARK : HC_LIGHT;

    Highcharts.setOptions(opts);

    // Skip the languages chart — it always uses its own dark color scheme
    (Highcharts.charts || []).forEach(chart => {
        if (chart && chart.renderTo && chart.renderTo.id !== 'chart-languages') {
            chart.update(opts, true, true);
        }
    });
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ternary-theme', theme);
    applyHCTheme(theme === 'dark');
}

document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('ternary-theme')) {
        setTheme(e.matches ? 'dark' : 'light');
    }
});

// ── Active nav via IntersectionObserver ───────────────────────────
const navLinks = document.querySelectorAll('.nav-link'),
    pageSections = document.querySelectorAll('.page-section[id]');

if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => { l.classList.remove('active'); });

                const link = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
                if (link) { link.classList.add('active'); }
            }
        });
    }, { rootMargin: '-10% 0px -60% 0px' });

    pageSections.forEach(s => { navObserver.observe(s); });
}

// ── Copy to clipboard ─────────────────────────────────────────────
function flashCopied(btn) {
    btn.classList.add('copied');
    setTimeout(() => { btn.classList.remove('copied'); }, 2000);
}

document.querySelectorAll('.copy-btn[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(() => {
            flashCopied(btn);
        });
    });
});

document.getElementById('copy-usage').addEventListener('click', () => {
    const text = document.getElementById('usage-code').textContent;

    navigator.clipboard.writeText(text).then(() => {
        flashCopied(document.getElementById('copy-usage'));
    });
});
