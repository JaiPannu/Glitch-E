// ===== CHART INSTANCES =====
let marketChart = null;
let volumeChart = null;
let volumeHistory = [];
let timeLabels = [];

// ===== INITIALIZE MARKET CHART =====
function initializeMarketChart() {
    const ctx = document.getElementById('marketChart');
    if (!ctx) return;

    marketChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['YES - Success', 'NO - Fail'],
            datasets: [{
                data: [
                    initialMarketData.success_odds,
                    initialMarketData.fail_odds
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444'
                ],
                borderColor: [
                    '#059669',
                    '#dc2626'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// ===== INITIALIZE VOLUME CHART =====
function initializeVolumeChart() {
    const ctx = document.getElementById('volumeChart');
    if (!ctx) return;

    // Initialize with some dummy data
    volumeHistory = [
        { time: getTimeLabel(), success: initialMarketData.success_volume, fail: initialMarketData.fail_volume }
    ];
    timeLabels = [getTimeLabel()];

    volumeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'YES Volume',
                    data: volumeHistory.map(v => v.success),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'NO Volume',
                    data: volumeHistory.map(v => v.fail),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.2)'
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.2)'
                    }
                }
            }
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function getTimeLabel() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// ===== UPDATE MARKET DATA =====
function updateMarketData(data) {
    // Update KPI cards
    document.getElementById('robot-status').textContent = data.status;
    document.getElementById('race-timer').textContent = data.time + 's';
    document.getElementById('race-score').textContent = data.score;

    // Update market data
    const market = data.market;
    document.getElementById('success-odds').textContent = market.success_odds.toFixed(1) + '%';
    document.getElementById('fail-odds').textContent = market.fail_odds.toFixed(1) + '%';
    document.getElementById('total-volume').textContent = '$' + market.total_volume.toLocaleString();
    document.getElementById('participant-count').textContent = market.participants;
    document.getElementById('success-volume').textContent = 'Pool: $' + market.success_volume.toLocaleString();
    document.getElementById('fail-volume').textContent = 'Pool: $' + market.fail_volume.toLocaleString();

    // Update charts
    if (marketChart) {
        marketChart.data.datasets[0].data = [market.success_odds, market.fail_odds];
        marketChart.update('none');
    }

    // Update volume chart
    if (volumeChart) {
        const currentTime = getTimeLabel();
        const lastEntry = volumeHistory[volumeHistory.length - 1];
        
        // Only add new entry if time has changed and volumes changed
        if (currentTime !== timeLabels[timeLabels.length - 1] || 
            lastEntry.success !== market.success_volume || 
            lastEntry.fail !== market.fail_volume) {
            volumeHistory.push({
                time: currentTime,
                success: market.success_volume,
                fail: market.fail_volume
            });
            timeLabels.push(currentTime);

            // Keep only last 10 data points
            if (volumeHistory.length > 10) {
                volumeHistory.shift();
                timeLabels.shift();
            }

            volumeChart.data.labels = timeLabels;
            volumeChart.data.datasets[0].data = volumeHistory.map(v => v.success);
            volumeChart.data.datasets[1].data = volumeHistory.map(v => v.fail);
            volumeChart.update('none');
        }
    }
}

// ===== POLL MARKET DATA =====
function pollMarketData() {
    axios.get('/api/market-data')
        .then(response => {
            updateMarketData(response.data);
        })
        .catch(error => {
            console.error('Error polling market data:', error);
        });
}

// ===== PLACE BET =====
function placeBet(position) {
    const inputId = position === 'SUCCESS' ? 'success-amount' : 'fail-amount';
    const amountInput = document.getElementById(inputId);
    const amount = parseFloat(amountInput.value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Get current balance
    const balanceText = document.getElementById('user-balance').textContent;
    const currentBalance = parseInt(balanceText.replace(/\D/g, ''));

    if (amount > currentBalance) {
        alert('Insufficient balance. Maximum: $' + currentBalance);
        return;
    }

    // Disable button during submission
    const buttons = document.querySelectorAll('.bet-btn');
    buttons.forEach(btn => btn.disabled = true);

    axios.post('/api/place-bet', {
        position: position,
        amount: amount
    })
    .then(response => {
        if (response.data.success) {
            // Update balance
            updateUserBalance(response.data.new_balance);
            
            // Clear input
            amountInput.value = '';
            
            // Show success message
            showToast(`Bet placed: $${amount} on ${position}`);
            
            // Update market display immediately
            updateMarketData({
                status: document.getElementById('robot-status').textContent,
                time: parseInt(document.getElementById('race-timer').textContent),
                score: parseInt(document.getElementById('race-score').textContent),
                market: response.data.market_data
            });
        }
    })
    .catch(error => {
        alert('Error placing bet: ' + (error.response?.data?.error || 'Unknown error'));
    })
    .finally(() => {
        buttons.forEach(btn => btn.disabled = false);
    });
}

// ===== UPDATE USER BALANCE =====
function updateUserBalance(newBalance = null) {
    if (newBalance !== null) {
        document.getElementById('user-balance').textContent = '$' + newBalance + ' FAN';
    }
    
    // Fetch from server to ensure sync
    axios.get('/api/user-positions')
        .then(response => {
            document.getElementById('user-balance').textContent = '$' + response.data.balance + ' FAN';
        })
        .catch(error => {
            console.error('Error fetching user balance:', error);
        });
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== ADD ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== INITIALIZE ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Any additional initialization can go here
});
