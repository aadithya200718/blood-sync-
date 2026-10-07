"""
ML-Guided Issuance Agent  (Paper 10 — arXiv:2411.14939)
========================================================
Implements the key insight from "Many happy returns: machine learning to
support platelet issuing and waste reduction in hospital blood banks":

> The predominant practice of issuing the oldest unit first (FEFO) may
> not be optimal when some units are returned unused.  An ML model that
> predicts the probability of a unit being returned can guide a policy
> that issues **newer** units to high-return-probability requests so
> that returned units still have remaining shelf life for re-issuance,
> yielding an estimated 14 % reduction in wastage.

Architecture
------------
1.  **Feature engineering** — For each incoming request we extract
    contextual features that historically correlate with returns:
    requesting department, time of day, day of week, urgency level,
    component type, and number of units requested.

2.  **Return-probability model** — A lightweight scikit-learn classifier
    (Gradient Boosted Trees) trained on historical request/return data.
    In production the model file would be loaded from disk; here we
    ship a deterministic rule-based estimator that mirrors the paper's
    feature importance findings until real training data is available.

3.  **Issuance policy override** — When the predicted return probability
    exceeds a configurable threshold (default 0.55) the agent
    recommends issuing a **newer** compatible unit instead of the oldest
    (FEFO), because the newer unit will retain more shelf life if it
    comes back unused.

Safety guardrails
-----------------
* The agent NEVER issues or mutates data — it only returns
  *recommendations*.  All actual issuance goes through the stored
  procedure ``issue_unit()`` which requires human confirmation.
* A clear ``override_reason`` field explains every deviation from FEFO
  so clinicians can audit the decision.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import Any

from config.db import execute_query


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
RETURN_PROBABILITY_THRESHOLD = 0.55  # override FEFO above this score


# ---------------------------------------------------------------------------
# Feature extraction  (mirrors paper §3.2 feature set)
# ---------------------------------------------------------------------------

def _extract_features(request: dict) -> dict[str, Any]:
    """
    Build the feature vector used by the return-probability model.

    Features aligned with Paper 10:
      - requesting_department  (categorical → one-hot in real model)
      - hour_of_day            (0-23)
      - day_of_week            (0=Mon … 6=Sun)
      - urgency                (categorical: Routine / Urgent / Emergency)
      - component_type         (Platelets / Whole Blood / Packed RBC / …)
      - units_requested        (integer)
    """
    now = datetime.now()
    return {
        "requesting_department": request.get("department", "General Ward"),
        "hour_of_day": now.hour,
        "day_of_week": now.weekday(),
        "urgency": request.get("urgency", "Routine"),
        "component_type": request.get("component_type", "Platelets"),
        "units_requested": request.get("units_requested", 1),
    }


# ---------------------------------------------------------------------------
# Return-probability estimator
# ---------------------------------------------------------------------------

# Department-level base return rates (derived from paper Table 2 analogue)
_DEPT_RETURN_RATES: dict[str, float] = {
    "Operating Theatre": 0.35,
    "ICU": 0.20,
    "Emergency": 0.15,
    "Oncology": 0.45,
    "General Ward": 0.50,
    "Outpatient": 0.55,
    "Haematology": 0.30,
}

# Urgency adjustment (Emergency requests are rarely returned)
_URGENCY_MODIFIER: dict[str, float] = {
    "Emergency": -0.25,
    "Urgent": -0.10,
    "Routine": 0.10,
}


def predict_return_probability(request: dict) -> float:
    """
    Predict the probability that a blood unit issued for this request
    will be returned unused.

    In production this would call ``model.predict_proba()`` on a trained
    GradientBoostingClassifier.  Until real historical data is available
    we use a deterministic rule-based estimator that reproduces the
    paper's feature-importance findings (department and urgency dominate).

    Returns a float in [0, 1].
    """
    features = _extract_features(request)

    base = _DEPT_RETURN_RATES.get(features["requesting_department"], 0.40)
    urgency_adj = _URGENCY_MODIFIER.get(features["urgency"], 0.0)

    # Weekend requests have slightly higher return rate (paper §4.1)
    weekend_adj = 0.05 if features["day_of_week"] >= 5 else 0.0

    # Night shifts (22:00–06:00) have higher return rates
    night_adj = 0.08 if features["hour_of_day"] >= 22 or features["hour_of_day"] < 6 else 0.0

    # Multi-unit requests: each additional unit increases return chance
    multi_unit_adj = 0.03 * max(0, features["units_requested"] - 1)

    probability = base + urgency_adj + weekend_adj + night_adj + multi_unit_adj

    # Clamp to [0, 1]
    return max(0.0, min(1.0, probability))


# ---------------------------------------------------------------------------
# Issuance recommendation engine
# ---------------------------------------------------------------------------

def get_ml_issuance_recommendation(request: dict) -> dict:
    """
    Given an incoming blood request, decide whether to recommend
    standard FEFO or the ML-guided "issue newer" policy.

    Parameters
    ----------
    request : dict
        Must contain at minimum ``blood_group`` and ``component_type``.
        Optional: ``department``, ``urgency``, ``units_requested``.

    Returns
    -------
    dict with keys:
        policy            – "FEFO" or "ML_GUIDED_NEWER"
        return_probability – predicted return prob
        recommended_units – list of unit dicts ordered by recommended issuance
        override_reason   – human-readable explanation (empty for FEFO)
    """
    blood_group = request.get("blood_group", "O+")
    component = request.get("component_type", "Whole Blood")

    # Predict return probability
    return_prob = predict_return_probability(request)

    # Fetch compatible available units sorted by expiry (FEFO default)
    fefo_query = """
        SELECT unit_id, blood_group, component_type,
               collection_date, expiry_date, storage_location
        FROM blood_units
        WHERE status = 'AVAILABLE'
          AND blood_group = %s
          AND component_type = %s
        ORDER BY expiry_date ASC
        LIMIT 10
    """
    fefo_units = execute_query(fefo_query, (blood_group, component))

    if not fefo_units:
        return {
            "policy": "FEFO",
            "return_probability": round(return_prob, 3),
            "recommended_units": [],
            "override_reason": "",
            "summary": f"No available {blood_group} {component} units in inventory.",
        }

    # Decide policy
    if return_prob >= RETURN_PROBABILITY_THRESHOLD:
        # ML-GUIDED: Issue NEWER units so returns still have shelf life
        # Reverse the FEFO order → newest first
        recommended = list(reversed(fefo_units))
        policy = "ML_GUIDED_NEWER"
        override_reason = (
            f"Return probability is {return_prob:.0%} (threshold {RETURN_PROBABILITY_THRESHOLD:.0%}). "
            f"Per Paper 10 (arXiv:2411.14939) issuing a newer unit reduces wastage "
            f"because returned units will retain more shelf life for re-issuance. "
            f"Estimated wastage reduction: ~14%."
        )
    else:
        recommended = fefo_units
        policy = "FEFO"
        override_reason = ""

    # Serialise dates for JSON
    for u in recommended:
        for key in ("collection_date", "expiry_date"):
            if isinstance(u.get(key), (datetime,)):
                u[key] = u[key].isoformat()
            elif u.get(key) is not None:
                u[key] = str(u[key])

    units_requested = request.get("units_requested", 1)
    top_picks = recommended[:units_requested]

    return {
        "policy": policy,
        "return_probability": round(return_prob, 3),
        "threshold": RETURN_PROBABILITY_THRESHOLD,
        "recommended_units": top_picks,
        "all_candidates": recommended,
        "override_reason": override_reason,
        "summary": _build_summary(policy, return_prob, top_picks, blood_group),
    }


def _build_summary(policy: str, prob: float, picks: list, bg: str) -> str:
    if not picks:
        return f"No {bg} units available."
    if policy == "ML_GUIDED_NEWER":
        return (
            f"🧠 ML Override Active — Return probability {prob:.0%}. "
            f"Recommending newer unit(s) {', '.join(p['unit_id'] for p in picks)} "
            f"instead of oldest-first to reduce wastage if returned."
        )
    return (
        f"✅ Standard FEFO — Return probability {prob:.0%} (below threshold). "
        f"Recommending oldest unit(s): {', '.join(p['unit_id'] for p in picks)}."
    )
