from flask import Flask, render_template, jsonify, request, session
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'olympimarket_secret_key_2026'

# Data file paths
RACE_STATE_FILE = 'race_state.json'
BETS_FILE = 'bets.json'

def load_race_state():
    """Load current robot race state"""
    try:
        with open(RACE_STATE_FILE, 'r') as f:
            return json.load(f)
    except:
        return {"status": "OFFLINE", "time": 0, "score": 0, "races": []}

def load_bets():
    """Load all bets from file"""
    try:
        with open(BETS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_bets(bets_data):
    """Save bets to file"""
    with open(BETS_FILE, 'w') as f:
        json.dump(bets_data, f, indent=2)

def get_user_id():
    """Get or create user session ID"""
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return session['user_id']

def get_market_data():
    """Calculate market data (odds, total volume, etc.)"""
    state = load_race_state()
    bets = load_bets()
    
    success_bets = sum(b['amount'] for b in bets.values() if b.get('position') == 'SUCCESS')
    fail_bets = sum(b['amount'] for b in bets.values() if b.get('position') == 'FAIL')
    
    total = success_bets + fail_bets
    if total == 0:
        success_odds = 50
        fail_odds = 50
    else:
        success_odds = (success_bets / total) * 100
        fail_odds = (fail_bets / total) * 100
    
    return {
        'success_odds': round(success_odds, 1),
        'fail_odds': round(fail_odds, 1),
        'success_volume': success_bets,
        'fail_volume': fail_bets,
        'total_volume': total,
        'participants': len(bets)
    }

@app.route('/')
def index():
    """Main dashboard page"""
    state = load_race_state()
    market_data = get_market_data()
    user_id = get_user_id()
    
    # Get user's bets
    bets = load_bets()
    user_bets = bets.get(user_id, {})
    user_balance = user_bets.get('balance', 1000)
    user_positions = user_bets.get('positions', [])
    
    return render_template('index.html', 
                         state=state, 
                         market_data=market_data,
                         user_balance=user_balance,
                         user_positions=user_positions)

@app.route('/api/market-data')
def api_market_data():
    """API endpoint for market data"""
    market_data = get_market_data()
    state = load_race_state()
    return jsonify({
        'status': state.get('status', 'OFFLINE'),
        'time': state.get('time', 0),
        'score': state.get('score', 0),
        'market': market_data,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/place-bet', methods=['POST'])
def api_place_bet():
    """Place a bet on a market"""
    data = request.json
    user_id = get_user_id()
    position = data.get('position')  # 'SUCCESS' or 'FAIL'
    amount = float(data.get('amount', 0))
    
    if amount <= 0:
        return jsonify({'success': False, 'error': 'Invalid amount'}), 400
    
    bets = load_bets()
    if user_id not in bets:
        bets[user_id] = {'balance': 1000, 'positions': []}
    
    user_bets = bets[user_id]
    if user_bets['balance'] < amount:
        return jsonify({'success': False, 'error': 'Insufficient balance'}), 400
    
    # Deduct from balance and add position
    user_bets['balance'] -= amount
    user_bets['positions'].append({
        'id': str(uuid.uuid4()),
        'position': position,
        'amount': amount,
        'timestamp': datetime.now().isoformat(),
        'status': 'OPEN'
    })
    
    save_bets(bets)
    market_data = get_market_data()
    
    return jsonify({
        'success': True,
        'new_balance': user_bets['balance'],
        'market_data': market_data
    })

@app.route('/api/user-positions')
def api_user_positions():
    """Get user's current positions"""
    user_id = get_user_id()
    bets = load_bets()
    
    if user_id not in bets:
        return jsonify({'balance': 1000, 'positions': []})
    
    return jsonify(bets[user_id])

@app.route('/history')
def history():
    """Betting history page"""
    user_id = get_user_id()
    bets = load_bets()
    user_bets = bets.get(user_id, {})
    
    return render_template('history.html', positions=user_bets.get('positions', []))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
