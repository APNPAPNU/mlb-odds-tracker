import { DataManager } from './data-manager.js';
import { FilterManager } from './filter-manager.js';
import { UIRenderer } from './ui-renderer.js';
import { ArbitrageAnalyzer } from './arbitrage-analyzer.js';
import { ArbitrageRenderer } from './arbitrage-renderer.js';
import { MobileHandler } from './mobile-handler.js';
import { RefreshManager } from './refresh-manager.js';
import { UtilityFunctions } from './utility-functions.js';
import { DebugUtils } from './debug-utils.js';
import { EventManager } from './event-manager.js';

export class BettingDataAnalyzer {
    constructor() {
        // Initialize all managers
        this.dataManager = new DataManager();
        this.filterManager = new FilterManager();
        this.uiRenderer = new UIRenderer();
        this.arbitrageAnalyzer = new ArbitrageAnalyzer();
        this.arbitrageRenderer = new ArbitrageRenderer();
        this.mobileHandler = new MobileHandler();
        this.refreshManager = new RefreshManager();
        this.utilityFunctions = new UtilityFunctions();
        this.debugUtils = new DebugUtils();
        this.eventManager = new EventManager();
        
        // Share references so all managers can access shared state
        this.shareReferences();
    }

    shareReferences() {
        // Give each manager access to shared data and other managers
        const managers = [
            this.dataManager, this.filterManager, this.uiRenderer,
            this.arbitrageAnalyzer, this.arbitrageRenderer, this.mobileHandler,
            this.refreshManager, this.utilityFunctions, this.debugUtils,
            this.eventManager
        ];

        managers.forEach(manager => {
            manager.mainController = this;
            manager.dataManager = this.dataManager;
            manager.filterManager = this.filterManager;
            manager.uiRenderer = this.uiRenderer;
            manager.arbitrageAnalyzer = this.arbitrageAnalyzer;
            manager.arbitrageRenderer = this.arbitrageRenderer;
            manager.mobileHandler = this.mobileHandler;
            manager.refreshManager = this.refreshManager;
            manager.utilityFunctions = this.utilityFunctions;
            manager.debugUtils = this.debugUtils;
            manager.eventManager = this.eventManager;
        });
    }

    // PASTE YOUR init() METHOD HERE
    async init() {
        // Your existing init code goes here
    }

    // Proxy methods - these delegate to the appropriate managers
    async fetchData() { return this.dataManager.fetchData(); }
    applyFilters() { return this.filterManager.applyFilters(); }
    renderTable() { return this.uiRenderer.renderTable(); }
    findArbitrageOpportunities(data) { return this.arbitrageAnalyzer.findArbitrageOpportunities(data); }
    showArbitrageOpportunities() { return this.arbitrageRenderer.showArbitrageOpportunities(); }
    toggleArbitrageView() { return this.arbitrageRenderer.toggleArbitrageView(); }
    exportToCSV() { return this.utilityFunctions.exportToCSV(); }
    startAutoRefresh() { return this.refreshManager.startAutoRefresh(); }
    stopAutoRefresh() { return this.refreshManager.stopAutoRefresh(); }
    updateStatus(text, type) { return this.uiRenderer.updateStatus(text, type); }
    formatTimestampEST(date) { return this.utilityFunctions.formatTimestampEST(date); }
    destroy() { return this.eventManager.destroy(); }

    // ADD ANY OTHER METHODS YOU NEED TO KEEP IN THE MAIN CLASS
}