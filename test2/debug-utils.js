export class DebugUtils {
    debugDataStructure() {
    console.log('\n🔍 DATA STRUCTURE ANALYSIS:');
    
    if (this.filteredData.length > 0) {
        const sample = this.filteredData[0];
        console.log('Sample record keys:', Object.keys(sample));
        console.log('Sample record:', sample);
        
        // Check for required fields
        const requiredFields = ['outcome_id', 'outcome_type', 'american_odds', 'book'];
        requiredFields.forEach(field => {
            const hasField = this.filteredData.filter(d => d[field] !== undefined).length;
            console.log(`${field}: ${hasField}/${this.filteredData.length} records have this field`);
        });
        
        // Check outcome types
        const outcomeTypes = new Set(this.filteredData.map(d => d.outcome_type).filter(Boolean));
        console.log('Unique outcome types:', [...outcomeTypes]);
        
        // Check outcome IDs
        const outcomeIds = new Set(this.filteredData.map(d => d.outcome_id).filter(Boolean));
        console.log(`Unique outcome IDs: ${outcomeIds.size}`);
        
        // Check books
        const books = new Set(this.filteredData.map(d => d.book).filter(Boolean));
        console.log('Available books:', [...books]);
    } else {
        console.log('❌ No filtered data available');
    }
}
debugMarketGrouping() {
    console.log('\n🔍 MARKET GROUPING DEBUG:');
    
    if (this.filteredData.length > 0) {
        // Sample some records to see the structure
        const sampleRecords = this.filteredData.slice(0, 10);
        
        sampleRecords.forEach((record, index) => {
            console.log(`Record ${index + 1}:`);
            console.log(`  Game: ${this.formatGameName(record)}`);
            console.log(`  Market: ${record.display_name || record.market_type}`);
            console.log(`  Spread: ${record.spread || 'none'}`);
            console.log(`  Outcome Type: ${record.outcome_type}`);
            console.log(`  Outcome ID: ${record.outcome_id}`);
            console.log(`  Book: ${record.book}`);
            console.log(`  Odds: ${record.american_odds}`);
            console.log('---');
        });
        
        // Check for spread betting pairs
        const spreadBets = this.filteredData.filter(d => 
            d.outcome_type === 'AWAY_COVERS' || d.outcome_type === 'HOME_COVERS'
        );
        
        if (spreadBets.length > 0) {
            console.log('\n📊 SPREAD BETTING ANALYSIS:');
            
            // Group spread bets by game and spread
            const spreadGroups = {};
            spreadBets.forEach(bet => {
                const gameKey = this.formatGameName(bet);
                const spreadKey = bet.spread || 'no-spread';
                const groupKey = `${gameKey}_${spreadKey}`;
                
                if (!spreadGroups[groupKey]) {
                    spreadGroups[groupKey] = {
                        game: gameKey,
                        spread: bet.spread,
                        away_covers: [],
                        home_covers: []
                    };
                }
                
                if (bet.outcome_type === 'AWAY_COVERS') {
                    spreadGroups[groupKey].away_covers.push(bet);
                } else if (bet.outcome_type === 'HOME_COVERS') {
                    spreadGroups[groupKey].home_covers.push(bet);
                }
            });
            
            Object.entries(spreadGroups).forEach(([groupKey, group]) => {
                console.log(`\n🏈 ${group.game} (${group.spread}):`);
                console.log(`  AWAY_COVERS: ${group.away_covers.length} books`);
                console.log(`  HOME_COVERS: ${group.home_covers.length} books`);
                
                if (group.away_covers.length > 0 && group.home_covers.length > 0) {
                    console.log(`  ✅ Has both sides - should be arbitrage candidate!`);
                } else {
                    console.log(`  ❌ Missing one side - no arbitrage possible`);
                }
            });
        }
    }
}
}
