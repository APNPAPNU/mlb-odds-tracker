// rendering.js - Complete rendering system with deeplink functionality

export function renderArbitrageDesktopTable(opportunities) {
    const container = document.getElementById('arbitrage-results') || createArbitrageContainer();
    
    if (!opportunities || opportunities.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>No Arbitrage Opportunities Found</h3>
                <p>Try adjusting your filters or check back later for new opportunities.</p>
            </div>
        `;
        return;
    }

    const profitableCount = opportunities.filter(op => op.isArbitrage).length;
    
    container.innerHTML = `
        <div class="arbitrage-header">
            <h2>📊 Arbitrage Analysis Results</h2>
            <div class="stats-summary">
                <span class="stat-item">
                    <strong>${opportunities.length}</strong> Total Opportunities
                </span>
                <span class="stat-item profit">
                    <strong>${profitableCount}</strong> Profitable Arbitrages
                </span>
                <span class="stat-item loss">
                    <strong>${opportunities.length - profitableCount}</strong> Unprofitable
                </span>
            </div>
        </div>

        <div class="arbitrage-table-container">
            <table class="arbitrage-table">
                <thead>
                    <tr>
                        <th>Game</th>
                        <th>Market</th>
                        <th>Outcomes</th>
                        <th>Profit/Loss</th>
                        <th>Stakes ($100)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${opportunities.map(opportunity => renderDesktopTableRow(opportunity)).join('')}
                </tbody>
            </table>
        </div>
    `;
}

export function renderArbitrageMobileCards(opportunities) {
    const container = document.getElementById('arbitrage-results') || createArbitrageContainer();
    
    if (!opportunities || opportunities.length === 0) {
        container.innerHTML = `
            <div class="no-results mobile">
                <h3>No Arbitrage Opportunities Found</h3>
                <p>Try adjusting your filters or check back later for new opportunities.</p>
            </div>
        `;
        return;
    }

    const profitableCount = opportunities.filter(op => op.isArbitrage).length;
    
    container.innerHTML = `
        <div class="arbitrage-header mobile">
            <h2>📊 Arbitrage Opportunities</h2>
            <div class="stats-summary mobile">
                <div class="stat-item">
                    <span class="stat-number">${opportunities.length}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="stat-item profit">
                    <span class="stat-number">${profitableCount}</span>
                    <span class="stat-label">Profitable</span>
                </div>
                <div class="stat-item loss">
                    <span class="stat-number">${opportunities.length - profitableCount}</span>
                    <span class="stat-label">Unprofitable</span>
                </div>
            </div>
        </div>

        <div class="arbitrage-cards-container">
            ${opportunities.map(opportunity => renderMobileCard(opportunity)).join('')}
        </div>
    `;

    // Add click event listeners to all bet buttons
    addBetButtonListeners();
}

function renderDesktopTableRow(opportunity) {
    const outcomeEntries = Object.entries(opportunity.bestOdds);
    const profitClass = opportunity.isArbitrage ? 'profit' : 'loss';
    const statusIcon = opportunity.isArbitrage ? '🎉' : '📉';
    const statusText = opportunity.isArbitrage ? 'ARBITRAGE' : 'NO PROFIT';

    return `
        <tr class="arbitrage-row ${profitClass}">
            <td class="game-info">
                <div class="game-name">${opportunity.game_name}</div>
                <div class="game-details">
                    ${opportunity.sport ? `<span class="sport">${opportunity.sport}</span>` : ''}
                    ${opportunity.live ? '<span class="live-badge">LIVE</span>' : ''}
                </div>
            </td>
            <td class="market-info">
                <div class="market-name">${opportunity.display_name}</div>
                ${opportunity.spread ? `<div class="spread">Spread: ${opportunity.spread}</div>` : ''}
            </td>
            <td class="outcomes-info">
                ${outcomeEntries.map(([outcomeType, data]) => `
                    <div class="outcome-item">
                        <div class="outcome-details">
                            <span class="outcome-type">${outcomeType}</span>
                            <span class="book">${data.outcome.book}</span>
                        </div>
                        <div class="odds-info">
                            <span class="odds">${data.outcome.american_odds}</span>
                            <span class="prob">(${(data.impliedProb * 100).toFixed(1)}%)</span>
                        </div>
                        ${data.outcome.deeplink ? `
                            <button class="bet-button" data-deeplink="${data.outcome.deeplink}" data-book="${data.outcome.book}">
                                Bet ${data.outcome.book}
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </td>
            <td class="profit-info ${profitClass}">
                <div class="profit-percentage">${opportunity.profit.toFixed(2)}%</div>
                ${opportunity.isArbitrage ? `
                    <div class="guaranteed-profit">+$${opportunity.guaranteedProfit.toFixed(2)}</div>
                ` : ''}
            </td>
            <td class="stakes-info">
                ${Object.entries(opportunity.stakes).map(([outcomeType, stake]) => `
                    <div class="stake-item">
                        <span class="stake-outcome">${outcomeType}</span>
                        <span class="stake-amount">$${stake.stake.toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="total-stake">Total: $${opportunity.totalStake.toFixed(2)}</div>
            </td>
            <td class="status-info ${profitClass}">
                <span class="status-icon">${statusIcon}</span>
                <span class="status-text">${statusText}</span>
            </td>
        </tr>
    `;
}

function renderMobileCard(opportunity) {
    const outcomeEntries = Object.entries(opportunity.bestOdds);
    const profitClass = opportunity.isArbitrage ? 'profit' : 'loss';
    const statusIcon = opportunity.isArbitrage ? '🎉' : '📉';
    const statusText = opportunity.isArbitrage ? 'ARBITRAGE OPPORTUNITY' : 'NO ARBITRAGE';

    return `
        <div class="arbitrage-card ${profitClass}">
            <div class="card-header">
                <div class="game-info">
                    <h3 class="game-name">${opportunity.game_name}</h3>
                    <div class="game-meta">
                        ${opportunity.sport ? `<span class="sport">${opportunity.sport}</span>` : ''}
                        ${opportunity.live ? '<span class="live-badge">LIVE</span>' : ''}
                    </div>
                </div>
                <div class="profit-indicator ${profitClass}">
                    <span class="profit-percentage">${opportunity.profit.toFixed(2)}%</span>
                    <span class="status-text">${statusText}</span>
                </div>
            </div>

            <div class="card-body">
                <div class="market-info">
                    <h4 class="market-name">${opportunity.display_name}</h4>
                    ${opportunity.spread ? `<div class="spread">Spread: ${opportunity.spread}</div>` : ''}
                </div>

                <div class="outcomes-grid">
                    ${outcomeEntries.map(([outcomeType, data]) => `
                        <div class="outcome-card">
                            <div class="outcome-header">
                                <span class="outcome-type">${outcomeType}</span>
                                <span class="book-name">${data.outcome.book}</span>
                            </div>
                            <div class="odds-display">
                                <span class="odds">${data.outcome.american_odds}</span>
                                <span class="implied-prob">${(data.impliedProb * 100).toFixed(1)}%</span>
                            </div>
                            <div class="stake-info">
                                <span class="stake-label">Stake:</span>
                                <span class="stake-amount">$${opportunity.stakes[outcomeType].stake.toFixed(2)}</span>
                            </div>
                            ${data.outcome.deeplink ? `
                                <button class="bet-button mobile" data-deeplink="${data.outcome.deeplink}" data-book="${data.outcome.book}">
                                    <span class="bet-icon">🎯</span>
                                    Bet on ${data.outcome.book}
                                </button>
                            ` : `
                                <div class="no-link-notice">
                                    <span>No direct link available</span>
                                </div>
                            `}
                        </div>
                    `).join('')}
                </div>

                ${opportunity.isArbitrage ? `
                    <div class="profit-summary">
                        <div class="profit-details">
                            <div class="profit-item">
                                <span class="label">Total Stake:</span>
                                <span class="value">$${opportunity.totalStake.toFixed(2)}</span>
                            </div>
                            <div class="profit-item">
                                <span class="label">Guaranteed Profit:</span>
                                <span class="value profit">+$${opportunity.guaranteedProfit.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createArbitrageContainer() {
    const container = document.createElement('div');
    container.id = 'arbitrage-results';
    container.className = 'arbitrage-results-container';
    document.body.appendChild(container);
    return container;
}

function addBetButtonListeners() {
    const betButtons = document.querySelectorAll('.bet-button[data-deeplink]');
    
    betButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const deeplink = this.getAttribute('data-deeplink');
            const book = this.getAttribute('data-book');
            
            if (deeplink) {
                handleDeeplink(deeplink, book);
            }
        });
    });
}

function handleDeeplink(deeplink, book) {
    console.log(`🎯 Opening bet slip for ${book}: ${deeplink}`);
    
    // Add visual feedback
    const button = document.querySelector(`[data-deeplink="${deeplink}"]`);
    if (button) {
        button.classList.add('loading');
        button.innerHTML = '<span class="loading-spinner">⏳</span> Opening...';
        
        // Reset button after delay
        setTimeout(() => {
            button.classList.remove('loading');
            button.innerHTML = button.classList.contains('mobile') ? 
                `<span class="bet-icon">🎯</span> Bet on ${book}` : 
                `Bet ${book}`;
        }, 2000);
    }
    
    // Try to open the deeplink
    try {
        // For mobile devices, try the app first
        if (isMobileDevice()) {
            window.location.href = deeplink;
        } else {
            // For desktop, open in new tab
            window.open(deeplink, '_blank');
        }
    } catch (error) {
        console.error('Error opening deeplink:', error);
        
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(deeplink).then(() => {
                showNotification('Betting link copied to clipboard!', 'info');
            }).catch(() => {
                showNotification('Unable to open betting link', 'error');
            });
        } else {
            showNotification('Unable to open betting link', 'error');
        }
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'error' ? '❌' : '✅'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS Styles - Add these to your stylesheet
export const arbitrageStyles = `
.arbitrage-results-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.arbitrage-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.arbitrage-header h2 {
    margin: 0 0 20px 0;
    font-size: 2.5rem;
    font-weight: 700;
}

.stats-summary {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
}

.stats-summary.mobile {
    justify-content: space-around;
    gap: 20px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
    min-width: 100px;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.stat-item.profit {
    background: rgba(34, 197, 94, 0.2);
    border: 2px solid rgba(34, 197, 94, 0.3);
}

.stat-item.loss {
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid rgba(239, 68, 68, 0.3);
}

.arbitrage-table-container {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.arbitrage-table {
    width: 100%;
    border-collapse: collapse;
}

.arbitrage-table th {
    background: #f8fafc;
    padding: 20px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
}

.arbitrage-table td {
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
}

.arbitrage-row.profit {
    background: linear-gradient(90deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);
}

.arbitrage-row.loss {
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
}

.game-name {
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.game-details, .game-meta {
    display: flex;
    gap: 10px;
    align-items: center;
}

.sport {
    background: #e5e7eb;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.live-badge {
    background: #ef4444;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.market-name {
    font-weight: 600;
    margin-bottom: 5px;
}

.spread {
    color: #6b7280;
    font-size: 0.9rem;
}

.outcome-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 15px;
    padding: 10px;
    background: #f9fafb;
    border-radius: 8px;
}

.outcome-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.outcome-type {
    font-weight: 600;
    color: #374151;
}

.book {
    font-size: 0.9rem;
    color: #6b7280;
}

.odds-info {
    display: flex;
    gap: 10px;
    align-items: center;
}

.odds {
    font-weight: 700;
    font-size: 1.1rem;
}

.prob {
    color: #6b7280;
    font-size: 0.9rem;
}

.profit-percentage {
    font-size: 1.3rem;
    font-weight: 700;
}

.profit-info.profit .profit-percentage {
    color: #059669;
}

.profit-info.loss .profit-percentage {
    color: #dc2626;
}

.guaranteed-profit {
    color: #059669;
    font-weight: 600;
    font-size: 1.1rem;
}

.stake-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
}

.total-stake {
    font-weight: 600;
    border-top: 1px solid #e5e7eb;
    padding-top: 5px;
    margin-top: 10px;
}

.status-info {
    text-align: center;
}

.status-icon {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 5px;
}

.status-text {
    font-weight: 600;
    font-size: 0.9rem;
}

.status-info.profit .status-text {
    color: #059669;
}

.status-info.loss .status-text {
    color: #dc2626;
}

.bet-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
}

.bet-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
}

.bet-button.loading {
    background: #9ca3af;
    cursor: not-allowed;
}

.bet-button.mobile {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.bet-icon {
    font-size: 1.2rem;
}

.loading-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.no-link-notice {
    text-align: center;
    padding: 10px;
    color: #6b7280;
    font-size: 0.9rem;
    font-style: italic;
}

/* Mobile Card Styles */
.arbitrage-cards-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.arbitrage-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.arbitrage-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.card-header {
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-bottom: 1px solid #e5e7eb;
}

.card-body {
    padding: 20px;
}

.profit-indicator {
    text-align: right;
    margin-top: 10px;
}

.profit-indicator .profit-percentage {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 5px;
}

.profit-indicator.profit .profit-percentage {
    color: #059669;
}

.profit-indicator.loss .profit-percentage {
    color: #dc2626;
}

.outcomes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.outcome-card {
    background: #f9fafb;
    border-radius: 10px;
    padding: 15px;
    border: 2px solid #e5e7eb;
    transition: border-color 0.3s ease;
}

.outcome-card:hover {
    border-color: #3b82f6;
}

.outcome-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.outcome-type {
    font-weight: 600;
    color: #374151;
}

.book-name {
    font-size: 0.9rem;
    color: #6b7280;
    font-weight: 500;
}

.odds-display {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.odds {
    font-size: 1.3rem;
    font-weight: 700;
    color: #111827;
}

.implied-prob {
    color: #6b7280;
    font-size: 0.9rem;
}

.stake-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 8px;
    background: #e5e7eb;
    border-radius: 5px;
}

.stake-amount {
    font-weight: 600;
    color: #374151;
}

.profit-summary {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border: 1px solid #a7f3d0;
    border-radius: 10px;
    padding: 15px;
    margin-top: 20px;
}

.profit-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.profit-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.profit-item .label {
    font-size: 0.9rem;
    color: #6b7280;
}

.profit-item .value {
    font-weight: 600;
    font-size: 1.1rem;
}

.profit-item .value.profit {
    color: #059669;
}

.no-results {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.no-results h3 {
    color: #374151;
    margin-bottom: 15px;
    font-size: 1.5rem;
}

.no-results p {
    color: #6b7280;
    font-size: 1.1rem;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 10px;
    padding: 15px 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.notification.error {
    border-left: 4px solid #ef4444;
}

.notification.info {
    border-left: 4px solid #3b82f6;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.notification-icon {
    font-size: 1.2rem;
}

.notification-message {
    font-weight: 500;
    color: #374151;
}

/* Responsive Design */
@media (max-width: 768px) {
    .arbitrage-results-container {
        padding: 10px;
    }
    
    .arbitrage-header {
        padding: 20px;
    }
    
    .arbitrage-header h2 {
        font-size: 1.8rem;
    }
    
    .stats-summary {
        gap: 10px;
    }
    
    .stat-item {
        padding: 10px;
        min-width: 80px;
    }
    
    .stat-number {
        font-size: 1.5rem;
    }
    
    .outcomes-grid {
        grid-template-columns: 1fr;
    }
    
    .arbitrage-table-container {
        overflow-x: auto;
    }
    
    .arbitrage-table {
        min-width: 800px;
    }
}
`;
