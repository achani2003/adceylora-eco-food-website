// Chart Configurations & Rendering for ADCEYLORA ECO FOOD
let salesTrendChartInstance = null;
let categoryPieChartInstance = null;

function initCharts(products, sales) {
    const isDark = document.body.classList.contains('dark-theme');
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

    // 1. Sales Trend Chart - Computes actual sales totals for the last 7 calendar days
    const ctxTrend = document.getElementById('salesTrendChart')?.getContext('2d');
    if (ctxTrend) {
        if (salesTrendChartInstance) salesTrendChartInstance.destroy();

        const sinhalaDays = ['ඉරිදා', 'සඳුදා', 'අඟහරු', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'];
        const labels = [];
        const dailyTotals = [];
        const now = new Date();

        // Build 7-day chronological window ending today
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() - i);
            targetDate.setHours(0, 0, 0, 0);

            const nextDate = new Date(targetDate);
            nextDate.setDate(targetDate.getDate() + 1);

            const dayName = sinhalaDays[targetDate.getDay()];
            const formattedDate = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
            labels.push(`${dayName} (${formattedDate})`);

            // Aggregate actual sales matching this specific day
            const daySalesSum = (sales || []).reduce((sum, s) => {
                const saleDate = new Date(s.timestamp || s.date);
                if (saleDate >= targetDate && saleDate < nextDate) {
                    return sum + Number(s.total || 0);
                }
                return sum;
            }, 0);

            dailyTotals.push(daySalesSum);
        }

        salesTrendChartInstance = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'සත්‍ය විකුණුම් ආදායම (Actual Sales - LKR)',
                    data: dailyTotals,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    tension: 0.35,
                    fill: true,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans, Noto Sans Sinhala' } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `ආදායම: LKR ${Number(context.parsed.y).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { 
                        ticks: { 
                            color: textColor,
                            callback: function(value) {
                                return 'LKR ' + value.toLocaleString();
                            }
                        }, 
                        grid: { color: gridColor },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // 2. Category Distribution Pie Chart
    const ctxPie = document.getElementById('categoryPieChart')?.getContext('2d');
    if (ctxPie) {
        if (categoryPieChartInstance) categoryPieChartInstance.destroy();

        const catMap = {};
        products.forEach(p => {
            catMap[p.category] = (catMap[p.category] || 0) + p.stock;
        });

        const labels = Object.keys(catMap);
        const data = Object.values(catMap);

        categoryPieChartInstance = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['නොමැත'],
                datasets: [{
                    data: data.length ? data : [1],
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, boxWidth: 12, font: { family: 'Plus Jakarta Sans, Noto Sans Sinhala' } }
                    }
                }
            }
        });
    }
}
