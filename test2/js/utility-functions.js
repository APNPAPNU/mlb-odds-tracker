export class UtilityFunctions {
 // Helper method to convert UTC to Eastern Time and format for display
    formatTimestamp(timestamp) {
        if (!timestamp) return '-';
        
        try {
            let date;
            // Check if it's an ISO string or Unix timestamp
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                // ISO string format like "2025-07-03T00:06:05.732861"
                date = new Date(timestamp);
            } else if (typeof timestamp === 'number') {
                // Unix timestamp (seconds)
                date = new Date(timestamp * 1000);
            } else {
                return '-';
            }
            
            if (isNaN(date.getTime())) return '-';
            
            // Convert to Eastern Time (EST/EDT)
            return this.formatTimestampEST(date);
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return '-';
        }
    }

    // Helper method to format timestamp in Eastern Time
    formatTimestampEST(date) {
        try {
            // Subtract 4 hours (4 * 60 * 60 * 1000 milliseconds)
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

    // Helper method to get timestamp value for sorting (keep as UTC milliseconds)
    getTimestampValue(timestamp) {
        if (!timestamp) return 0;
        
        try {
            if (typeof timestamp === 'string' && timestamp.includes('T')) {
                // ISO string format
                return new Date(timestamp).getTime();
            } else if (typeof timestamp === 'number') {
                // Unix timestamp
                return timestamp * 1000;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }
     // Add this helper function to map book names to logos
getBookLogo(bookName) {
    const logoMap = {
        'DRAFTKINGS': 'logos/draftkings-logo.png',
        'FANDUEL': 'logos/fanduel-logo.png', 
        'BETMGM': 'logos/betmgm-logo.png',
        'CAESARS': 'logos/caesars-logo.png',
        'ESPN': 'logos/espn-bet-logo.jpeg',
        'HARDROCK': 'logos/hardrock-logo.jpg',
        'BALLYBET': 'logos/ballybet-logo.png', // You'll need to add this
        'BETONLINE': 'logos/betonline-logo.png', // You'll need to add this
        'BET365': 'logos/bet365-logo.png',
        'FANATICS': 'logos/fanatics-logo.png', // You'll need to add this
        'FLIFF': 'logos/fliff-logo.png' // You'll need to add this
    };
    
    const normalizedBook = bookName ? bookName.toUpperCase() : '';
    return logoMap[normalizedBook] || null;
}


// Add this helper method to get book initials
getBookInitials(bookName) {
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


formatGameName(record) {
    // Priority: Use player names if available, otherwise use team names
    const home = record.player_1 || record.home_team;
    const away = record.player_2 || record.away_team;
    
    if (home && away) {
        return `${home} vs ${away}`;
    }
    
    // Fallback to game_name if available
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

exportToCSV() {
    if (this.filteredData.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = [
        'Status', 'Book', 'Game', 'Market', 'Outcome Type', 'EV %', 'Odds', 
        'True Prob', 'Spread', 'Sport',  'Updated (EST)'
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
   openHistoricalChart(outcomeId, isLive, spread, record) {
    // Clean the outcome_id - remove _ALT suffix (case insensitive)
    const cleanOutcomeId = outcomeId.replace(/_alt$/i, '');
    
    // Get current timestamp
    const currentTimestamp = Date.now();
    
    // Build the URL
    let url = `https://49pzwry2rc.execute-api.us-east-1.amazonaws.com/prod/getHistoricalOdds?outcome_id=${cleanOutcomeId}&live=${isLive}&from=${currentTimestamp}`;
    
    console.log('Opening historical chart with URL:', url);
    
    // Prepare additional parameters to pass to the chart
    const chartParams = {
        api_url: url,
        game_name: encodeURIComponent(this.formatGameName(record)),
        market_name: encodeURIComponent(record.display_name || record.market_type || 'Unknown Market'),
        outcome_type: encodeURIComponent(record.outcome_type || 'Unknown Type'),
        ev_value: record.ev ? (record.ev * 100).toFixed(2) + '%' : 'N/A',
        book_name: encodeURIComponent(record.book || 'Unknown'),
        sport: encodeURIComponent(record.sport || 'Unknown'),
       
    };
    
    // Create URL with all parameters
    const paramString = Object.entries(chartParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    
    const templateUrl = `chart-template.html?${paramString}`;
    
    // Open in new window
    window.open(templateUrl, '_blank');
}
}
