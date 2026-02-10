from fastapi import FastAPI, HTTPException
import json
from typing import List, Dict

# Import our custom modules
# Import our custom modules
from .utils import (
    calculate_distance_km, 
    calculate_confidence_score, 
    detect_anomalies, 
    generate_recommendations,
    generate_audit_id,
    generate_data_hash,
    generate_field_hash,      # NEW
    generate_merkle_root_hash   # NEW
)
from .constants import EMISSION_FACTORS, EMISSION_FACTOR_METADATA, METHODOLOGY_TEXT
from datetime import datetime
import os

app = FastAPI(
    title="Sustainability Audit API",
    description="An API for calculating and managing Scope 3 supply chain emissions.",
    version="1.0.0",
)

from fastapi.middleware.cors import CORSMiddleware

# Ensure CORS is permissive but valid for credentials
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="http://localhost:.*", # Allow all localhost ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IN-MEMORY STORAGE (for hackathon purposes, would be a database in production) ---
# This will store our processed results to avoid recalculating every time.
processed_results: Dict = {}
# This will store detailed logs for auditability.
audit_logs: Dict = {}
# 4️⃣ Immutable Tamper Log (Write-Only)
tamper_log: List = [] 


@app.get("/", tags=["General"])
def read_root():
    """A welcome endpoint to check if the server is running."""
    return {"message": "Welcome to the Sustainability Audit API - PORT 8001"}


@app.post("/automation/process-all-data", tags=["Automation & Processing"])
def process_all_supply_chain_data():
    """
    (AUTOMATION)
    This endpoint simulates an automated process that ingests and calculates
    emissions for all suppliers from the source data file.
    """
    global processed_results, audit_logs, tamper_log
    
    # Reset storage on every run
    processed_results = {"suppliers": {}}
    audit_logs = {}
    tamper_log = [] # Reset for demo, in prod this would persist

    # Ensure data file path is correct when running as a package
    data_file_path = os.path.join(os.path.dirname(__file__), "synthetic_data.json")
    with open(data_file_path, "r") as f:
        data = json.load(f)

    for supplier in data["suppliers"]:
        supplier_id = supplier["supplier_id"]
        supplier_total_emissions = 0.0
        
        processed_results["suppliers"][supplier_id] = {
            "name": supplier["name"],
            "total_emissions_kg_co2e": 0,
            "total_distance_km": 0,
            "vehicle_breakdown": {}
        }

        for vehicle in supplier["vehicles"]:
            vehicle_id = vehicle["vehicle_id"]
            vehicle_type = vehicle.get("type", "default")
            emission_factor = EMISSION_FACTORS.get(vehicle_type, EMISSION_FACTORS["default"])
            
            for trip in vehicle["trips"]:
                trip_id = trip["trip_id"]
                trip_distance = 0.0
                trip_emissions = 0.0
                
                # Initialize audit log for this trip with PROVENANCE METADATA
                audit_id = generate_audit_id(trip_id)
                processing_time = datetime.now()
                processing_time_iso = processing_time.isoformat()
                
                audit_logs[trip_id] = {
                    "audit_id": audit_id,
                    "supplier_id": supplier_id,
                    "vehicle_id": vehicle_id,
                    "vehicle_type": vehicle_type,
                    "emission_factor_per_km": emission_factor,
                    "emission_factor_source": EMISSION_FACTOR_METADATA, # 2️⃣ Attach Versioning
                    "calculated_at": processing_time_iso,
                    "ingested_at": processing_time_iso, # Simulated same time
                    "data_sources": {
                        "gps": "telemetry_api_simulated",
                        "emission_factor": EMISSION_FACTOR_METADATA["source"]
                    },
                    "segments": [],
                    # 1️⃣ Field-Level Hashes Storage
                    "field_hashes": {} 
                }
                
                gps_pings = sorted(trip["gps_pings"], key=lambda p: p["timestamp"])

                # Iterate through GPS pings to calculate segment by segment
                for i in range(len(gps_pings) - 1):
                    start_ping = gps_pings[i]
                    end_ping = gps_pings[i+1]
                    
                    segment_distance = calculate_distance_km(
                        start_ping["latitude"], start_ping["longitude"],
                        end_ping["latitude"], end_ping["longitude"]
                    )
                    
                    segment_emissions = segment_distance * emission_factor
                    
                    trip_distance += segment_distance
                    trip_emissions += segment_emissions

                    # Add detailed segment data to the audit log
                    audit_logs[trip_id]["segments"].append({
                        "from_timestamp": start_ping["timestamp"],
                        "to_timestamp": end_ping["timestamp"],
                        "distance_km": round(segment_distance, 4),
                        "emissions_kg_co2e": round(segment_emissions, 4)
                    })

                # Update totals for the trip in the audit log
                audit_logs[trip_id]["total_trip_distance_km"] = round(trip_distance, 2)
                audit_logs[trip_id]["total_trip_emissions_kg_co2e"] = round(trip_emissions, 2)
                
                # 3️⃣ Confidence & Anomalies
                audit_logs[trip_id]["confidence_score"] = calculate_confidence_score(gps_pings, trip_distance)
                audit_logs[trip_id]["flags"] = detect_anomalies(gps_pings, trip_distance, vehicle_type)
                
                # 6️⃣ Recommendations
                audit_logs[trip_id]["recommendations"] = generate_recommendations(vehicle_type, trip_emissions)
                
                # 8️⃣ Methodology
                audit_logs[trip_id]["methodology"] = METHODOLOGY_TEXT
                
                # 1️⃣ GENERATE FIELD-LEVEL HASHES (The "Ledger")
                fields_to_hash = {
                    "total_trip_distance_km": audit_logs[trip_id]["total_trip_distance_km"],
                    "total_trip_emissions_kg_co2e": audit_logs[trip_id]["total_trip_emissions_kg_co2e"],
                    "confidence_score": audit_logs[trip_id]["confidence_score"],
                    "vehicle_id": vehicle_id,
                    "calculated_at": processing_time_iso
                }
                
                for field, value in fields_to_hash.items():
                    audit_logs[trip_id]["field_hashes"][field] = generate_field_hash(value, audit_id, processing_time_iso)

                # 2️⃣ Merkle Root Hash
                audit_logs[trip_id]["data_hash"] = generate_merkle_root_hash(audit_logs[trip_id]["field_hashes"])
                
                supplier_total_emissions += trip_emissions
                
                # Aggregate data into processed_results
                processed_results["suppliers"][supplier_id]["total_distance_km"] += trip_distance
    
    # Final aggregation of total emissions for the supplier
    for supplier_id, log_data in audit_logs.items():
        supplier_id_from_log = log_data["supplier_id"]
        if supplier_id_from_log in processed_results["suppliers"]:
             processed_results["suppliers"][supplier_id_from_log]["total_emissions_kg_co2e"] += log_data["total_trip_emissions_kg_co2e"]

    return {
        "message": "All supply chain data processed successfully.",
        "suppliers_processed": len(processed_results["suppliers"]),
        "trips_audited": len(audit_logs)
    }


