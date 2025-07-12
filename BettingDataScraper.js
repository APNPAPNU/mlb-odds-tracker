import { fetchOpenOddsData, fetchCloudfrontData, fetchAWSData, processData, findGameInfo, findGameInfoFromCloudfront } from './dataFetching.js';
import { renderTable, renderDesktopTable, renderMobileCards, renderArbitrageDesktopTable, renderArbitrageMobileCards, groupDataByMarket } from './rendering.js';
import { findArbitrageOpportunities, debugDataStructure, debugMarketGrouping, calculateArbitrageStakes, americanOddsToImpliedProbability, calculatePayout } from './arbitrage.js';
import { applyFilters, updateFilterOptions, updateSelectOptions, setupColumnFilters, setupSorting, updateSortIndicators, getCellValue, getSortValue } from './filters.js';
import { formatGameName, formatTimestamp, formatTimestampEST, getTimestampValue, getBookLogo, getBookInitials, showError, updateCounts } from './utils.js';
import { setupEventListeners, setupMobileHandlers, toggleArbitrageView, handleVisibilityChange } from './events.js';

export class BettingDataScraper {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.refreshInterval = null;
        this.isLoading = false;
        this.refreshIntervalTime = 12000;
        this.autoRefreshEnabled = false;
        this.isMobileView = window.innerWidth <= 768;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.columnFilters = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileHandlers();
        this.setupColumnFilters();
        this.setupSorting();
        this.startAutoRefresh();
        this.fetchData();
    }

    // Data fetching methods
    async fetchData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.updateStatus('Fetching data...', 'loading');
        
        this.stopAutoRefresh();

        try {
            const [openoddsData, cloudfrontData, awsData] = await Promise.all([
                fetchOpenOddsData(),
                fetchCloudfrontData(),
                fetchAWSData()
            ]);

            this.data = await processData(openoddsData, cloudfrontData, awsData);
            this.updateFilterOptions();
            this.applyFilters();
            
            this.updateStatus(`Data updated`, 'success');
            document.getElementById('lastUpdate').textContent = `Last: ${this.formatTimestampEST(new Date())}`;
            
        } catch (error) {
            console.error('获取数据错误:', error);
            this.updateStatus('Error fetching data', 'error');
            this.showError('Failed to fetch betting data.');
        }
        
        this.isLoading = false;
        
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
        }
    }

    // Proxy imported methods to maintain `this` context
    setupEventListeners = setupEventListeners;
    setupMobileHandlers = setupMobileHandlers;
    setupColumnFilters = setupColumnFilters;
    setupSorting = setupSorting;
    updateSortIndicators = updateSortIndicators;
    startAutoRefresh = () => {
        this.stopAutoRefresh();
        if (this.autoRefreshEnabled && !this.isLoading) {
            this.refreshInterval = setInterval(() => {
                if (!this.isLoading) {
                    this.fetchData();
                }
            }, this.refreshIntervalTime);
        }
    };
    stopAutoRefresh = () => {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    };
    updateStatus = (text, type = 'loading') => {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${type}`;
        statusText.textContent = text;
    };
    fetchOpenOddsData = fetchOpenOddsData;
    fetchCloudfrontData = fetchCloudfrontData;
    fetchAWSData = fetchAWSData;
    processData = processData;
    findGameInfo = findGameInfo;
    findGameInfoFromCloudfront = findGameInfoFromCloudfront;
    renderTable = renderTable;
    renderDesktopTable = renderDesktopTable;
    renderMobileCards = renderMobileCards;
    renderArbitrageDesktopTable = renderArbitrageDesktopTable;
    renderArbitrageMobileCards = renderArbitrageMobileCards;
    groupDataByMarket = groupDataByMarket;
    findArbitrageOpportunities = findArbitrageOpportunities;
    debugDataStructure = debugDataStructure;
    debugMarketGrouping = debugMarketGrouping;
    calculateArbitrageStakes = calculateArbitrageStakes;
    americanOddsToImpliedProbability = americanOddsToImpliedProbability;
    calculatePayout = calculatePayout;
    applyFilters = applyFilters;
    updateFilterOptions = updateFilterOptions;
    updateSelectOptions = updateSelectOptions;
    getCellValue = getCellValue;
    getSortValue = getSortValue;
    formatGameName = formatGameName;
    formatTimestamp = formatTimestamp;
    formatTimestampEST = formatTimestampEST;
    getTimestampValue = getTimestampValue;
    getBookLogo = getBookLogo;
    getBookInitials = getBookInitials;
    showError = showError;
    updateCounts = updateCounts;
    toggleArbitrageView = toggleArbitrageView;
    handleVisibilityChange = handleVisibilityChange;

    openHistoricalChart(outcomeId, isLive, spread, record) {
        const cleanOutcomeId = outcomeId.replace(/_alt$/i, '');
        const currentTimestamp = Date.now();
        let url = `https://49pzwry2rc.execute-api.us-east-1.amazonaws.com/prod/getHistoricalOdds?outcome_id=${cleanOutcomeId}&live=${isLive}&from=${currentTimestamp}`;
        
        console.log('Opening historical chart with URL:', url);
        
        const chartParams = {
            api_url: url,
            game_name: encodeURIComponent(this.formatGameName(record)),
            market_name: encodeURIComponent(record.display_name || record.market_type || 'Unknown Market'),
            outcome_type: encodeURIComponent(record.outcome_type || 'Unknown Type'),
            ev_value: record.ev ? (record.ev * 100).toFixed(2) + '%' : 'N/A',
            book_name: encodeURIComponent(record.book || 'Unknown'),
            sport: encodeURIComponent(record.sport || 'Unknown'),
        };
        
        const paramString = Object.entries(chartParams)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        
        const templateUrl = `chart-template.html?${paramString}`;
        window.open(templateUrl, '_blank');
    }

    exportToCSV() {
        if (this.filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = [
            'Status', 'Book', 'Game', 'Market', 'Outcome Type', 'EV %', 'Odds', 
            'True Prob', 'Spread', 'Sport', 'Updated (EST)'
        ];

        const csvContent = [
            headers.join(','),
            ...this.filteredData.map(record => [
                record.live ? 'LIVE' : 'Pre',
                record.book || '',
                this.formatGameName(record).replace(/,/g, ';'),
                (record.display_name || record.market_type || '').replace(/,/g, ';'),
                record.outcome_type || '',
                record.ev ? (record.ev * 100).toFixed(2) + '%' : '',
                record.american_odds || '',
                record.true_prob ? (record.true_prob * 100).toFixed(1) + '%' : '',
                record.spread || '',
                record.sport || '',
                this.formatTimestamp(record.last_ts)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `betting_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    destroy() {
        this.stopAutoRefresh();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
}