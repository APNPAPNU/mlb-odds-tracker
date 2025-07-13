export class FilterManager {
    constructor() {
        this.columnFilters = {};
        this.sortColumn = null;
        this.sortDirection = 'asc';
    }
     setupColumnFilters() {
        const columnInputs = document.querySelectorAll('.column-filter-input');
        columnInputs.forEach((input, index) => {
            if (!input.disabled) {
                input.addEventListener('input', (e) => {
                    this.columnFilters[index] = e.target.value.toLowerCase();
                    this.applyFilters();
                });
            }
        });
    }
    setupColumnFilters() {
        const columnInputs = document.querySelectorAll('.column-filter-input');
        columnInputs.forEach((input, index) => {
            if (!input.disabled) {
                input.addEventListener('input', (e) => {
                    this.columnFilters[index] = e.target.value.toLowerCase();
                    this.applyFilters();
                });
            }
        });
    }

    setupSorting() {
        const headers = document.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }
                this.updateSortIndicators();
                this.applyFilters();
            });
        });
    }

    updateSortIndicators() {
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.textContent = '';
        });
        
        if (this.sortColumn) {
            const header = document.querySelector(`th[data-sort="${this.sortColumn}"] .sort-indicator`);
            if (header) {
                header.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
            }
        }
    }
        updateFilterOptions() {
        const books = [...new Set(this.data.map(d => d.book).filter(Boolean))].sort();
        this.updateSelectOptions('bookFilter', books);

        const sports = [...new Set(this.data.map(d => d.sport).filter(Boolean))].sort();
        this.updateSelectOptions('sportFilter', sports);
    }

    updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = select.children[0].outerHTML;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        select.value = currentValue;
    }

// Replace the existing applyFilters method with this updated version

applyFilters() {
    let filtered = this.data;

    // Filter by allowed sportsbooks only - FIRST ADD MORE HERE AS YOU SEARCH
    const allowedSportsbooks = ["DRAFTKINGS","FANDUEL","BETMGM","CAESARS","ESPN","HARDROCK","BALLYBET","BET365","FANATICS","NONE"];
    filtered = filtered.filter(d => allowedSportsbooks.includes(d.book));

console.log(`🔍 Filtering debug:`);
console.log(`   Initial records: ${this.data.length}`);
console.log(`   After sportsbook filter: ${filtered.length}`);
console.log(`   Allowed sportsbooks: ${allowedSportsbooks.join(', ')}`);
// Sample some records to check structure
if (filtered.length > 0) {
    const sample = filtered.slice(0, 3);
    console.log('Sample filtered records:', sample);
}

    // Chain other filters for better performance
    const bookFilter = document.getElementById('bookFilter').value;
    const sportFilter = document.getElementById('sportFilter').value;
    const evFilterInput = document.getElementById('evFilter').value;
    const liveFilter = document.getElementById('liveFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    if (bookFilter) {
        filtered = filtered.filter(d => d.book === bookFilter);
    }

    if (sportFilter) {
        filtered = filtered.filter(d => d.sport === sportFilter);
    }

    if (evFilterInput !== '' && !isNaN(evFilterInput)) {
        const evThreshold = parseFloat(evFilterInput) / 100;
        filtered = filtered.filter(d => d.ev && d.ev >= evThreshold);
    }

    if (liveFilter !== '') {
        const isLive = liveFilter === 'true';
        filtered = filtered.filter(d => d.live === isLive);
    }

    if (searchFilter) {
        filtered = filtered.filter(d => 
            (d.game_name && d.game_name.toLowerCase().includes(searchFilter)) ||
            (d.home_team && d.home_team.toLowerCase().includes(searchFilter)) ||
            (d.away_team && d.away_team.toLowerCase().includes(searchFilter)) ||
            (d.player_1 && d.player_1.toLowerCase().includes(searchFilter)) ||
            (d.player_2 && d.player_2.toLowerCase().includes(searchFilter)) ||
            (d.display_name && d.display_name.toLowerCase().includes(searchFilter))
        );
    }

    // Column filters
    Object.entries(this.columnFilters).forEach(([colIndex, filterValue]) => {
        if (filterValue) {
            filtered = filtered.filter(record => {
                const cellValue = this.getCellValue(record, parseInt(colIndex));
                return cellValue.toLowerCase().includes(filterValue);
            });
        }
    });

    // Sorting
    if (this.sortColumn) {
        filtered.sort((a, b) => {
            const aVal = this.getSortValue(a, this.sortColumn);
            const bVal = this.getSortValue(b, this.sortColumn);
            
            let result = 0;
            if (aVal < bVal) result = -1;
            else if (aVal > bVal) result = 1;
            
            return this.sortDirection === 'desc' ? -result : result;
        });
    }

    this.filteredData = filtered;
    
    // Check current view and render accordingly
    const currentView = document.getElementById('currentView');
    if (currentView && currentView.textContent === 'arbitrage') {
        this.showArbitrageOpportunities();
    } else {
        this.renderTable();
    }
    
    this.updateCounts();
}
    getCellValue(record, colIndex) {
        const values = [
            record.live ? 'LIVE' : 'Pre',
            record.book || '',
            this.formatGameName(record),
            record.display_name || record.market_type || '',
            record.outcome_type || '',
            record.ev ? (record.ev * 100).toFixed(2) + '%' : '',
            record.american_odds || '',
            record.true_prob ? (record.true_prob * 100).toFixed(1) + '%' : '',
            record.spread || '',
            record.sport || '',
            
            record.deeplink ? 'Bet' : '',
            'Chart',
            this.formatTimestamp(record.last_ts)
        ];
        return values[colIndex] || '';
    }

    getSortValue(record, column) {
        switch (column) {
            case 'status': return record.live ? 1 : 0;
            case 'book': return record.book || '';
            case 'game': return this.formatGameName(record);
            case 'market': return record.display_name || record.market_type || '';
            case 'outcome_type': return record.outcome_type || '';
            case 'ev': return record.ev || -999;
            case 'odds': return parseInt(record.american_odds) || 0;
            case 'prob': return record.true_prob || 0;
            case 'spread': return parseFloat(record.spread) || 0;
            case 'sport': return record.sport || '';
           
            case 'time': return this.getTimestampValue(record.last_ts);
            default: return '';
        }
    }
}