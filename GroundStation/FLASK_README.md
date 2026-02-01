# Olympimarket - Flask Frontend

A Polymarket-style prediction market platform for betting on robot races, built with Flask.

## Features

- **Live Market Dashboard**: Real-time odds and betting volume visualization
- **Interactive Charts**: 
  - Doughnut chart showing current market odds
  - Line chart tracking betting volume over time
- **Two-Position Betting**: Bet YES (robot succeeds) or NO (robot fails)
- **Wallet System**: $1,000 FAN starting balance per user
- **Betting History**: Track all your positions and outcomes
- **Dark Theme UI**: Modern Polymarket-inspired interface
- **Live Data Polling**: Auto-refreshing market data every 2 seconds

## Setup & Installation

### Requirements
- Python 3.8+
- Flask 3.0.0
- Modern web browser

### Installation Steps

1. **Navigate to the GroundStation directory**:
   ```bash
   cd c:\Users\frank\Downloads\utrahacks\default\GroundStation
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Create required data files**:
   
   Create `race_state.json`:
   ```json
   {
     "status": "READY",
     "time": 0,
     "score": 0,
     "races": []
   }
   ```

   Create `bets.json` (or it will be created automatically):
   ```json
   {}
   ```

4. **Run the Flask application**:
   ```bash
   python app.py
   ```

5. **Open your browser**:
   ```
   http://localhost:5000
   ```

## Project Structure

```
GroundStation/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── race_state.json        # Robot race state data
├── bets.json              # User bets and wallet data
├── templates/
│   ├── base.html          # Base template with navbar
│   ├── index.html         # Main dashboard
│   └── history.html       # Betting history page
└── static/
    ├── style.css          # Polymarket-inspired styling
    └── main.js            # Chart.js initialization and API calls
```

## How It Works

### Market Mechanics
- **YES Position**: Bet that the robot finishes successfully in < 45 seconds
- **NO Position**: Bet that the robot crashes or takes > 45 seconds
- **Odds**: Calculated as proportion of total pool volume
- **Settlement**: Resolved automatically when race completes

### Data Integration
The app reads robot race data from `race_state.json` which is updated by the BiathlonRobot sketch:
```json
{
  "status": "RUNNING",  // READY, RUNNING, FINISHED
  "time": 35,           // Race timer in seconds
  "score": 450          // Current score
}
```

### User Sessions
- Each user gets a unique session ID
- Starting balance: $1,000 FAN
- Bets stored in `bets.json` per user
- Balances persist across page refreshes

## API Endpoints

### GET `/`
Main dashboard page

### GET `/api/market-data`
Returns current market odds and volumes
```json
{
  "status": "RUNNING",
  "time": 35,
  "score": 450,
  "market": {
    "success_odds": 65.2,
    "fail_odds": 34.8,
    "success_volume": 652,
    "fail_volume": 348,
    "total_volume": 1000,
    "participants": 5
  }
}
```

### POST `/api/place-bet`
Place a new bet
```json
{
  "position": "SUCCESS",
  "amount": 100
}
```

### GET `/api/user-positions`
Get current user's balance and open positions

## Customization

### Change Market Resolution Threshold
Edit `app.py` line ~135 to adjust the success threshold from 45 seconds:
```python
if state['time'] < 45000:  # Change 45000 to your value (in milliseconds)
```

### Update Styling
Modify `static/style.css` to change colors, fonts, and layout. Key CSS variables:
```css
--primary-color: #1e40af;
--success-color: #10b981;
--fail-color: #ef4444;
```

### Adjust Polling Frequency
In `templates/index.html`, change the polling interval:
```javascript
setInterval(pollMarketData, 2000);  // Change 2000ms to desired interval
```

## Troubleshooting

### "Cannot find race_state.json"
Create the file with the JSON structure above in the GroundStation directory.

### Charts not showing
Ensure Chart.js is loaded: Check browser console for errors.

### Bets not persisting
Verify `bets.json` exists and is writable by the Flask process.

### Port 5000 already in use
Change the port in `app.py`:
```python
app.run(debug=True, port=5001)  # Change to desired port
```

## Future Enhancements

- [ ] Database backend (SQLite/PostgreSQL) for persistent storage
- [ ] Real-time WebSocket updates instead of polling
- [ ] Advanced market features (resolution sources, dispute periods)
- [ ] User authentication and leaderboards
- [ ] Solana blockchain integration for on-chain settlement
- [ ] Mobile-responsive improvements
- [ ] Admin dashboard for market management

## License

Built for UtraHacks 2026
