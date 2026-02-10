import hashlib
import json
import random
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2

def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the distance in kilometers between two GPS coordinates
    using the Haversine formula.
    """
    R = 6371.0  # Radius of Earth in kilometers

    lat1_rad = radians(lat1)
    lon1_rad = radians(lon1)
    lat2_rad = radians(lat2)
    lon2_rad = radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    # Haversine formula
    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance

# --- 3️⃣ Confidence Scoring & Anomaly Flags ---
def calculate_confidence_score(gps_pings: list, total_distance: float) -> float:
    """
    Calculates a confidence score (0-1) based on data quality.
    """
    score = 1.0
    
    if not gps_pings:
        return 0.0

    # Penalize for low ping frequency (simplified)
    # Ideally we'd check time gaps, but here we just check raw count vs distance
    # Expecting at least 1 ping per 100km effectively? Or 10km?
    # Let's say we expect 1 ping every hour. 
    # For now, just a dummy check:
    if len(gps_pings) < 5:
        score -= 0.1
    
    # Penalize for massive jumps (teleportation) implying missing data
    # (This would be done during the loop usually, but estimating here)
    average_segment = total_distance / len(gps_pings) if len(gps_pings) > 0 else 0
    if average_segment > 500: # gap > 500km
        score -= 0.3
        
    return max(0.0, min(score, 1.0))

def detect_anomalies(gps_pings: list, total_distance: float, vehicle_type: str) -> list:
    """
    Returns a list of string flags for any data anomalies.
    """
    flags = []
    
    # Check for excessive idle (simulated)
    # If we had time deltas, we'd check for 0 movement over long time.
    # Randomly simulating for demo purposes if not implementing full logic
    if len(gps_pings) > 2 and total_distance < 1.0:
        flags.append("excessive_idle_time")
        
    # Check for route deviation logic (simplified placeholder)
    # e.g., if distance is > 1.5x displacement
    if len(gps_pings) >= 2:
        start = gps_pings[0]
        end = gps_pings[-1]
        displacement = calculate_distance_km(start["latitude"], start["longitude"], end["latitude"], end["longitude"])
        if total_distance > displacement * 1.5:
            flags.append("route_deviation")
            
    return flags

# --- 6️⃣ Actionable Reduction Recommendations ---
def generate_recommendations(vehicle_type: str, total_emissions: float) -> list:
    recommendations = []
    
    # Logic: If using heavy truck and short emissions, maybe okay.
    # If using air freight (high factor), recommend sea.
    
    if "Air" in vehicle_type or "Plane" in vehicle_type:
         recommendations.append({
            "type": "mode_shift",
            "potential_reduction_pct": 90,
            "rationale": "Switching from Air to Ocean freight significantly reduces carbon intensity."
        })
         
    if "Heavy" in vehicle_type and total_emissions > 100:
        recommendations.append({
            "type": "route_optimization",
            "potential_reduction_pct": 12,
            "rationale": "Historical lower-emission route exists."
        })
        
    if not recommendations:
        # Default encouragement
        recommendations.append({
            "type": "vehicle_electrification",
            "potential_reduction_pct": 40,
            "rationale": "Transitioning to EV trucks for this route segment."
        })
        
    return recommendations

# --- 7️⃣ Audit-Grade PDF Export / Hashing (ENHANCED) ---
def generate_field_hash(value, audit_id: str, timestamp: str) -> str:
    """
    Generates a deterministic SHA-256 hash for a single field value.
    Salted with audit_id and timestamp to prevent rainbow table attacks.
    """
    payload = f"{str(value)}|{audit_id}|{timestamp}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def generate_merkle_root_hash(field_hashes: dict) -> str:
    """
    Generates a Merkle-style root hash from all field hashes.
    Sorts keys to ensure determinism.
    """
    # Sort by key to ensure order doesn't affect hash
    sorted_hashes = sorted(field_hashes.items())
    
    # Concatenate all hashes
    combined_payload = "".join([h for k, h in sorted_hashes])
    
    return hashlib.sha256(combined_payload.encode('utf-8')).hexdigest()

def generate_data_hash(audit_data: dict) -> str:
    """
    Legacy wrapper for backward compatibility, now uses Merkle Root logic if structured data provided.
    """
    if "field_hashes" in audit_data:
        return generate_merkle_root_hash(audit_data["field_hashes"])
        
    # Fallback for old/simple calls
    serialized = json.dumps(audit_data, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def generate_audit_id(trip_id: str) -> str:
    # Unique ID: TRIP-DATE-RANDOM
    suffix = random.randint(1000, 9999)
    date_str = datetime.now().strftime("%Y%m%d")
    return f"AUD-{trip_id}-{date_str}-{suffix}"