@app.get("/intelligence/supplier-leaderboard", tags=["Intelligence & Reporting"])
def get_supplier_leaderboard():
    """
    Provides a leaderboard of suppliers, recommending the one with the
    lowest total carbon emissions.
    """
    if not processed_results.get("suppliers"):
        raise HTTPException(
            status_code=404, 
            detail="No processed data found. Please run the processing endpoint first: POST /automation/process-all-data"
        )
    
    suppliers_data = processed_results["suppliers"]
    
    # Create a list and sort it by total emissions (ascending)
    leaderboard = sorted(
        [
            {
                "supplier_id": sid,
                "name": sdata["name"],
                "total_emissions_kg_co2e": round(sdata["total_emissions_kg_co2e"], 2),
                "total_distance_km": round(sdata["total_distance_km"], 2)
            } for sid, sdata in suppliers_data.items()
        ],
        key=lambda x: x["total_emissions_kg_co2e"]
    )
    
    return {
        "recommendation": f"Based on our analysis, '{leaderboard[0]['name']}' is the most carbon-efficient supplier.",
        "leaderboard": leaderboard
    }


@app.get("/audit/list-trips", tags=["Audit & Verification"])
def list_available_trips():
    """
    Returns a list of all processed trip IDs.
    """
    if not audit_logs:
        return {"trips": []}
    
    return {"trips": list(audit_logs.keys())}


@app.get("/intelligence/dashboard-stats", tags=["Intelligence & Reporting"])
def get_dashboard_stats():
    """
    Returns high-level KPIs for the Executive Dashboard.
    """
    if not processed_results.get("suppliers"):
         # Return empty/zero stats if no data processed yet
        return {
            "total_co2_kg": 0,
            "total_distance_km": 0,
            "avg_confidence_score": 0,
            "total_trips": 0,
            "top_offender": "N/A",
            "last_updated": None
        }

    total_co2 = 0.0
    total_dist = 0.0
    total_confidence = 0.0
    trip_count = len(audit_logs)
    
    # Calculate totals
    for s in processed_results["suppliers"].values():
        total_co2 += s["total_emissions_kg_co2e"]
        total_dist += s["total_distance_km"]
        
    # Calculate average confidence
    if trip_count > 0:
        total_confidence = sum(log.get("confidence_score", 0) for log in audit_logs.values())
        avg_confidence = total_confidence / trip_count
    else:
        avg_confidence = 0

    # Find top offender
    suppliers_sorted = sorted(
        processed_results["suppliers"].values(), 
        key=lambda x: x["total_emissions_kg_co2e"], 
        reverse=True
    )
    top_offender = suppliers_sorted[0]["name"] if suppliers_sorted else "N/A"

    return {
        "total_co2_kg": round(total_co2, 2),
        "total_distance_km": round(total_dist, 2),
        "avg_confidence_score": round(avg_confidence, 2),
        "total_trips": trip_count,
        "top_offender": top_offender,
        "last_updated": datetime.now().strftime("%d %b %Y, %I:%M %p IST") # Simulated Timezone context
    }


