import json
import hashlib
from solders.keypair import Keypair
from solana.rpc.api import Client
from solana.transaction import Transaction
from solders.instruction import Instruction
from solders.pubkey import Pubkey

class SolanaOptimizer:
    def __init__(self, wallet_path):
        with open(wallet_path, 'r') as f:
            self.kp = Keypair.from_bytes(json.load(f))
        self.client = Client("http://127.0.0.1:8899")
        self.memo_program = Pubkey.from_string("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcQb")

    def batch_upload(self, run_data):
        """
        Takes a huge list of sensor logs, hashes them, and commits 
        ONLY the 'Fingerprint' (Hash) + Summary to the chain.
        This converts 1000 transactions into 1.
        """
        # 1. Calculate Summary Stats (The "Headline")
        summary = {
            "events": len(run_data),
            "obstacles_hit": sum(1 for x in run_data if x['type'] == 2),
            "final_score": sum(x['value'] for x in run_data if x['type'] == 5),
            "timestamp": run_data[-1]['timestamp'] if run_data else 0
        }

        # 2. Create the "Data Fingerprint" (Merkle Root equivalent)
        # This proves we have the full data without paying to store it all
        data_string = json.dumps(run_data, sort_keys=True)
        data_hash = hashlib.sha256(data_string.encode()).hexdigest()

        # 3. Construct the Payload
        # "PROTOCOL:HASH:SUMMARY_JSON"
        payload = f"OLYMPIC_L2:{data_hash}:{json.dumps(summary)}"
        
        print(f"⚡ COMPRESSING: Uploading Proof for {len(run_data)} logs...")
        
        # 4. Mint the Transaction
        ix = Instruction(
            program_id=self.memo_program,
            accounts=[],
            data=payload.encode("utf-8")
        )
        txn = Transaction().add(ix)
        
        try:
            res = self.client.send_transaction(txn, self.kp)
            print(f"✅ BATCH SECURED: {res.value}")
            return str(res.value)
        except Exception as e:
            print(f"❌ UPLOAD FAILED: {e}")
            return None