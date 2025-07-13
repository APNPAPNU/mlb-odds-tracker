export class ArbitrageAnalyzer {
    findArbitrageOpportunities(data) {
    console.log('🔍 Starting arbitrage analysis...');
    console.log(`📊 Total records to analyze: ${data.length}`);
    
    const arbitrageOpportunities = [];
    const marketGroups = {};
    
    // Group by TRUE market (game + market_type + spread combination)
    // NOT by outcome_id since different outcomes have different outcome_ids
    data.forEach(record => {
        // Create a market key based on the actual market, not outcome_id
        const gameKey = this.formatGameName(record);
        const marketType = record.display_name || record.market_type || 'Unknown';
        const spreadKey = record.spread || 'no-spread';
        
        // This groups the same market together regardless of outcome type
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
        
        // Group by outcome_type within the market
        if (!marketGroups[marketKey].outcomes[record.outcome_type]) {
            marketGroups[marketKey].outcomes[record.outcome_type] = [];
        }
        
        marketGroups[marketKey].outcomes[record.outcome_type].push(record);
    });
    
    console.log(`🎯 Found ${Object.keys(marketGroups).length} unique markets`);
    
    // Analyze each market for arbitrage
    Object.entries(marketGroups).forEach(([marketKey, market]) => {
        const outcomeTypes = Object.keys(market.outcomes);
        console.log(`\n🏟️ Market: ${market.game_name} - ${market.display_name}`);
        console.log(`📈 Outcome types: ${outcomeTypes.join(', ')}`);
        
        // Need at least 2 different outcome types for arbitrage
        if (outcomeTypes.length >= 2) {
            console.log(`✅ Market has ${outcomeTypes.length} outcomes - checking for arbitrage`);
            
            // Find best odds for each outcome type
            const bestOdds = {};
            outcomeTypes.forEach(outcomeType => {
                const outcomes = market.outcomes[outcomeType];
                console.log(`  📋 ${outcomeType}: ${outcomes.length} books available`);
                
                let bestOutcome = null;
                let bestImpliedProb = 1;
                
                outcomes.forEach(outcome => {
                    if (outcome.american_odds) {
                        const impliedProb = this.americanOddsToImpliedProbability(outcome.american_odds);
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
            
            // Check if we have at least 2 outcomes with odds
            const validOutcomes = Object.keys(bestOdds);
            if (validOutcomes.length >= 2) {
                // Calculate total implied probability
                const totalImpliedProb = validOutcomes.reduce((sum, outcomeType) => {
                    return sum + bestOdds[outcomeType].impliedProb;
                }, 0);
                
                console.log(`    📊 Total implied probability: ${(totalImpliedProb * 100).toFixed(2)}%`);
                
                // Calculate profit/loss regardless of whether it's positive
                const profitMargin = (1 - totalImpliedProb) / totalImpliedProb;
                const profitPercentage = profitMargin * 100;
                
                console.log(`    💰 Profit/Loss: ${profitPercentage.toFixed(2)}%`);
                
                // Always calculate stakes to show the scenario
                const arbitrage = this.calculateArbitrageStakes(bestOdds, 100);
                
                const opportunity = {
                    ...market,
                    bestOdds,
                    totalImpliedProb,
                    profit: profitPercentage,
                    stakes: arbitrage.stakes,
                    totalStake: arbitrage.totalStake,
                    guaranteedProfit: arbitrage.guaranteedProfit,
                    isArbitrage: totalImpliedProb < 1 // True if profitable
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
    
    // Sort by highest profit (positive first, then least negative)
    return arbitrageOpportunities.sort((a, b) => b.profit - a.profit);
}

// Convert American odds to implied probability
americanOddsToImpliedProbability(americanOdds) {
    const odds = parseInt(americanOdds);
    if (odds > 0) {
        return 100 / (odds + 100);
    } else {
        return Math.abs(odds) / (Math.abs(odds) + 100);
    }
}
// Calculate arbitrage stakes
calculateArbitrageStakes(bestOdds, totalBetAmount) {
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
            payout: this.calculatePayout(stake, bestOdds[outcomeType].outcome.american_odds)
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

// Calculate payout from stake and American odds
calculatePayout(stake, americanOdds) {
    const odds = parseInt(americanOdds);
    if (odds > 0) {
        return stake + (stake * odds / 100);
    } else {
        return stake + (stake * 100 / Math.abs(odds));
    }
}
}