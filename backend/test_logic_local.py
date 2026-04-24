import json
import time
from pathlib import Path

from models.fl_model import FederatedModel
from models.gnn_model import GNNModel
from models.decision_engine import integrate

def test_samples():
    print("Loading models...")
    fl_model = FederatedModel()
    gnn_model = GNNModel()
    
    samples_path = Path(__file__).parent / "data" / "sample_transactions.json"
    with open(samples_path, "r", encoding="utf-8") as f:
        samples = json.load(f)["samples"]
        
    print(f"\nLoaded {len(samples)} samples. Running predictions...\n")
    
    for i, sample in enumerate(samples):
        # Convert values
        txn = {
            "amount": float(sample["amount"]),
            "time": float(sample["time"]),
            "sender_id": sample["sender_id"],
            "receiver_id": sample["receiver_id"],
            "transaction_type": sample["transaction_type"],
            "location_risk": float(sample["location_risk"]),
        }
        
        # FL
        fl_result = fl_model.predict(txn)
        fl_score = fl_result["fl_score"]
        
        # GNN
        gnn_result = gnn_model.predict(txn)
        gnn_score = gnn_result["gnn_score"]
        
        # Integrate
        integration = integrate(
            fl_score=fl_score,
            gnn_score=gnn_score,
            tau_fl_flag=0.6,
            tau_fl_block=0.8,
            tau_gnn=0.7,
            pattern_type=gnn_result.get("pattern_type", ""),
        )
        
        print(f"Sample {i+1}: {sample['label']}")
        print(f"  Expected: {sample['description'].split('(')[1].split(' ')[0]}")
        print(f"  FL Score:  {fl_score:.3f}")
        print(f"  GNN Score: {gnn_score:.3f}")
        print(f"  Decision:  {integration.decision}")
        print(f"  Reasoning: {integration.reasoning}")
        print("-" * 50)

if __name__ == "__main__":
    test_samples()
