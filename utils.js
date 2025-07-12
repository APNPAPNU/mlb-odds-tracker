export function formatGameName(record) {
    const home = record.player_1 || record.home_team;
    const away = record.player_2 || record.away_team;
    
    if (home && away) {
        return `${home} vs ${away}`;
    }
    
    if (record.game_name) return record.game_name;
    
    console.log(`⚠️ Unknown Game for outcome_id: ${record.outcome_id}`, {
        game_name: record.game_name,
        home_team: record.home_team,
        away_team: record.away_team,
        player_1: record.player_1,
        player_2: record.player_2,
        sport: record.sport,
        display_name: record.display_name,
        market_type: record.market_type
    });
    
    return 'Unknown Game';
}

export function formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    
    try {
        let date;
        if (typeof timestamp === 'string' && timestamp.includes('T')) {
            date = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp * 1000);
        } else {
            return '-';
        }
        
        if (isNaN(date.getTime())) return '-';
        
        return formatTimestampEST(date);
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return '-';
    }
}

export function formatTimestampEST(date) {
    try {
        const adjustedDate = new Date(date.getTime() - 4 * 60 * 60 * 1000);
        return adjustedDate.toLocaleTimeString('en-US', {
            timeZone: 'America/New_York',
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}

export function getTimestampValue(timestamp) {
    if (!timestamp) return 0;
    
    try {
        if (typeof timestamp === 'string' && timestamp.includes('T')) {
            return new Date(timestamp).getTime();
        } else if (typeof timestamp === 'number') {
            return timestamp * 1000;
        }
        return 0;
    } catch (error) {
        return 0;
    }
}

export function getBookLogo(bookName) {
    const logoMap = {
        'DRAFTKINGS': 'logos/draftkings-logo.png',
        'FANDUEL': 'logos/fanduel-logo.png', 
        'BETMGM': 'logos/betmgm-logo.png',
        'CAESARS': 'logos/caesars-logo.png',
        'ESPN': 'logos/espn-bet-logo.jpeg',
        'HARDROCK': 'logos/hardrock-logo.jpg',
        'BALLYBET': 'logos/ballybet-logo.png',
        'BETONLINE': 'logos/betonline-logo.png',
        'BET365': 'logos/bet365-logo.png',
        'FANATICS': 'logos/fanatics-logo.png',
        'FLIFF': 'logos/fliff-logo.png'
    };
    
    const normalizedBook = bookName ? bookName.toUpperCase() : '';
    return logoMap[normalizedBook] || null;
}

export function getBookInitials(bookName) {
    if (!bookName) return 'UK';
    
    const initials = {
        'DRAFTKINGS': 'DK',
        'FANDUEL': 'FD',
        'BETMGM': 'MGM',
        'CAESARS': 'CZR',
        'ESPN': 'ESPN',
        'HARDROCK': 'HR',
        'BALLYBET': 'BB',
        'BETONLINE': 'BOL',
        'BET365': '365',
        'FANATICS': 'FAN',
        'FLIFF': 'FLF'
    };
    
    return initials[bookName.toUpperCase()] || bookName.substring(0, 3).toUpperCase();
}

export function showError(message) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="12" class="error-message">${message}</td></tr>`;
    
    const mobileCards = document.getElementById('mobileCards');
    mobileCards.innerHTML = `<div class="error-card">${message}</div>`;
}

export function updateCounts() {
    const totalRecords = this.filteredData.length;
    const liveCount = this.filteredData.filter(d => d.live).length;
    const prematchCount = totalRecords - liveCount;

    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('liveCount').textContent = liveCount;
    document.getElementById('prematchCount').textContent = prematchCount;
}