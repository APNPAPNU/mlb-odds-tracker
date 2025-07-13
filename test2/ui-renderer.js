export class UIRenderer {
    constructor() {
        this.isMobileView = false;
    }
    renderTable() {
    const desktopTable = document.getElementById('dataTable');
    const mobileCards = document.getElementById('mobileCards');
    const columnFilterRow = document.querySelector('.column-filter-row');
    
    // Check which view is currently active based on display style
    const isMobileViewActive = mobileCards.style.display !== 'none' && 
                              desktopTable.style.display === 'none';
    
    // Hide/show column filter row based on view
    if (columnFilterRow) {
        columnFilterRow.style.display = isMobileViewActive ? 'none' : 'grid';
    }
    
    if (isMobileViewActive) {
        this.renderMobileCards();
    } else {
        this.renderDesktopTable();
    }
}
renderDesktopTable() {
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
                ${this.getBookLogo(record.book) ? 
                    `<img src="${this.getBookLogo(record.book)}" 
                         alt="${record.book || 'Unknown'}" 
                         style="width: 32px; height: 32px; object-fit: contain;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">
                     <span style="display: none;">${record.book || 'Unknown'}</span>` 
                    : (record.book || 'Unknown')
                }
            </td>
            <td>${this.formatGameName(record)}</td>
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
                ${record.deeplink && this.getBookLogo(record.book) ? 
                    `<button class="deeplink" onclick="window.open('${record.deeplink}', '_blank')">
                        <img src="${this.getBookLogo(record.book)}" 
                             alt="${record.book}" 
                             style="width: 24px; height: 24px; object-fit: contain;">
                     </button>` 
                    : (record.deeplink ? `<button class="deeplink" onclick="window.open('${record.deeplink}', '_blank')">${record.book || 'Bet'}</button>` : '')
                }
            </td>
            <td class="mobile-hide">
                <button class="chart-btn" onclick="dashboard.openHistoricalChart('${record.outcome_id}', ${record.live}, '${record.spread || ''}', dashboard.filteredData[${index}])">📊</button>
            </td>
            <td class="mobile-hide">${this.formatTimestamp(record.last_ts)}</td>
        </tr>
    `).join('');

    // Remove the click handlers for rows since we only want button clicks to work
    // No additional event listeners needed - buttons handle their own clicks
}
renderMobileCards() {
    const container = document.getElementById('mobileCards');
    
    if (this.filteredData.length === 0) {
        container.innerHTML = '<div class="no-data-card">No data matches filters</div>';
        return;
    }
    
    // Group the flat data by market
    const groupedData = this.groupDataByMarket(this.filteredData);
    
    container.innerHTML = groupedData.map((market, marketIndex) => {
        const outcomesHtml = market.outcomes.map((outcome, outcomeIndex) => {
            // Get spread information for display
            const spreadInfo = outcome.spread ? ` (${outcome.spread})` : '';
            const outcomeDisplayName = outcome.outcome_type + spreadInfo;
            
            return `
                <div class="compact-outcome">
                    <div class="compact-outcome-left">
                        <div class="compact-book-logo">
                            ${this.getBookLogo(outcome.book) ? 
                                `<img src="${this.getBookLogo(outcome.book)}" 
                                     alt="${outcome.book}" 
                                     class="compact-book-img">` 
                                : `<span class="compact-book-text">${this.getBookInitials(outcome.book)}</span>`
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
                            <button class="compact-btn compact-chart-btn" onclick="dashboard.openHistoricalChart('${outcome.outcome_id}', ${outcome.live}, '${outcome.spread || ''}', dashboard.filteredData.find(r => r.outcome_id === '${outcome.outcome_id}'))">
                                📊
                            </button>
                            ${outcome.deeplink ? 
                                `<button class="compact-btn compact-bet-btn" onclick="window.open('${outcome.deeplink}', '_blank')">Bet</button>` : ''
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
                        <div class="compact-game-name">${this.formatGameName(market)}</div>
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
groupDataByMarket(data) {
    const marketGroups = {};
    
    data.forEach(record => {
        // Create a unique market key combining game and market info
        const marketKey = `${this.formatGameName(record)}_${record.display_name || record.market_type || 'Unknown'}`;
        
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
        
        // Add this record as an outcome
        marketGroups[marketKey].outcomes.push(record);
        
        // Update best EV for this market
        if (record.ev && record.ev > marketGroups[marketKey].bestEV) {
            marketGroups[marketKey].bestEV = record.ev;
        }
    });
    
    // Convert to array and sort by best EV
    return Object.values(marketGroups).sort((a, b) => b.bestEV - a.bestEV);
}
 updateCounts() {
        const totalRecords = this.filteredData.length;
        const liveCount = this.filteredData.filter(d => d.live).length;
        const prematchCount = totalRecords - liveCount;

        document.getElementById('totalRecords').textContent = totalRecords;
        document.getElementById('liveCount').textContent = liveCount;
        document.getElementById('prematchCount').textContent = prematchCount;
    }
  showError(message) {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = `<tr><td colspan="12" class="error-message">${message}</td></tr>`;
        
        const mobileCards = document.getElementById('mobileCards');
        mobileCards.innerHTML = `<div class="error-card">${message}</div>`;
    }
    updateStatus(text, type = 'loading') {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${type}`;
        statusText.textContent = text;
    }
}