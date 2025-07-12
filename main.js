import { BettingDataScraper } from './BettingDataScraper.js';

let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new BettingDataScraper();
    
    document.addEventListener('visibilitychange', () => {
        dashboard.handleVisibilityChange();
    });

    const controls = document.querySelector('.controls');
    
    const currentView = document.createElement('span');
    currentView.id = 'currentView';
    currentView.textContent = 'regular';
    currentView.style.display = 'none';
    document.body.appendChild(currentView);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📊 Export';
    exportBtn.className = 'filter-input';
    exportBtn.style.background = '#2ecc71';
    exportBtn.style.color = 'white';
    exportBtn.style.border = 'none';
    exportBtn.style.cursor = 'pointer';
    exportBtn.onclick = () => dashboard.exportToCSV();
    
    const exportGroup = document.createElement('div');
    exportGroup.className = 'filter-group';
    exportGroup.appendChild(exportBtn);
    controls.appendChild(exportGroup);

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄 Refresh';
    refreshBtn.className = 'filter-input';
    refreshBtn.style.background = '#3498db';
    refreshBtn.style.color = 'white';
    refreshBtn.style.border = 'none';
    refreshBtn.style.cursor = 'pointer';
    refreshBtn.onclick = () => {
        if (!dashboard.isLoading) {
            dashboard.fetchData();
        }
    };
    
    const refreshGroup = document.createElement('div');
    refreshGroup.className = 'filter-group';
    refreshGroup.appendChild(refreshBtn);
    controls.appendChild(refreshGroup);

    const arbitrageBtn = document.createElement('button');
    arbitrageBtn.textContent = '🔄 Arbitrage View';
    arbitrageBtn.className = 'filter-input';
    arbitrageBtn.id = 'arbitrageToggle';
    arbitrageBtn.style.background = '#9b59b6';
    arbitrageBtn.style.color = 'white';
    arbitrageBtn.style.border = 'none';
    arbitrageBtn.style.cursor = 'pointer';
    arbitrageBtn.onclick = () => dashboard.toggleArbitrageView();
    
    const arbitrageGroup = document.createElement('div');
    arbitrageGroup.className = 'filter-group';
    arbitrageGroup.appendChild(arbitrageBtn);
    controls.appendChild(arbitrageGroup);

    window.addEventListener('beforeunload', () => {
        dashboard.destroy();
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('deeplink')) {
            const row = e.target.closest('tr');
            const link = row.dataset.link;
            if (link) {
                window.open(link, '_blank');
            }
        }
    });
});