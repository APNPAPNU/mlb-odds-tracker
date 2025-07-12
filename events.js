import { showArbitrageOpportunities } from './arbitrage.js';

export function setupEventListeners() {
    ['bookFilter', 'sportFilter', 'evFilter', 'liveFilter', 'searchFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => this.applyFilters());
        document.getElementById(id).addEventListener('input', () => this.applyFilters());
    });

    document.getElementById('refreshToggle').addEventListener('change', (e) => {
        this.autoRefreshEnabled = e.target.checked;
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
            this.updateStatus('Auto refresh enabled', 'success');
        } else {
            this.stopAutoRefresh();
            this.updateStatus('Auto refresh paused', 'paused');
        }
    });

    document.getElementById('refreshInterval').addEventListener('change', (e) => {
        this.refreshIntervalTime = parseInt(e.target.value) * 1000;
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
        }
    });

    window.addEventListener('resize', () => {
        const wasMobile = this.isMobileView;
        this.isMobileView = window.innerWidth <= 768;
        if (wasMobile !== this.isMobileView) {
            this.renderTable();
        }
    });
}

export function setupMobileHandlers() {
    const toggleFilters = document.getElementById('toggleFilters');
    const toggleView = document.getElementById('toggleView');
    const filterControls = document.getElementById('filterControls');
    const desktopTable = document.getElementById('dataTable');
    const mobileCards = document.getElementById('mobileCards');
    
    if (!toggleFilters || !toggleView || !filterControls || !desktopTable || !mobileCards) {
        console.error('Required mobile elements not found:', {
            toggleFilters: !!toggleFilters,
            toggleView: !!toggleView,
            filterControls: !!filterControls,
            desktopTable: !!desktopTable,
            mobileCards: !!mobileCards
        });
        return;
    }
    
    let isMobileView = window.innerWidth <= 768;
    
    toggleFilters.addEventListener('click', () => {
        const isVisible = filterControls.style.display === 'flex';
        filterControls.style.display = isVisible ? 'none' : 'flex';
        toggleFilters.classList.toggle('active', !isVisible);
    });
    
    toggleView.addEventListener('click', () => {
        isMobileView = !isMobileView;
        
        if (isMobileView) {
            desktopTable.style.display = 'none';
            mobileCards.style.display = 'flex';
            toggleView.textContent = '🖥️ Desktop';
            toggleView.classList.add('active');
        } else {
            desktopTable.style.display = 'table';
            mobileCards.style.display = 'none';
            toggleView.textContent = '📱 Mobile';
            toggleView.classList.remove('active');
        }
        
        this.renderTable();
    });
    
    window.addEventListener('resize', () => {
        const windowWidth = window.innerWidth;
        
        if (windowWidth <= 768) {
            if (!isMobileView) {
                isMobileView = true;
                desktopTable.style.display = 'none';
                mobileCards.style.display = 'flex';
                toggleView.textContent = '🖥️ Desktop';
                toggleView.classList.add('active');
                this.renderTable();
            }
        } else {
            if (isMobileView && windowWidth > 1024) {
                isMobileView = false;
                desktopTable.style.display = 'table';
                mobileCards.style.display = 'none';
                toggleView.textContent = '📱 Mobile';
                toggleView.classList.remove('active');
                this.renderTable();
            }
        }
    });
    
    if (isMobileView) {
        desktopTable.style.display = 'none';
        mobileCards.style.display = 'flex';
        toggleView.textContent = '🖥️ Desktop';
        toggleView.classList.add('active');
    } else {
        desktopTable.style.display = 'table';
        mobileCards.style.display = 'none';
        toggleView.textContent = '📱 Mobile';
        toggleView.classList.remove('active');
    }
    
    if (window.innerWidth <= 768) {
        filterControls.style.display = 'none';
    }
}

export function toggleArbitrageView() {
    console.log('DEBUG: toggleArbitrageView called, this:', this);
    console.log('DEBUG: showArbitrageOpportunities available:', typeof this.showArbitrageOpportunities);
    
    const currentView = document.getElementById('currentView').textContent;
    const arbitrageBtn = document.getElementById('arbitrageToggle');
    
    if (currentView === 'regular') {
        if (typeof this.showArbitrageOpportunities !== 'function') {
            console.error('ERROR: showArbitrageOpportunities is not a function');
            return;
        }
        this.showArbitrageOpportunities();
        document.getElementById('currentView').textContent = 'arbitrage';
        arbitrageBtn.textContent = '📊 Regular View';
        arbitrageBtn.style.background = '#e74c3c';
    } else {
        this.renderTable();
        document.getElementById('currentView').textContent = 'regular';
        arbitrageBtn.textContent = '🔄 Arbitrage View';
        arbitrageBtn.style.background = '#9b59b6';
    }
}

export function handleVisibilityChange() {
    if (document.hidden) {
        this.stopAutoRefresh();
        this.updateStatus('Paused (hidden)', 'paused');
    } else if (this.autoRefreshEnabled) {
        this.startAutoRefresh();
        this.updateStatus('Resumed', 'success');
        this.fetchData();
    }
}