@app.get("/authority/integrity-events", tags=["Regulatory & Compliance"])
def get_integrity_events():
    """
    (REGULATORY VIEW) - Read-only view of all tamper attempts.
    """
    return {
        "integrity_status": "COMPROMISED" if tamper_log else "SECURE",
        "event_count": len(tamper_log),
        "events": tamper_log
    }

@app.post("/simulation/tamper-data", tags=["Simulation & Testing"])
def simulate_tamper_attack(trip_id: str, field: str, new_value: float):
    """
    (DEMO ONLY) - Intentionally corrupts data in memory WITHOUT updating the hash.
    This simulates a DB hack or insider attack.
    """
    if trip_id not in audit_logs:
        raise HTTPException(status_code=404, detail="Trip ID not found")
    
    # 😈 MALICIOUS ACT: Update value but NOT the hash
    audit_logs[trip_id][field] = new_value
    
    return {
        "message": f"ATTACK SUCCESSFUL: Corrupted {field} to {new_value} for {trip_id}.",
        "note": "The cryptographic hash was NOT updated. Next audit verification should fail."
    }

@app.post("/simulation/reset-data", tags=["Simulation & Testing"])
def reset_trip_data(trip_id: str):
    """
    (DEMO ONLY) - Restores the original verified data for a trip by re-processing it from source.
    """
    # Simply re-run the full processing to mitigate the attack (Hackathon shortcut)
    # In prod, we would fetch from a backup or immutable ledger.
    process_all_supply_chain_data()
    
    if trip_id not in audit_logs:
         raise HTTPException(status_code=404, detail="Trip ID not found after reset")

    return {
        "message": f"INTEGRITY RESTORED: Original data for {trip_id} has been recovered.",
        "integrity_status": "VERIFIED"
    }

@app.get("/audit/trip-report/{trip_id}", tags=["Audit & Verification"])
def get_audit_report_for_trip(trip_id: str):
    """
    Generates a verifiable, automated audit report.
    CHECKS FOR INTEGRITY VIOLATIONS ON EVERY READ.
    """
    if trip_id not in audit_logs:
        raise HTTPException(
            status_code=404,
            detail=f"Audit log for trip_id '{trip_id}' not found."
        )
    
    audit_record = audit_logs[trip_id]
    
    # 3️⃣ Tamper Detection Engine (Run on Read)
    # Re-calculate hashes to verify nothing changed in memory
    current_hashes = {}
    is_tampered = False
    tamper_details = []
    
    fields_to_check = [
        "total_trip_distance_km", 
        "total_trip_emissions_kg_co2e", 
        "confidence_score",
        "vehicle_id"
    ]
    
    for field in fields_to_check:
        stored_hash = audit_record["field_hashes"].get(field)
        current_val = audit_record.get(field)
        
        # We need the original context (audit_id + time) to reconstruct hash
        # In a real DB, we'd store these meta-fields with the hash
        # Here we re-use the record's main metadata
        recalc_hash = generate_field_hash(
            current_val, 
            audit_record["audit_id"], 
            audit_record["calculated_at"]
        )
        
        if stored_hash != recalc_hash:
            is_tampered = True
            
            # Log the violation
            violation = {
                "audit_id": audit_record["audit_id"],
                "trip_id": trip_id,
                "field": field,
                "severity": "CRITICAL",
                "message": f"Integrity Hash Mismatch for {field}",
                "stored_hash": stored_hash,
                "recalculated_hash": recalc_hash,
                "detected_at": datetime.now().isoformat()
            }
            
            tamper_details.append(violation)
            
            # 4️⃣ Immutable Log Append
            # Check if recently logged to avoid spamming log for same read
            if not any(e["audit_id"] == violation["audit_id"] and e["field"] == field for e in tamper_log):
                tamper_log.append(violation)

    # If tampered, inject the warning into the response
    response_data = audit_record.copy()
    if is_tampered:
        response_data["integrity_status"] = "COMPROMISED"
        response_data["tamper_evidence"] = tamper_details
    else:
        response_data["integrity_status"] = "VERIFIED"

    return response_data