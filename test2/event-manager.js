export class EventManager {
    
    setupEventListeners() {
        // 原有过滤器
        ['bookFilter', 'sportFilter', 'evFilter', 'liveFilter', 'searchFilter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.applyFilters());
            document.getElementById(id).addEventListener('input', () => this.applyFilters());
        });

        // 刷新控制
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

        // 窗口大小变化
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobileView;
            this.isMobileView = window.innerWidth <= 768;
            if (wasMobile !== this.isMobileView) {
                this.renderTable();
            }
        });
    }
    destroy() {
        this.stopAutoRefresh();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
}
