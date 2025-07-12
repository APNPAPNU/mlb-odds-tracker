import { formatGameName } from './utils.js';
import { renderArbitrageDesktopTable, renderArbitrageMobileCards } from './rendering.js';

export function findArbitrageOpportunities(data) {
    console.log('🔍 Starting arbitrage analysis...');
    console.log(`📊 Total records to analyze: ${data.length}`);
    
    const arbitrageOpportunities = [];
    const marketGroups = {};
    
    data.forEach(record => {
        const gameKey = formatGameName(record);
        const marketType = record.display_name || record.market_type || 'Unknown';
        const spreadKey = record.spread || 'no-spread';
        
        const marketKey = `${gameKey}_${marketType}_${spreadKey}`;
        
        if (!marketGroups[marketKey]) {
            marketGroups[marketKey] = {
                game_name: gameKey,
                display_name: marketType,
                spread: record.spread,
                sport: record.sport,
                live: record.live,
                outcomes: {}
            };
        }
        
        if (!marketGroups[marketKey].outcomes[record.outcome_type]) {
            marketGroups[marketKey].outcomes[record.outcome_type] = [];
        }
        
        marketGroups[marketKey].outcomes[record.outcome_type].push(record);
    });
    
    console.log(`🎯 Found ${Object.keys(marketGroups).length} unique markets`);
    
    Object.entries(marketGroups).forEach(([marketKey, market]) => {
        const outcomeTypes = Object.keys(market.outcomes);
        console.log(`\n🏟️ Market: ${market.game_name} - ${market.display_name}`);
        console.log(`📈 Outcome types: ${outcomeTypes.join(', ')}`);
        
        if (outcomeTypes.length >= 2) {
            console.log(`✅ Market has ${outcomeTypes.length} outcomes - checking for arbitrage`);
            
            const bestOdds = {};
            outcomeTypes.forEach(outcomeType => {
                const outcomes = market.outcomes[outcomeType];
                console.log(`  📋 ${outcomeType}: ${outcomes.length} books available`);
                
                let bestOutcome = null;
                let bestImpliedProb = 1;
                
                outcomes.forEach(outcome => {
                    if (outcome.american_odds) {
                        const impliedProb = americanOddsToImpliedProbability(outcome.american_odds);
                        console.log(`    🏪 ${outcome.book}: ${outcome.american_odds} (${(impliedProb * 100).toFixed(2)}%)`);
                        
                        if (impliedProb < bestImpliedProb) {
                            bestImpliedProb = impliedProb;
                            bestOutcome = outcome;
                        }
                    } else {
                        console.log(`    ❌ ${outcome.book}: No odds available`);
                    }
                });
                
                if (bestOutcome) {
                    bestOdds[outcomeType] = {
                        outcome: bestOutcome,
                        impliedProb: bestImpliedProb
                    };
                    console.log(`    🎯 Best: ${bestOutcome.book} at ${bestOutcome.american_odds} (${(bestImpliedProb * 100).toFixed(2)}%)`);
                } else {
                    console.log(`    ❌ No valid odds found for ${outcomeType}`);
                }
            });
            
            const validOutcomes = Object.keys(bestOdds);
            if (validOutcomes.length >= 2) {
                const totalImpliedProb = validOutcomes.reduce((sum, outcomeType) => {
                    return sum + bestOdds[outcomeType].impliedProb;
                }, 0);
                
                console.log(`    📊 Total implied probability: ${(totalImpliedProb * 100).toFixed(2)}%`);
                
                const profitMargin = (1 - totalImpliedProb) / totalImpliedProb;
                const profitPercentage = profitMargin * 100;
                
                console.log(`    💰 Profit/Loss: ${profitPercentage.toFixed(2)}%`);
                
                const arbitrage = calculateArbitrageStakes(bestOdds, 100);
                
                const opportunity = {
                    ...market,
                    bestOdds,
                    totalImpliedProb,
                    profit: profitPercentage,
                    stakes: arbitrage.stakes,
                    totalStake: arbitrage.totalStake,
                    guaranteedProfit: arbitrage.guaranteedProfit,
                    isArbitrage: totalImpliedProb < 1
                };
                
                arbitrageOpportunities.push(opportunity);
                
                if (totalImpliedProb < 1) {
                    console.log(`    🎉 ARBITRAGE FOUND! Profit: ${profitPercentage.toFixed(2)}%`);
                } else {
                    console.log(`    📉 No arbitrage - would lose: ${Math.abs(profitPercentage).toFixed(2)}%`);
                }
            } else {
                console.log(`    ❌ Not enough valid outcomes (${validOutcomes.length}/2)`);
            }
        } else {
            console.log(`    ❌ Not enough outcome types (${outcomeTypes.length}/2)`);
        }
    });
    
    console.log(`\n📈 Analysis complete:`);
    console.log(`   Total opportunities: ${arbitrageOpportunities.length}`);
    console.log(`   Profitable arbitrages: ${arbitrageOpportunities.filter(op => op.isArbitrage).length}`);
    console.log(`   Unprofitable scenarios: ${arbitrageOpportunities.filter(op => !op.isArbitrage).length}`);
    
    return arbitrageOpportunities.sort((a, b) => b.profit - a.profit);
}

