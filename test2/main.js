import { BettingDataAnalyzer } from './main-controller.js';

// Initialize the application
const analyzer = new BettingDataAnalyzer();
analyzer.init();

// Export for global access if needed
window.bettingAnalyzer = analyzer;