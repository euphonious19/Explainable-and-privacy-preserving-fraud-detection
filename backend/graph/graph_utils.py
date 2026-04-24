"""
Graph Utilities — Fraud Subgraph Lookup

Pre-rendered fraud subgraph patterns for visualization.
Returns node/edge JSON compatible with D3 force-directed graphs.

Never builds the full PaySim graph at runtime.
Patterns are either:
1. Loaded from fraud_subgraphs.json (pre-rendered during training)
2. Generated deterministically for any sender/receiver pair
"""

import json
import logging
import hashlib
import math
from pathlib import Path
from typing import Optional

logger = logging.getLogger("FraudShield.Graph")

SUBGRAPHS_PATH = Path(__file__).parent.parent / "data" / "fraud_subgraphs.json"

# Pattern → canonical subgraph template
PATTERN_TEMPLATES = {
    "Fan-In Money Mule Chain": "mule_chain",
    "Layering / Structuring Pattern": "layering",
    "Known Suspicious Endpoint": "suspicious_endpoint",
    "Moderate Structural Risk": "moderate_risk",
    "Clean Transaction": "clean",
}


def _load_subgraphs() -> dict:
    try:
        with open(SUBGRAPHS_PATH, encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load subgraphs file: {e}")
        return {}


_SUBGRAPH_CACHE: Optional[dict] = None


def _get_subgraph_templates() -> dict:
    global _SUBGRAPH_CACHE
    if _SUBGRAPH_CACHE is None:
        _SUBGRAPH_CACHE = _load_subgraphs()
    return _SUBGRAPH_CACHE


def _deterministic_subgraph(sender_id: str, receiver_id: str, gnn_score: float) -> dict:
    """
    Generate a realistic-looking subgraph deterministically for any account pair.
    Based on GNN score: higher score → more mule-like structure.
    """
    seed = int(hashlib.md5(f"{sender_id}{receiver_id}".encode()).hexdigest()[:8], 16)

    num_intermediary = max(1, min(4, int(gnn_score * 5)))
    num_sources = max(1, min(5, int(gnn_score * 6)))

    nodes = []
    edges = []

    # Source accounts (sending money to intermediary/mule)
    source_ids = [f"SRC_{i:03d}" for i in range(num_sources)]
    for i, src in enumerate(source_ids):
        nodes.append({
            "id": src,
            "label": f"Bank {chr(65+i)}",
            "type": "source",
            "risk": round(0.1 + 0.15 * i, 2),
            "amount": round(5000 + (seed % 20000) + i * 3000, 2),
        })

    # Intermediary / mule accounts
    inter_ids = [f"INT_{i:03d}" for i in range(num_intermediary)]
    for i, inter in enumerate(inter_ids):
        risk = round(0.6 + 0.1 * i, 2)
        nodes.append({
            "id": inter,
            "label": f"Mule {i+1}",
            "type": "mule",
            "risk": min(risk, 0.95),
            "amount": round(sum(5000 + j * 3000 for j in range(num_sources)), 2),
        })

    # Main sender (from UI input)
    nodes.append({
        "id": sender_id,
        "label": "Sender",
        "type": "sender",
        "risk": round(gnn_score * 0.6, 2),
        "amount": 0,
        "highlight": True,
    })

    # Main receiver (from UI input)
    nodes.append({
        "id": receiver_id,
        "label": "Receiver",
        "type": "receiver" if gnn_score < 0.7 else "mule",
        "risk": round(gnn_score, 2),
        "amount": 0,
        "highlight": True,
    })

    # Destination
    nodes.append({
        "id": "DEST_001",
        "label": "Destination",
        "type": "destination",
        "risk": round(gnn_score * 0.8, 2),
        "amount": 0,
    })

    # Edges: sources → first intermediary
    first_inter = inter_ids[0] if inter_ids else receiver_id
    for src in source_ids:
        edges.append({
            "source": src,
            "target": first_inter,
            "amount": round(5000 + (seed % 10000), 2),
            "suspicious": True,
        })

    # Edges: sender → receiver
    edges.append({
        "source": sender_id,
        "target": receiver_id,
        "amount": 0,
        "suspicious": gnn_score > 0.5,
    })

    # Chain through intermediaries
    for i in range(len(inter_ids) - 1):
        edges.append({
            "source": inter_ids[i],
            "target": inter_ids[i + 1],
            "amount": round(4000 + (seed % 8000), 2),
            "suspicious": True,
        })

    # Final intermediary → destination
    edges.append({
        "source": inter_ids[-1] if inter_ids else receiver_id,
        "target": "DEST_001",
        "amount": round(3500 + (seed % 7000), 2),
        "suspicious": True,
    })

    return {
        "nodes": nodes,
        "edges": edges,
        "pattern": "generated",
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


def get_subgraph(
    sender_id: str,
    receiver_id: str,
    gnn_score: float,
    pattern_type: str = "",
) -> dict:
    """
    Return the best subgraph for visualization:
    1. Try to load a matching pre-rendered template
    2. Fall back to deterministic generation
    """
    templates = _get_subgraph_templates()
    template_key = PATTERN_TEMPLATES.get(pattern_type, "")

    if template_key and template_key in templates:
        import copy
        subgraph = copy.deepcopy(templates[template_key])
        # Inject real sender/receiver IDs
        for node in subgraph.get("nodes", []):
            if node.get("type") == "sender":
                node["id"] = sender_id
                node["label"] = f"Sender ({sender_id})"
            elif node.get("type") == "receiver":
                node["id"] = receiver_id
                node["label"] = f"Receiver ({receiver_id})"
                
        for edge in subgraph.get("edges", []):
            if edge.get("source") == "sender_placeholder":
                edge["source"] = sender_id
            elif edge.get("source") == "receiver_placeholder":
                edge["source"] = receiver_id
                
            if edge.get("target") == "sender_placeholder":
                edge["target"] = sender_id
            elif edge.get("target") == "receiver_placeholder":
                edge["target"] = receiver_id
                
        return subgraph

    # Generate deterministically
    return _deterministic_subgraph(sender_id, receiver_id, gnn_score)
