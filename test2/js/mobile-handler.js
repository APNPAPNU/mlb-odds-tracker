export class MobileHandler {
    constructor() {
        this.isMobileView = false;
    }
        setupMobileHandlers() {
    // Add null checks to prevent errors
    const toggleFilters = document.getElementById('toggleFilters');
    const toggleView = document.getElementById('toggleView');
    const filterControls = document.getElementById('filterControls');
    const desktopTable = document.getElementById('dataTable');
    const mobileCards = document.getElementById('mobileCards');
    
    // Check if all required elements exist
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
    
    // Initialize mobile view state
    let isMobileView = window.innerWidth <= 768;
    
    // Toggle filters visibility
    toggleFilters.addEventListener('click', () => {
        const isVisible = filterControls.style.display === 'flex';
        filterControls.style.display = isVisible ? 'none' : 'flex';
        toggleFilters.classList.toggle('active', !isVisible);
    });
    
    // Toggle between desktop and mobile view
    toggleView.addEventListener('click', () => {
        isMobileView = !isMobileView;
        
        if (isMobileView) {
            // Show mobile view
            desktopTable.style.display = 'none';
            mobileCards.style.display = 'flex';
            toggleView.textContent = '🖥️ Desktop';
            toggleView.classList.add('active');
        } else {
            // Show desktop view
            desktopTable.style.display = 'table';
            mobileCards.style.display = 'none';
            toggleView.textContent = '📱 Mobile';
            toggleView.classList.remove('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const windowWidth = window.innerWidth;
        
        if (windowWidth <= 768) {
            // Force mobile view on small screens
            if (!isMobileView) {
                isMobileView = true;
                desktopTable.style.display = 'none';
                mobileCards.style.display = 'flex';
                toggleView.textContent = '🖥️ Desktop';
                toggleView.classList.add('active');
            }
        } else {
            // Auto-switch to desktop view on large screens if not manually overridden
            if (isMobileView && windowWidth > 1024) {
                isMobileView = false;
                desktopTable.style.display = 'table';
                mobileCards.style.display = 'none';
                toggleView.textContent = '📱 Mobile';
                toggleView.classList.remove('active');
            }
        }
    });
    
    // Initial setup based on screen size
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
    
    // Initially hide filters on mobile
    if (window.innerWidth <= 768) {
        filterControls.style.display = 'none';
    }
}
handleVisibilityChange() {
        if (document.hidden) {
            this.stopAutoRefresh();
            this.updateStatus('Paused (hidden)', 'paused');
        } else if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
            this.updateStatus('Resumed', 'success');
            this.fetchData();
        }
    }
}