export function showArbitrageOpportunities() {
    const opportunities = findArbitrageOpportunities(this.filteredData);
    if (this.isMobileView) {
        renderArbitrageMobileCards(opportunities);
    } else {
        renderArbitrageDesktopTable(opportunities);
    }
}

export function debugDataStructure() {
    console.log('\n🔍 DATA STRUCTURE ANALYSIS:');
    
    if (this.filteredData.length > 0) {
        const sample = this.filteredData[0];
        console.log('Sample record keys:', Object.keys(sample));
        console.log('Sample record:', sample);
        
        const requiredFields = ['outcome_id', 'outcome_type', 'american_odds', 'book'];
        requiredFields.forEach(field => {
            const hasField = this.filteredData.filter(d => d[field] !== undefined).length;
            console.log(`${field}: ${hasField}/${this.filteredData.length} records have this field`);
        });
        
        const outcomeTypes = new Set(this.filteredData.map(d => d.outcome_type).filter(Boolean));
        console.log('Unique outcome types:', [...outcomeTypes]);
        
        const outcomeIds = new Set(this.filteredData.map(d => d.outcome_id).filter(Boolean));
        console.log(`Unique outcome IDs: ${outcomeIds.size}`);
        
        const books = new Set(this.filteredData.map(d => d.book).filter(Boolean));
        console.log('Available books:', [...books]);
    } else {
        console.log('❌ No filtered data available');
    }
}

export function debugMarketGrouping() {
    console.log('\n🔍 MARKET GROUPING DEBUG:');
    
    const sampleRecords = this.filteredData.slice(0, 10);
    sampleRecords.forEach((record, index) => {
        console.log(`Record ${index + 1}:`, {
            outcome_id: record.outcome_id,
            outcome_type: record.outcome_type,
            market_type: record.market_type,
            spread: record.spread,
            american_odds: record.american_odds,
            book: record.book,
            display_name: record.display_name
        });
    });
    
    const spreadMarkets = this.filteredData.filter(d => 
        d.market_type === 'spread' || 
        (d.outcome_type && (d.outcome_type.includes('COVERS') || d.outcome_type.includes('SPREAD')))
    );
    
    console.log(`\n📊 Found ${spreadMarkets.length} spread-related records`);
    
    const outcomeGroups = {};
    spreadMarkets.forEach(record => {
        if (!outcomeGroups[record.outcome_id]) {
            outcomeGroups[record.outcome_id] = {};
        }
        if (!outcomeGroups[record.outcome_id][record.outcome_type]) {
            outcomeGroups[record.outcome_id][record.outcome_type] = [];
        }
        outcomeGroups[record.outcome_id][record.outcome_type].push(record);
    });
    
    console.log('\n📋 Outcome grouping for spread markets:');
    Object.entries(outcomeGroups).forEach(([outcomeId, outcomes]) => {
        const outcomeTypes = Object.keys(outcomes);
        console.log(`${outcomeId}: ${outcomeTypes.join(', ')} (${outcomeTypes.length} types)`);
        
        if (outcomeTypes.length >= 2) {
            console.log(`  ✅ This should create an arbitrage opportunity!`);
        }
    });
}

export function calculateArbitrageStakes(bestOdds, totalBetAmount) {
    const stakes = {};
    const outcomeTypes = Object.keys(bestOdds);
    let totalStake = 0;
    
    outcomeTypes.forEach(outcomeType => {
        const impliedProb = bestOdds[outcomeType].impliedProb;
        const stake = totalBetAmount * impliedProb;
        stakes[outcomeType] = {
            stake: stake,
            book: bestOdds[outcomeType].outcome.book,
            odds: bestOdds[outcomeType].outcome.american_odds,
            payout: calculatePayout(stake, bestOdds[outcomeType].outcome.american_odds)
        };
        totalStake += stake;
    });
    
    const guaranteedProfit = Object.values(stakes)[0].payout - totalStake;
    
    return {
        stakes,
        totalStake,
        guaranteedProfit
    };
}

export function americanOddsToImpliedProbability(americanOdds) {
    const odds = parseInt(americanOdds);
    if (odds > 0) {
        return 100 / (odds + 100);
    } else {
        return Math.abs(odds) / (Math.abs(odds) + 100);
    }
}

export function calculatePayout(stake, americanOdds) {
    const odds = parseInt(americanOdds);
    if (odds > 0) {
        return stake + (stake * odds / 100);
    } else {
        return stake + (stake * 100 / Math.abs(odds));
    }
}
