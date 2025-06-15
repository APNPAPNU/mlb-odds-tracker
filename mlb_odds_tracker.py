```python
import requests
import json
import time
from datetime import datetime
import logging
from github import Github
from flask import Flask, jsonify
from flask_cors import CORS
import os
import base64

# Flask app setup
app = Flask(__name__)
CORS(app, resources={r"/odds": {"origins": "https://apnpapnu.github.io"}})  # Allow GitHub Pages domain

# GitHub Credentials
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # Set in Render's environment variables
GITHUB_USERNAME = "APNPAPNU"
REPO_NAME = "mlb-odds-tracker"
GITHUB_EMAIL = "jcpgraphicdesign@gmail.com"
GITHUB_NAME = "apnu"

# API Configuration
API_URL = "https://oddsjam.com/api/backend/oddscreen/v2/game/data"
PARAMS = {
    "sport": "baseball",
    "league": "mlb",
    "state": "TN",
    "market_name": "moneyline",
    "is_future": "0",
    "game_status_filter": "All",
    "show_paywall": "false",
    "paywall": "false",
    "premium": "false",
    "subscription": "false"
}
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

# Configuration
UPDATE_INTERVAL = 30  # seconds
MAX_DATA_POINTS = 50  # Keep last 50 updates

# Global state
odds_data = []
price_changes = []
update_count = 0

# Set up logging
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger()

def fetch_odds():
    """Fetch MLB odds from OddsJam API."""
    try:
        response = requests.get(API_URL, params=PARAMS, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error fetching data: {e}")
        return None

def parse_odds(data):
    """Parse API response into structured records."""
    if not data or not data.get("data"):
        logger.warning("No data found in response")
        return []
    
    odds_records = []
    for game in data.get("data", []):
        game_id = game.get("game_id", "Unknown")
        for row in game.get("rows", []):
            team_info = row.get("display", {}).get("Moneyline", {})
            team_name = team_info.get("team_name", "Unknown")
            home_or_away = row.get("home_or_away", "Unknown")
            for sportsbook, odds_list in row.get("odds", {}).items():
                for odds in odds_list:
                    odds_records.append({
                        "game_id": game_id,
                        "team_name": team_name,
                        "home_or_away": home_or_away,
                        "sportsbook": sportsbook,
                        "price": odds.get("price", "N/A"),
                        "market_name": odds.get("market_name", "N/A"),
                        "bet_name": odds.get("bet_name", "N/A"),
                        "timestamp": datetime.now().isoformat()
                    })
    logger.info(f"Parsed {len(odds_records)} records")
    return odds_records

def detect_price_changes(old_data, new_data):
    """Detect price changes between old and new data sets."""
    if not old_data:
        return []
    
    changes = []
    for new_record in new_data:
        old_record = next((r for r in old_data if
                           r["game_id"] == new_record["game_id"] and
                           r["team_name"] == new_record["team_name"] and
                           r["sportsbook"] == new_record["sportsbook"] and
                           r["home_or_away"] == new_record["home_or_away"]), None)
        
        if old_record and old_record["price"] != new_record["price"]:
            try:
                old_price = float(old_record["price"])
                new_price = float(new_record["price"])
                changes.append({
                    "timestamp": datetime.now().isoformat(),
                    "game_id": new_record["game_id"],
                    "team_name": new_record["team_name"],
                    "sportsbook": new_record["sportsbook"],
                    "home_or_away": new_record["home_or_away"],
                    "old_price": old_price,
                    "new_price": new_price,
                    "change": new_price - old_price
                })
            except (ValueError, TypeError):
                pass
    if changes:
        logger.info(f"Detected {len(changes)} price changes")
    return changes

def save_local(data):
    """Save data to a local JSON file."""
    filename = f"mlb_odds_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    try:
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved data to {filename}")
    except Exception as e:
        logger.error(f"Failed to save locally: {e}")

def sync_to_github(data):
    """Sync data to GitHub repository."""
    try:
        if not GITHUB_TOKEN:
            raise ValueError("GITHUB_TOKEN not set")
        g = Github(GITHUB_TOKEN)
        repo = g.get_repo(f"{GITHUB_USERNAME}/{REPO_NAME}")
        filename = f"mlb_odds_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        content = json.dumps(data, indent=2)
        repo.create_file(
            path=filename,
            message=f"Update MLB odds data - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            content=base64.b64encode(content.encode()).decode(),
            committer={"name": GITHUB_NAME, "email": GITHUB_EMAIL}
        )
        logger.info(f"Synced data to GitHub: {filename}")
    except Exception as e:
        logger.error(f"GitHub sync failed: {e}")

@app.route('/odds')
def get_odds():
    """Flask endpoint to serve latest odds data."""
    global odds_data, price_changes, update_count
    raw_data = fetch_odds()
    if not raw_data:
        return jsonify({"error": "Failed to fetch data"}), 500
    
    new_data = parse_odds(raw_data)
    if not new_data:
        return jsonify({"error": "No data parsed"}), 500
    
    if odds_data:
        changes = detect_price_changes(odds_data[-1]["data"], new_data)
        if changes:
            price_changes.extend(changes)
    
    odds_data.append({"timestamp": datetime.now().isoformat(), "data": new_data})
    if len(odds_data) > MAX_DATA_POINTS:
        odds_data = odds_data[-MAX_DATA_POINTS:]
    
    data_to_save = {
        "timestamp": datetime.now().isoformat(),
        "odds_data": odds_data,
        "price_changes": price_changes,
        "summary": {
            "total_updates": update_count,
            "total_records": sum(len(d["data"]) for d in odds_data),
            "total_changes": len(price_changes)
        }
    }
    
    save_local(data_to_save)
    sync_to_github(data_to_save)
    
    update_count += 1
    return jsonify(raw_data)

def run_background_updates():
    """Run periodic updates in a separate thread."""
    while True:
        global odds_data, price_changes, update_count
        logger.info("Fetching new odds data...")
        raw_data = fetch_odds()
        if raw_data:
            new_data = parse_odds(raw_data)
            if new_data:
                if odds_data:
                    changes = detect_price_changes(odds_data[-1]["data"], new_data)
                    if changes:
                        price_changes.extend(changes)
                
                odds_data.append({"timestamp": datetime.now().isoformat(), "data": new_data})
                if len(odds_data) > MAX_DATA_POINTS:
                    odds_data = odds_data[-MAX_DATA_POINTS:]
                
                data_to_save = {
                    "timestamp": datetime.now().isoformat(),
                    "odds_data": odds_data,
                    "price_changes": price_changes,
                    "summary": {
                        "total_updates": update_count,
                        "total_records": sum(len(d["data"]) for d in odds_data),
                        "total_changes": len(price_changes)
                    }
                }
                
                save_local(data_to_save)
                sync_to_github(data_to_save)
                update_count += 1
                logger.info(f"Update successful: {len(new_data)} records")
        time.sleep(UPDATE_INTERVAL)

if __name__ == "__main__":
    import threading
    threading.Thread(target=run_background_updates, daemon=True).start()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
```
