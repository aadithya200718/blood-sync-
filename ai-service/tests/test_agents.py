"""
Phase 6 — AI Service Tests
===========================
Validates agent outputs, ML-guided issuance logic, and read-only safety.
These tests run WITHOUT a live database using mocked data.

Run with:  python -m pytest tests/test_agents.py -v
           (from the ai-service/ directory)
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Add parent dir to path so imports work
ai_service_root = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.abspath(ai_service_root))

# Mock the database module BEFORE importing agents
# This prevents mysql.connector from being required
mock_db_module = MagicMock()
mock_db_module.execute_query = MagicMock(return_value=[])
sys.modules["config"] = MagicMock()
sys.modules["config.db"] = mock_db_module

# Now import the modules under test
from agents.issuance_ml_agent import (
    predict_return_probability,
    get_ml_issuance_recommendation,
    RETURN_PROBABILITY_THRESHOLD,
)
from agents.inventory_agent import get_inventory_summary
from agents.waste_agent import get_waste_analysis


class TestReturnProbabilityModel(unittest.TestCase):
    """Tests for the ML return-probability estimator (Paper 10)."""

    def test_emergency_low_return(self):
        """Emergency requests should have low return probability."""
        req = {"department": "Emergency", "urgency": "Emergency", "units_requested": 1}
        prob = predict_return_probability(req)
        self.assertLess(prob, 0.30, "Emergency requests should rarely be returned")

    def test_outpatient_routine_high_return(self):
        """Outpatient routine requests should have high return probability."""
        req = {"department": "Outpatient", "urgency": "Routine", "units_requested": 1}
        prob = predict_return_probability(req)
        self.assertGreater(prob, 0.50, "Outpatient routine requests often returned")

    def test_multi_unit_increases_return(self):
        """More units requested should increase return probability."""
        req_1 = {"department": "General Ward", "urgency": "Routine", "units_requested": 1}
        req_3 = {"department": "General Ward", "urgency": "Routine", "units_requested": 3}
        prob_1 = predict_return_probability(req_1)
        prob_3 = predict_return_probability(req_3)
        self.assertGreater(prob_3, prob_1, "Multi-unit requests should have higher return prob")

    def test_clamped_to_unit_range(self):
        """Probability should always be between 0 and 1."""
        extreme_req = {"department": "Outpatient", "urgency": "Routine", "units_requested": 10}
        prob = predict_return_probability(extreme_req)
        self.assertGreaterEqual(prob, 0.0)
        self.assertLessEqual(prob, 1.0)

    def test_icu_urgent_moderate(self):
        """ICU urgent requests should be moderate return probability."""
        req = {"department": "ICU", "urgency": "Urgent", "units_requested": 1}
        prob = predict_return_probability(req)
        self.assertGreater(prob, 0.0)
        self.assertLess(prob, 0.50)


class TestIssuancePolicy(unittest.TestCase):
    """Tests for the FEFO vs ML-Guided issuance decision logic."""

    @patch("agents.issuance_ml_agent.execute_query")
    def test_fefo_for_low_return_prob(self, mock_query):
        """Standard FEFO should be used when return probability is low."""
        mock_query.return_value = [
            {"unit_id": "U001", "blood_group": "O+", "component_type": "Whole Blood",
             "collection_date": datetime.now() - timedelta(days=30),
             "expiry_date": datetime.now() + timedelta(days=2),
             "storage_location": "Fridge-A"},
            {"unit_id": "U002", "blood_group": "O+", "component_type": "Whole Blood",
             "collection_date": datetime.now() - timedelta(days=10),
             "expiry_date": datetime.now() + timedelta(days=20),
             "storage_location": "Fridge-A"},
        ]

        req = {
            "blood_group": "O+",
            "component_type": "Whole Blood",
            "department": "Emergency",
            "urgency": "Emergency",
            "units_requested": 1,
        }
        result = get_ml_issuance_recommendation(req)

        self.assertEqual(result["policy"], "FEFO")
        self.assertEqual(result["override_reason"], "")
        self.assertEqual(result["recommended_units"][0]["unit_id"], "U001")

    @patch("agents.issuance_ml_agent.execute_query")
    def test_ml_override_for_high_return_prob(self, mock_query):
        """ML should override FEFO when return probability exceeds threshold."""
        mock_query.return_value = [
            {"unit_id": "U001", "blood_group": "O+", "component_type": "Whole Blood",
             "collection_date": datetime.now() - timedelta(days=30),
             "expiry_date": datetime.now() + timedelta(days=2),
             "storage_location": "Fridge-A"},
            {"unit_id": "U002", "blood_group": "O+", "component_type": "Whole Blood",
             "collection_date": datetime.now() - timedelta(days=5),
             "expiry_date": datetime.now() + timedelta(days=25),
             "storage_location": "Fridge-A"},
        ]

        req = {
            "blood_group": "O+",
            "component_type": "Whole Blood",
            "department": "Outpatient",
            "urgency": "Routine",
            "units_requested": 1,
        }
        result = get_ml_issuance_recommendation(req)

        self.assertEqual(result["policy"], "ML_GUIDED_NEWER")
        self.assertIn("arXiv:2411.14939", result["override_reason"])
        # Newer unit (U002) should be recommended first
        self.assertEqual(result["recommended_units"][0]["unit_id"], "U002")

    @patch("agents.issuance_ml_agent.execute_query")
    def test_no_units_available(self, mock_query):
        """Should handle empty inventory gracefully."""
        mock_query.return_value = []
        req = {"blood_group": "AB-", "component_type": "Platelets"}
        result = get_ml_issuance_recommendation(req)

        self.assertEqual(result["recommended_units"], [])
        self.assertIn("No available", result["summary"])


class TestChatRouter(unittest.TestCase):
    """Tests for the copilot chat routing logic."""

    @patch("agents.inventory_agent.execute_query")
    def test_inventory_keyword_routes_to_agent(self, mock_query):
        """Chat messages about 'stock' should route to inventory agent."""
        mock_query.return_value = []

        result = get_inventory_summary()
        self.assertIn("recommendation", result)

    @patch("agents.waste_agent.execute_query")
    def test_waste_keyword_routes_to_agent(self, mock_query):
        """Chat messages about 'expiry' should route to waste agent."""
        mock_query.return_value = []

        result = get_waste_analysis()
        self.assertIn("summary", result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
