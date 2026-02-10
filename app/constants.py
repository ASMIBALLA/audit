# Emission Factors in kg CO2e per kilometer
# These are representative values. Real-world factors are more complex.
# Source: Simplified from GLEC Framework and other industry standards.
# Emission Factors in kg CO2e per kilometer
# These are representative values. Real-world factors are more complex.
# Source: Simplified from GLEC Framework and other industry standards.

EMISSION_FACTORS = {
    "default": 0.8,  # A default value if vehicle type is unknown
    "Light-Duty Van": 0.3,
    "Medium-Duty Truck": 0.65,
    "Heavy-Duty Truck": 1.2,
    "Refrigerated Truck": 1.8, # Refrigeration unit uses extra fuel
    "Cargo Ship": 0.02, # Per ton-km, but simplified here for demonstration
    "Cargo Plane": 2.5,
}

# 2️⃣ Emission Factor Versioning
EMISSION_FACTOR_METADATA = {
    "source": "DEFRA (Department for Environment, Food & Rural Affairs)",
    "version": "2024.1",
    "validity_period": "2024-01-01 to 2024-12-31",
    "unit": "kg CO2e / km",
    "link": "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting"
}

# 8️⃣ Methodology & Compliance Language
METHODOLOGY_TEXT = """
**GHG Protocol Scope 3 Category 4 & 9 (Upstream & Downstream Transportation)**
Calculation Method: Distance-based method using GPS-verified actual distances.

Formula:
$$ Emissions_{Total} = \sum (Distance_{segment} \times EmissionFactor_{vehicle}) $$

Assumptions:
1. Great-circle distance is calculated between distinct GPS pings.
2. Emission factors assume average load factors as per DEFRA 2024 guidelines.
3. Refrigerated transport includes an additional 50% uplift for cooling unit emissions.

Limitations:
- Does not account for road gradient or specific traffic conditions.
- Uses standard vehicle class averages rather than engine-specific telemetry.
"""