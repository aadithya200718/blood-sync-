"""
Waste Reduction Agent
---------------------
Identifies blood units approaching expiry and recommends
redistribution or prioritised issuance to minimise wastage.
"""

from config.db import execute_query
from datetime import datetime, timedelta


def get_waste_analysis() -> dict:
    """
    Analyse inventory for units at risk of expiring and generate
    waste-reduction recommendations.
    """

    # Units expiring within the next 72 hours
    expiring_query = """
        SELECT unit_id, blood_group, component_type,
               collection_date, expiry_date, storage_location, status
        FROM blood_units
        WHERE status = 'AVAILABLE'
          AND expiry_date <= DATE_ADD(NOW(), INTERVAL 72 HOUR)
        ORDER BY expiry_date ASC
    """
    expiring_units = execute_query(expiring_query)

    # Historical wastage (expired units in the last 30 days)
    wastage_query = """
        SELECT blood_group, component_type, COUNT(*) AS wasted_count
        FROM blood_units
        WHERE status = 'EXPIRED'
          AND expiry_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY blood_group, component_type
        ORDER BY wasted_count DESC
    """
    wastage_history = execute_query(wastage_query)

    # Total expired in last 30 days
    total_wasted = sum(r["wasted_count"] for r in wastage_history) if wastage_history else 0

    # Build recommendations
    recommendations = []
    for unit in expiring_units:
        hours_left = _hours_until_expiry(unit["expiry_date"])
        if hours_left <= 24:
            recommendations.append({
                "unit_id": unit["unit_id"],
                "blood_group": unit["blood_group"],
                "hours_remaining": round(hours_left, 1),
                "urgency": "CRITICAL",
                "action": "Prioritise for immediate issuance or transfer to partner facility.",
            })
        elif hours_left <= 48:
            recommendations.append({
                "unit_id": unit["unit_id"],
                "blood_group": unit["blood_group"],
                "hours_remaining": round(hours_left, 1),
                "urgency": "HIGH",
                "action": "Flag for next compatible request. Consider cross-matching proactively.",
            })
        else:
            recommendations.append({
                "unit_id": unit["unit_id"],
                "blood_group": unit["blood_group"],
                "hours_remaining": round(hours_left, 1),
                "urgency": "MODERATE",
                "action": "Monitor. Ensure these units are prioritised in FEFO ordering.",
            })

    return {
        "timestamp": datetime.now().isoformat(),
        "expiring_within_72h": len(expiring_units),
        "units_at_risk": [
            {
                "unit_id": u["unit_id"],
                "blood_group": u["blood_group"],
                "component": u["component_type"],
                "expiry": u["expiry_date"].isoformat() if isinstance(u["expiry_date"], datetime) else str(u["expiry_date"]),
                "location": u["storage_location"],
            }
            for u in expiring_units
        ],
        "wastage_last_30d": {
            "total": total_wasted,
            "by_group": wastage_history,
        },
        "recommendations": recommendations,
        "summary": _build_summary(len(expiring_units), total_wasted, recommendations),
    }


def _hours_until_expiry(expiry_date) -> float:
    """Calculate hours until expiry."""
    if isinstance(expiry_date, datetime):
        delta = expiry_date - datetime.now()
    else:
        delta = datetime.combine(expiry_date, datetime.min.time()) - datetime.now()
    return max(0, delta.total_seconds() / 3600)


def _build_summary(expiring: int, wasted_30d: int, recs: list) -> str:
    """Generate a human-readable waste summary."""
    critical = len([r for r in recs if r["urgency"] == "CRITICAL"])
    if expiring == 0:
        return "✅ No units at imminent risk of expiry. Wastage is under control."

    parts = [f"⚠️ {expiring} unit(s) expiring within 72 hours."]
    if critical > 0:
        parts.append(f"🔴 {critical} unit(s) need IMMEDIATE action (< 24h remaining).")
    if wasted_30d > 0:
        parts.append(f"📊 {wasted_30d} unit(s) wasted in the past 30 days.")
    parts.append("Recommendation: Redistribute at-risk units or prioritise for compatible pending requests.")
    return " ".join(parts)
