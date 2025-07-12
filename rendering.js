import { formatGameName, getBookLogo, getBookInitials } from './utils.js';

export function renderTable() {
    const desktopTable = document.getElementById('dataTable');
    const mobileCards = document.getElementById('mobileCards');
    const columnFilterRow = document.querySelector('.column-filter-row');
    
    const isMobileViewActive = mobileCards.style.display !== 'none' && 
                              desktopTable.style.display === 'none';
    
    if (columnFilterRow) {
        columnFilterRow.style.display = isMobileViewActive ? 'none' : 'grid';
    }
    
    if (isMobileViewActive) {
        this.renderMobileCards();
    } else {
        this.renderDesktopTable();
    }
}

export function renderDesktopTable() {
    const tbody = document.getElementById('tableBody');
    
    if (this.filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No data matches current filters</td></tr>';
        return;
    }

    tbody.innerHTML = this.filteredData.map((record, index) => `
        <tr>
            <td>
                <span class="live-indicator ${record.live ? 'live' : 'prematch'}"></span>
                <span>${record.live ? 'LIVE' : 'Pre'}</span>
            </td>
            <td>
                ${getBookLogo(record.book) ? 
                    `<img src="${getBookLogo(record.book)}" 
                         alt="${record.book || 'Unknown'}" 
                         style="width: 32px; height: 32px; object-fit: contain;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                     <span style="display: none;">${record.book || 'Unknown'}</span>` 
                    : (record.book || 'Unknown')
                }
            </td>
            <td>${formatGameName(record)}</td>
            <td>${record.display_name || record.market_type || ''}</td>
            <td>${record.outcome_type || ''}</td>
            <td class="${record.ev > 0 ? 'ev-positive' : 'ev-negative'}">
                ${record.ev ? (record.ev * 100).toFixed(2) + '%' : ''}
            </td>
            <td>${record.american_odds || ''}</td>
            <td class="mobile-hide">${record.true_prob ? (record.true_prob * 100).toFixed(1) + '%' : ''}</td>
            <td class="mobile-hide">${record.spread || ''}</td>
            <td class="mobile-hide">${record.sport || ''}</td>
            <td class="mobile-hide">
                ${record.deeplink && getBookLogo(record.book) ? 
                    `<button class="deeplink" data-deeplink="${record.deeplink}">
                        <img src="${getBookLogo(record.book)}" 
                             alt="${record.book}" 
                             style="width: 24px; height: 24px; object-fit: contain;">
                     </button>` 
                    : (record.deeplink ? `<button class="deeplink" data-deeplink="${record.deeplink}">${record.book || 'Bet'}</button>` : '')
                }
            </td>
            <td class="mobile-hide">
                <button class="chart-btn" data-outcome-id="${record.outcome_id}" data-live="${record.live}" data-spread="${record.spread || ''}" data-index="${index}">📊</button>
            </td>
            <td class="mobile-hide">${this.formatTimestamp(record.last_ts)}</td>
        </tr>
    `).join('');
}

export function renderMobileCards() {
    const container = document.getElementById('mobileCards');
    
    if (this.filteredData.length === 0) {
        container.innerHTML = '<div class="no-data-card">No data matches filters</div>';
        return;
    }
    
    const groupedData = this.groupDataByMarket(this.filteredData);
    
    container.innerHTML = groupedData.map((market, marketIndex) => {
        const outcomesHtml = market.outcomes.map((outcome, outcomeIndex) => {
            const spreadInfo = outcome.spread ? ` (${outcome.spread})` : '';
            const outcomeDisplayName = outcome.outcome_type + spreadInfo;
            const recordIndex = this.filteredData.findIndex(r => r.outcome_id === outcome.outcome_id);
            
            return `
                <div class="compact-outcome">
                    <div class="compact-outcome-left">
                        <div class="compact-book-logo">
                            ${getBookLogo(outcome.book) ? 
                                `<img src="${getBookLogo(outcome.book)}" 
                                     alt="${outcome.book}" 
                                     class="compact-book-img">` 
                                : `<span class="compact-book-text">${getBookInitials(outcome.book)}</span>`
                            }
                        </div>
                        <div class="compact-outcome-info">
                            <div class="compact-outcome-type">${outcomeDisplayName}</div>
                            <div class="compact-odds">${outcome.american_odds || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="compact-outcome-right">
                        <div class="compact-ev ${outcome.ev > 0 ? 'ev-positive' : 'ev-negative'}">
                            ${outcome.ev ? (outcome.ev * 100).toFixed(1) + '%' : 'N/A'}
                        </div>
                        <div class="compact-actions">
                            <button class="compact-btn compact-chart-btn" data-outcome-id="${outcome.outcome_id}" data-live="${outcome.live}" data-spread="${outcome.spread || ''}" data-index="${recordIndex}">
                                📊
                            </button>
                            ${outcome.deeplink ? 
                                `<button class="compact-btn compact-bet-btn" data-deeplink="${outcome.deeplink}">Bet</button>` : ''
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="compact-card">
                <div class="compact-header">
                    <div class="compact-game-info">
                        <div class="compact-game-name">${formatGameName(market)}</div>
                        <div class="compact-market-type">${market.display_name || market.market_type || 'Unknown Market'}</div>
                    </div>
                    <div class="compact-meta">
                        <div class="compact-status ${market.live ? 'live' : 'pre'}">
                            ${market.live ? 'LIVE' : 'PRE'}
                        </div>
                        <div class="compact-best-ev">+${(market.bestEV * 100).toFixed(1)}%</div>
                    </div>
                </div>
                
                <div class="compact-outcomes">
                    ${outcomesHtml}
                </div>
            </div>
        `;
    }).join('');
}

export function renderArbitrageDesktopTable(arbitrageOpportunities) {
    const tbody = document.getElementById('tableBody');
    
    console.log(`🖥️ Rendering ${arbitrageOpportunities.length} opportunities in desktop table`);
    
    if (arbitrageOpportunities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13" class="no-data">No arbitrage opportunities found</td></tr>';
        return;
    }
    
    tbody.innerHTML = arbitrageOpportunities.map(arb => {
        const outcomeTypes = Object.keys(arb.bestOdds);
        const isProfit = arb.isArbitrage;
        const statusClass = isProfit ? 'profit' : 'loss';
        const statusText = isProfit ? 'ARBITRAGE' : 'LOSS';
        
        return `
            <tr class="arbitrage-row ${statusClass}">
                <td colspan="13" class="arbitrage-header">
                    <div class="arb-summary">
                        <div class="arb-game">
                            <strong>${arb.game_name}</strong>
                            <span class="arb-market">${arb.display_name}</span>
                            ${arb.spread ? `<span class="arb-spread">(${arb.spread})</span>` : ''}
                            <span class="live-indicator ${arb.live ? 'live' : 'prematch'}"></span>
                            <span class="arb-status ${statusClass}">${statusText}</span>
                        </div>
                        <div class="arb-profit">
                            <strong>${isProfit ? 'Profit' : 'Loss'}: ${Math.abs(arb.profit).toFixed(2)}%</strong>
                            <span class="arb-guaranteed ${statusClass}">
                                ${isProfit ? '+' : '-'}$${Math.abs(arb.guaranteedProfit).toFixed(2)} 
                                ${isProfit ? 'guaranteed' : 'loss'}
                            </span>
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

export function renderArbitrageMobileCards(arbitrageOpportunities) {
    const container = document.getElementById('mobileCards');
    
    console.log(`📱 Rendering ${arbitrageOpportunities.length} opportunities in mobile cards`);
    
    if (arbitrageOpportunities.length === 0) {
        container.innerHTML = '<div class="no-data-card">No arbitrage opportunities found</div>';
        return;
    }
    
    container.innerHTML = arbitrageOpportunities.map(arb => {
        const outcomeTypes = Object.keys(arb.bestOdds);
        const isProfit = arb.isArbitrage;
        const statusClass = isProfit ? 'profit' : 'loss';
        const statusText = isProfit ? 'ARBITRAGE' : 'LOSS';
        
        return `
            <div class="arbitrage-card ${statusClass}">
                <div class="arb-card-header">
                    <div class="arb-game-info">
                        <div class="arb-game-name">${arb.game_name}</div>
                        <div class="arb-market-name">${arb.display_name}</div>
                        ${arb.spread ? `<div class="arb-spread-info">${arb.spread}</div>` : ''}
                    </div>
                    <div class="arb-profit-info">
                        <div class="arb-profit-percent ${statusClass}">
                            ${isProfit ? '+' : '-'}${Math.abs(arb.profit).toFixed(2)}%
                        </div>
                        <div class="arb-guaranteed-profit ${statusClass}">
                            ${isProfit ? '+' : '-'}$${Math.abs(arb.guaranteedProfit).toFixed(2)}
                        </div>
                        <div class="arb-status ${arb.live ? 'live' : 'pre'}">${arb.live ? 'LIVE' : 'PRE'}</div>
                        <div class="arb-type ${statusClass}">${statusText}</div>
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

export function groupDataByMarket(data) {
    const marketGroups = {};
    
    data.forEach(record => {
        const marketKey = `${formatGameName(record)}_${record.display_name || record.market_type || 'Unknown'}`;
        
        if (!marketGroups[marketKey]) {
            marketGroups[marketKey] = {
                game_name: record.game_name,
                home_team: record.home_team,
                away_team: record.away_team,
                player_1: record.player_1,
                player_2: record.player_2,
                sport: record.sport,
                display_name: record.display_name,
                market_type: record.market_type,
                live: record.live,
                outcomes: [],
                bestEV: -999
            };
        }
        
        marketGroups[marketKey].outcomes.push(record);
        
        if (record.ev && record.ev > marketGroups[marketKey].bestEV) {
            marketGroups[marketKey].bestEV = record.ev;
        }
    });
    
    return Object.values(marketGroups).sort((a, b) => b.bestEV - a.bestEV);
}
