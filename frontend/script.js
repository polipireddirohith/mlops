const form = document.getElementById('churn-form');
const predictionResult = document.getElementById('prediction-result');
const predictionOutput = document.getElementById('prediction-output');
const probabilityContainer = document.getElementById('probability-container');
const probabilityBar = document.getElementById('probability-bar');
const probabilityText = document.getElementById('probability-text');
const chartCanvas = document.getElementById('predictionChart');
const trendChartCanvas = document.getElementById('trendChart');

let predictionChart = null;
let trendChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeTrendChart();
    animateKPIs();
});

// Animate KPI values on load
function animateKPIs() {
    const kpiValues = document.querySelectorAll('.kpi-value');
    kpiValues.forEach(kpi => {
        const finalValue = kpi.textContent;
        kpi.style.opacity = '0';
        setTimeout(() => {
            kpi.style.transition = 'opacity 0.5s ease';
            kpi.style.opacity = '1';
        }, 100);
    });
}

// Form submission
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const contractMap = {
        'Month-to-month': 0,
        'One year': 1,
        'Two year': 2,
    };

    const data = {
        tenure: parseInt(formData.get('tenure')),
        monthly_charges: parseFloat(formData.get('monthly-charges')),
        contract: contractMap[formData.get('contract')],
    };

    // API Endpoint
    const apiEndpoint = 'http://127.0.0.1:8001/predict';

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ features: [data.tenure, data.monthly_charges, data.contract] }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const prediction = result.prediction === 1 ? 'Churn' : 'No Churn';
        const probability = result.probability || 0;

        // Display prediction with styling
        const emoji = prediction === 'Churn' ? '⚠️' : '✅';
        const className = prediction === 'Churn' ? 'churn' : 'no-churn';
        predictionOutput.textContent = `${emoji} ${prediction}`;
        predictionOutput.className = `prediction-badge ${className}`;
        predictionResult.classList.remove('hidden');

        // Animate probability bar
        probabilityContainer.classList.remove('hidden');
        const percentageValue = (probability * 100).toFixed(1);
        setTimeout(() => {
            probabilityBar.style.width = `${percentageValue}%`;
            probabilityText.textContent = `${percentageValue}%`;
        }, 100);

        // Display risk factors
        displayRiskFactors(data, probability);

        // Display recommendations
        displayRecommendations(prediction, data);

        // Update charts
        updatePredictionChart(probability);
        updateKPIs();

    } catch (error) {
        console.error('Error:', error);
        predictionOutput.textContent = '❌ Connection Error';
        predictionOutput.className = 'prediction-badge churn';
        predictionResult.classList.remove('hidden');
        probabilityContainer.classList.add('hidden');
    }
});

// Display risk factors based on input
function displayRiskFactors(data, probability) {
    const riskFactorsList = document.getElementById('risk-factors-list');
    const factors = [];

    if (data.contract === 0) {
        factors.push({
            icon: 'fa-calendar-times',
            text: 'Month-to-month contract increases churn risk by 45%'
        });
    }

    if (data.monthly_charges > 70) {
        factors.push({
            icon: 'fa-dollar-sign',
            text: 'High monthly charges ($' + data.monthly_charges + ') above average'
        });
    }

    if (data.tenure < 12) {
        factors.push({
            icon: 'fa-clock',
            text: 'Short tenure (' + data.tenure + ' months) - early customer lifecycle'
        });
    }

    if (probability > 0.7) {
        factors.push({
            icon: 'fa-exclamation-circle',
            text: 'Critical risk level - immediate action required'
        });
    }

    riskFactorsList.innerHTML = factors.map(factor => `
        <div class="risk-item">
            <i class="fas ${factor.icon}"></i>
            <span>${factor.text}</span>
        </div>
    `).join('');
}

// Display recommendations
function displayRecommendations(prediction, data) {
    const recommendationsList = document.getElementById('recommendations-list');
    const recommendations = [];

    if (prediction === 'Churn') {
        recommendations.push({
            icon: 'fa-phone',
            text: 'Schedule immediate retention call with account manager'
        });

        if (data.contract === 0) {
            recommendations.push({
                icon: 'fa-gift',
                text: 'Offer 15% discount for annual contract upgrade'
            });
        }

        if (data.monthly_charges > 70) {
            recommendations.push({
                icon: 'fa-tags',
                text: 'Present customized pricing plan to reduce monthly cost'
            });
        }

        recommendations.push({
            icon: 'fa-star',
            text: 'Enroll in VIP loyalty program with exclusive benefits'
        });
    } else {
        recommendations.push({
            icon: 'fa-check-circle',
            text: 'Customer retention status: Healthy'
        });

        recommendations.push({
            icon: 'fa-chart-line',
            text: 'Continue monitoring engagement metrics monthly'
        });

        if (data.contract !== 2) {
            recommendations.push({
                icon: 'fa-arrow-up',
                text: 'Opportunity: Upsell to longer contract term'
            });
        }
    }

    recommendationsList.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item">
            <i class="fas ${rec.icon}"></i>
            <span>${rec.text}</span>
        </div>
    `).join('');
}

// Update prediction chart
function updatePredictionChart(probability) {
    const ctx = chartCanvas.getContext('2d');

    if (predictionChart) {
        predictionChart.destroy();
    }

    predictionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Churn Risk', 'Retention Likelihood'],
            datasets: [{
                data: [probability * 100, (1 - probability) * 100],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 13,
                            family: 'Inter',
                            weight: '500'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

// Initialize trend chart
function initializeTrendChart() {
    const ctx = trendChartCanvas.getContext('2d');

    // Generate mock 30-day data
    const labels = [];
    const churnData = [];
    const retentionData = [];

    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Mock data with slight variation
        churnData.push(12 + Math.random() * 8);
        retentionData.push(88 - Math.random() * 8);
    }

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Churn Rate %',
                    data: churnData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Retention Rate %',
                    data: retentionData,
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            family: 'Inter',
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        font: {
                            size: 10,
                            family: 'Inter'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Update KPIs after prediction
function updateKPIs() {
    const predictionsToday = document.getElementById('predictions-today');
    const currentValue = parseInt(predictionsToday.textContent);
    predictionsToday.textContent = currentValue + 1;
}