import serial
import time
import json
import os
from solders.keypair import Keypair
from solana.rpc.api import Client
from solders.pubkey import Pubkey

# --- CONFIG ---
ARDUINO_PORT = "COM3" # CHECK THIS! (e.g., /dev/ttyUSB0 on Linux)
BAUD_RATE = 115200    # Must match Arduino
STATE_FILE = "race_state.json"
WALLET_PATH = "hackathon-wallet.json"

# --- INIT ---
print(f"🚀 Bridge Starting on {ARDUINO_PORT}...")

# Reset State File
initial_state = {"status": "WAITING", "time": 0, "score": 0, "log": []}
with open(STATE_FILE, 'w') as f:
    json.dump(initial_state, f)

try:
    ser = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
except:
    print("❌ ERROR: Arduino not found. Is it plugged in?")
    # We continue just to let you test the UI without crashing
    ser = None 

def update_ui(status, time_val, score_val, log_msg=None):
    """Writes the latest robot state to JSON for Streamlit"""
    data = {
        "status": status,
        "time": time_val,
        "score": score_val,
        "last_update": time.time()
    }
    with open(STATE_FILE, 'w') as f:
        json.dump(data, f)
    if log_msg:
        print(f"[{status}] {log_msg}")

# --- MAIN LOOP ---
while True:
    if ser and ser.in_waiting > 0:
        try:
            line = ser.readline().decode('utf-8').strip()
            
            # CASE 1: Telemetry Stream (LOG:1200,50,50,12,0)
            if line.startswith("LOG:"):
                parts = line.split(",")
                # Format: LOG:TIME,L_TICKS,R_TICKS,DIST,PWM
                run_time = int(parts[0]) / 1000.0
                dist = parts[3]
                update_ui("RACING", run_time, 0) # Score is 0 until finish

            # CASE 2: Finish Line (SOLANA_RECORD:50:45000)
            elif line.startswith("SOLANA_RECORD:"):
                parts = line.split(":")
                score = int(parts[1])
                final_time = int(parts[2])
                
                print("🏆 FINISH LINE DETECTED!")
                update_ui("FINISHED", final_time, score)
                
                # HERE: Add your Solana transaction code from before!
                # send_to_blockchain(score, final_time)

        except Exception as e:
            print(f"Error parsing: {e}")
            
    # Small sleep to save CPU
    time.sleep(0.05)