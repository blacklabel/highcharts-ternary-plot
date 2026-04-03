Highcharts.chart('chart-usage', {
    chart: {
        ternary: true
    },

    title: {
        text: 'Diet macronutrients'
    },

    ternaryAxis: {
        a: {
            title: { text: 'Protein' }
        },
        b: {
            title: { text: 'Fat' }
        },
        c: {
            title: { text: 'Carbohydrates' }
        }
    },

    series: [{
        type: 'ternaryscatter',
        name: 'Diet macronutrients',
        keys: ['a', 'b', 'c', 'name'],
        tooltip: {
            headerFormat: '',
            pointFormat:
                '<strong>{point.name} diet:</strong><br>' +
                'Protein: {point.a}%<br>' +
                'Fat: {point.b}%<br>' +
                'Carbohydrates: {point.c}%'
        },
        data: [
            [20, 70, 10, 'Keto'],
            [30, 40, 30, 'Paleo'],
            [20, 35, 45, 'Mediterranean'],
            [15, 35, 50, 'Standard Western'],
            [20, 20, 60, 'High-carbohydrate'],
            [0, 100, 0, 'Fat-only']
        ]
    }]
});
