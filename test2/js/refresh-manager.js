export class RefreshManager {
    constructor() {
        this.refreshInterval = null;
        this.refreshIntervalTime = 30000; // 30 seconds
        this.autoRefreshEnabled = false;
    }
      startAutoRefresh() {
        this.stopAutoRefresh();
        if (this.autoRefreshEnabled && !this.isLoading) {
            this.refreshInterval = setInterval(() => {
                if (!this.isLoading) {
                    this.fetchData();
                }
            }, this.refreshIntervalTime);
        }
    }
   stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}