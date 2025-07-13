export class ArbitrageRenderer {
    showArbitrageOpportunities() {
    console.log('\n🎯 ARBITRAGE ANALYSIS STARTING...');
    
    // Debug data structure first
    this.debugDataStructure();
    
    const arbitrageOpportunities = this.findArbitrageOpportunities(this.filteredData);
    
    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`   Total opportunities found: ${arbitrageOpportunities.length}`);
    console.log(`   Profitable arbitrages: ${arbitrageOpportunities.filter(op => op.isArbitrage).length}`);
    console.log(`   Unprofitable scenarios: ${arbitrageOpportunities.filter(op => !op.isArbitrage).length}`);
    
    // Check which view is active
    const desktopTable = document.getElementById('dataTable');
    const mobileCards = document.getElementById('mobileCards');
    const isMobileViewActive = mobileCards.style.display !== 'none' && 
                              desktopTable.style.display === 'none';
    
    if (isMobileViewActive) {
        this.renderArbitrageMobileCards(arbitrageOpportunities);
    } else {
        this.renderArbitrageDesktopTable(arbitrageOpportunities);
    }
    
    console.log('✅ Arbitrage view rendering complete');
}
renderArbitrageDesktopTable(arbitrageOpportunities) {
    const tbody = document.getElementById('tableBody');
    
    if (arbitrageOpportunities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No arbitrage opportunities found</td></tr>';
        return;
    }
    
    tbody.innerHTML = arbitrageOpportunities.map(arb => {
        const outcomeTypes = Object.keys(arb.bestOdds);
        
        return `
            <tr class="arbitrage-row">
                <td colspan="13" class="arbitrage-header">
                    <div class="arb-summary">
                        <div class="arb-game">
                            <strong>${arb.game_name}</strong>
                            <span class="arb-market">${arb.display_name}</span>
                            ${arb.spread ? `<span class="arb-spread">(${arb.spread})</span>` : ''}
                            <span class="live-indicator ${arb.live ? 'live' : 'prematch'}"></span>
                        </div>
                        <div class="arb-profit">
                            <strong>Profit: ${arb.profit.toFixed(2)}%</strong>
                            <span class="arb-guaranteed">$${arb.guaranteedProfit.toFixed(2)} guaranteed</span>
                        </div>
                    </div>
                    <div class="arb-details">
                        ${outcomeTypes.map(outcomeType => {
                            const stake = arb.stakes[outcomeType];
                            return `
                                <div class="arb-bet">
                                    <span class="arb-book">${stake.book}</span>
                                    <span class="arb-outcome">${outcomeType}</span>
                                    <span class="arb-odds">${stake.odds}</span>
                                    <span class="arb-stake">Bet: $${stake.stake.toFixed(2)}</span>
                                    <span class="arb-payout">Payout: $${stake.payout.toFixed(2)}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Render arbitrage opportunities in mobile card format
renderArbitrageMobileCards(arbitrageOpportunities) {
    const container = document.getElementById('mobileCards');
    
    if (arbitrageOpportunities.length === 0) {
        container.innerHTML = '<div class="no-data-card">No arbitrage opportunities found</div>';
        return;
    }
    
    container.innerHTML = arbitrageOpportunities.map(arb => {
        const outcomeTypes = Object.keys(arb.bestOdds);
        
        return `
            <div class="arbitrage-card">
                <div class="arb-card-header">
                    <div class="arb-game-info">
                        <div class="arb-game-name">${arb.game_name}</div>
                        <div class="arb-market-name">${arb.display_name}</div>
                        ${arb.spread ? `<div class="arb-spread-info">${arb.spread}</div>` : ''}
                    </div>
                    <div class="arb-profit-info">
                        <div class="arb-profit-percent">${arb.profit.toFixed(2)}%</div>
                        <div class="arb-guaranteed-profit">$${arb.guaranteedProfit.toFixed(2)}</div>
                        <div class="arb-status ${arb.live ? 'live' : 'pre'}">${arb.live ? 'LIVE' : 'PRE'}</div>
                    </div>
                </div>
                
                <div class="arb-bets">
                    ${outcomeTypes.map(outcomeType => {
                        const stake = arb.stakes[outcomeType];
                        return `
                            <div class="arb-bet-card">
                                <div class="arb-bet-header">
                                    <span class="arb-book-name">${stake.book}</span>
                                    <span class="arb-outcome-type">${outcomeType}</span>
                                </div>
                                <div class="arb-bet-details">
                                    <div class="arb-odds-display">${stake.odds}</div>
                                    <div class="arb-stake-amount">Bet: $${stake.stake.toFixed(2)}</div>
                                    <div class="arb-payout-amount">→ $${stake.payout.toFixed(2)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}
// Method to toggle between regular view and arbitrage view
toggleArbitrageView() {
    const currentView = document.getElementById('currentView').textContent;
    const arbitrageBtn = document.getElementById('arbitrageToggle');
    
    if (currentView === 'regular') {
        // Switch to arbitrage view
        this.showArbitrageOpportunities();
        document.getElementById('currentView').textContent = 'arbitrage';
        arbitrageBtn.textContent = '📊 Regular View';
        arbitrageBtn.style.background = '#e74c3c';
    } else {
        // Switch back to regular view
        this.renderTable();
        document.getElementById('currentView').textContent = 'regular';
        arbitrageBtn.textContent = '🔄 Arbitrage View';
        arbitrageBtn.style.background = '#9b59b6';
    }
}
}