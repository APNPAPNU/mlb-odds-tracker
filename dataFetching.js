export async function fetchOpenOddsData() {
    const livePayload = {
        keys: ["ev_stream"],
        filters: {
            filtered_sportsbooks: ["DRAFTKINGS","FANDUEL","BETMGM","CAESARS","ESPN","HARDROCK","BALLYBET","BETONLINE","BET365","FANATICS","FLIFF", "NONE"],
            must_have_sportsbooks: [""]
        },
        filter: {}
    };

    const prematchPayload = {
        keys: ["ev_stream_prematch"],
        filters: {
            filtered_sportsbooks: ["DRAFTKINGS","FANDUEL","BETMGM","CAESARS","ESPN","HARDROCK","BALLYBET","BETONLINE","BET365","FANATICS","FLIFF","NONE"],
            must_have_sportsbooks: [""]
        },
        filter: {}
    };

    try {
        const [liveResponse, prematchResponse] = await Promise.all([
            fetch('https://api.openodds.gg/getData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify(livePayload)
            }),
            fetch('https://api.openodds.gg/getData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                body: JSON.stringify(prematchPayload)
            })
        ]);

        const liveData = liveResponse.ok ? await liveResponse.json() : [];
        const prematchData = prematchResponse.ok ? await prematchResponse.json() : [];

        liveData.forEach(item => item._is_live = true);
        prematchData.forEach(item => item._is_live = false);

        return [...liveData, ...prematchData];
    } catch (error) {
        console.error('OpenOdds数据错误:', error);
        return [];
    }
}

export async function fetchCloudfrontData() {
    try {
        const response = await fetch('https://d6ailk8q6o27n.cloudfront.net/livegames');
        if (!response.ok) return [];
        
        const data = await response.json();
        if (data.body) {
            const games = [];
            if (data.body.prematch_games) games.push(...data.body.prematch_games);
            if (data.body.live_games) games.push(...data.body.live_games);
            return games;
        }
        return [];
    } catch (error) {
        console.error('Cloudfront数据错误:', error);
        return [];
    }
}

export async function fetchAWSData() {
    const sports = ["basketball", "baseball", "football", "soccer", "hockey","tennis"];
    let allData = {};

    for (const sport of sports) {
        try {
            const response = await fetch(`https://49pzwry2rc.execute-api.us-east-1.amazonaws.com/prod/getLiveGames?sport=${sport}&live=false`);
            if (response.ok) {
                const data = await response.json();
                const games = data.body || data;
                Object.assign(allData, games);
            }
        } catch (error) {
            console.error(`AWS ${sport}数据错误:`, error);
        }
    }

    return allData;
}

export async function processData(openoddsData, cloudfrontData, awsData) {
    const processed = [];
    const gameInfoCache = new Map();

    for (const item of openoddsData) {
        if (item.channel && item.channel.includes("ev_stream") && item.payload) {
            for (const payloadItem of item.payload) {
                try {
                    const record = {
                        live: item._is_live || false,
                        outcome_id: payloadItem.outcome_id,
                        book: payloadItem.book,
                        spread: payloadItem.spread,
                        message: payloadItem.message,
                        ev: payloadItem.ev_model?.ev,
                        last_ts: payloadItem.ev_model?.last_ts,
                        american_odds: payloadItem.ev_model?.american_odds,
                        true_prob: payloadItem.ev_model?.true_prob,
                        deeplink: payloadItem.ev_model?.deeplink,
                        ev_spread: payloadItem.ev_model?.spread
                    };

                    let gameInfo;
                    if (gameInfoCache.has(record.outcome_id)) {
                        gameInfo = gameInfoCache.get(record.outcome_id);
                    } else {
                        gameInfo = findGameInfo(record.outcome_id, cloudfrontData, awsData);
                        gameInfoCache.set(record.outcome_id, gameInfo);
                    }
                    
                    Object.assign(record, gameInfo);

                    if (record.outcome_id && !record._needsAdditionalLookup) {
                        processed.push(record);
                    }
                } catch (error) {
                    console.error('Processing record error:', error);
                }
            }
        }
    }

    return processed;
}

export function findGameInfo(outcomeId, cloudfrontData, awsData) {
    const info = {};
    
    for (const game of cloudfrontData) {
        if (game.markets) {
            for (const [marketId, market] of Object.entries(game.markets)) {
                if (market.outcomes) {
                    for (const outcome of Object.values(market.outcomes)) {
                        const cleanOutcomeId = outcome.outcome_id.replace(/_ALT$/, '');
                        const cleanSearchId = outcomeId.replace(/_ALT$/, '');
                        
                        if (outcome.outcome_id === outcomeId || cleanOutcomeId === cleanSearchId) {
                            info.market_id = marketId;
                            info.market_type = market.market_type;
                            info.display_name = market.display_name;
                            info.game_name = game.game_name;
                            info.home_team = game.home_team;
                            info.away_team = game.away_team;
                            info.sport = game.sport;
                            info.player_1 = game.player_1;
                            info.player_2 = game.player_2;
                            info.outcome_type = outcome.outcome_type;
                            
                            if (info.market_id && awsData) {
                                for (const [gameId, awsGame] of Object.entries(awsData)) {
                                    if (awsGame.markets && awsGame.markets[info.market_id]) {
                                        info.aws_game_date = awsGame.game_date;
                                        break;
                                    }
                                }
                            }
                            
                            return info;
                        }
                    }
                }
            }
        }
    }
    
    console.log(`❌ No match found in cloudfrontData for outcome_id: ${outcomeId}`);
    info._needsAdditionalLookup = true;
    info.outcome_id = outcomeId;
    return info;
}

export async function findGameInfoFromCloudfront(outcomeId) {
    try {
        console.log(`🔍 Making additional CloudFront call for outcome_id: ${outcomeId}`);
        
        const response = await fetch('https://d6ailk8q6o27n.cloudfront.net/livegames');
        if (!response.ok) {
            console.log(`❌ CloudFront API call failed with status: ${response.status}`);
            return {};
        }
        
        const data = await response.json();
        const allGames = [];
        
        if (data.body) {
            if (data.body.prematch_games) allGames.push(...data.body.prematch_games);
            if (data.body.live_games) allGames.push(...data.body.live_games);
        }
        
        console.log(`📊 Checking ${allGames.length} games from additional CloudFront call`);
        
        for (const game of allGames) {
            if (game.markets) {
                for (const [marketId, market] of Object.entries(game.markets)) {
                    if (market.outcomes) {
                        for (const outcome of Object.values(market.outcomes)) {
                            if (outcome.outcome_id === outcomeId) {
                                console.log(`✅ Found match in additional CloudFront call for ${outcomeId}`);
                                
                                return {
                                    market_id: marketId,
                                    market_type: market.market_type,
                                    display_name: market.display_name,
                                    game_name: game.game_name,
                                    home_team: game.home_team,
                                    away_team: game.away_team,
                                    sport: game.sport,
                                    player_1: game.player_1,
                                    player_2: game.player_2,
                                    outcome_type: outcome.outcome_type
                                };
                            }
                        }
                    }
                }
            }
        }
        
        console.log(`❌ Still no match found in additional CloudFront call for outcome_id: ${outcomeId}`);
        return {};
    } catch (error) {
        console.error('Error fetching additional game info:', error);
        return {};
    }
}