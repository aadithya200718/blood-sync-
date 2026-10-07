"""
Inventory Intelligence Agent
------------------------------
Queries current stock levels against configured targets and generates
actionable restocking recommendations.
"""

from config.db import execute_query
from datetime import datetime


def get_inventory_summary() -> dict:
    """
    Return a structured summary of the current inventory state,
    including counts by blood group and component type, compared
    against configured critical / minimum / target thresholds.
    """

    # Current available units grouped by blood group & component
    stock_query = """
        SELECT blood_group, component_type, COUNT(*) AS unit_count
        FROM blood_units
        WHERE status = 'AVAILABLE'
        GROUP BY blood_group, component_type
        ORDER BY blood_group, component_type
    """
    stock_rows = execute_query(stock_query)

    # Configured thresholds
    target_query = """
        SELECT blood_group, component_type,
               critical_level, minimum_level, target_level
        FROM inventory_targets
    """
    target_rows = execute_query(target_query)

    # Build a lookup of targets
    targets = {}
    for t in target_rows:
        key = (t["blood_group"], t["component_type"])
        targets[key] = {
            "critical": t["critical_level"],
            "minimum": t["minimum_level"],
            "target": t["target_level"],
        }

    # Build the analysis
    analysis = []
    alerts = []

    for row in stock_rows:
        key = (row["blood_group"], row["component_type"])
        count = row["unit_count"]
        target_info = targets.get(key, {"critical": 5, "minimum": 10, "target": 20})

        status = "ADEQUATE"
        if count <= target_info["critical"]:
            status = "CRITICAL"
            alerts.append(
                f"🔴 CRITICAL: {row['blood_group']} {row['component_type']} — "
                f"only {count} units (critical threshold: {target_info['critical']})"
            )
        elif count <= target_info["minimum"]:
            status = "LOW"
            alerts.append(
                f"🟡 LOW: {row['blood_group']} {row['component_type']} — "
                f"{count} units (minimum threshold: {target_info['minimum']})"
            )

        analysis.append({
            "blood_group": row["blood_group"],
            "component_type": row["component_type"],
            "current_stock": count,
            "target": target_info["target"],
            "status": status,
            "deficit": max(0, target_info["target"] - count),
        })

    # Check for blood groups that have ZERO available stock
    all_groups_query = "SELECT DISTINCT blood_group FROM inventory_targets"
    all_groups = [r["blood_group"] for r in execute_query(all_groups_query)]
    stocked_groups = {r["blood_group"] for r in stock_rows}
    for group in all_groups:
        if group not in stocked_groups:
            alerts.append(f"🔴 CRITICAL: {group} has ZERO available units!")

    return {
        "timestamp": datetime.now().isoformat(),
        "total_available": sum(r["unit_count"] for r in stock_rows),
        "breakdown": analysis,
        "alerts": alerts,
        "recommendation": _generate_recommendation(analysis, alerts),
    }


def _generate_recommendation(analysis: list, alerts: list) -> str:
    """Generate a human-readable recommendation string."""
    if not alerts:
        return "✅ All inventory levels are within acceptable ranges. No immediate action required."

    critical_items = [a for a in analysis if a["status"] == "CRITICAL"]
    low_items = [a for a in analysis if a["status"] == "LOW"]

    parts = []
    if critical_items:
        groups = ", ".join(f"{i['blood_group']} {i['component_type']}" for i in critical_items)
        parts.append(f"⚠️ Immediate restocking required for: {groups}.")
    if low_items:
        groups = ", ".join(f"{i['blood_group']} {i['component_type']}" for i in low_items)
        parts.append(f"📋 Schedule restocking for: {groups}.")

    return " ".join(parts)
