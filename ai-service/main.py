"""
BloodSync AI Service — FastAPI Application
===========================================
Exposes the intelligent agents as REST endpoints.
All endpoints are strictly READ-ONLY; no mutations to the database.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from agents.inventory_agent import get_inventory_summary
from agents.waste_agent import get_waste_analysis
from agents.issuance_ml_agent import (
    get_ml_issuance_recommendation,
    predict_return_probability,
)

app = FastAPI(
    title="BloodSync AI Service",
    description="Agentic AI layer for intelligent blood bank operations",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class IssuanceRequest(BaseModel):
    blood_group: str = Field(..., example="O+")
    component_type: str = Field(default="Whole Blood")
    department: str = Field(default="General Ward")
    urgency: str = Field(default="Routine")
    units_requested: int = Field(default=1, ge=1, le=10)


class ChatMessage(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"service": "BloodSync AI", "status": "operational"}


@app.get("/api/agents/inventory")
async def inventory_intelligence():
    """Inventory Intelligence Agent — stock analysis and restocking alerts."""
    try:
        return get_inventory_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agents/waste")
async def waste_reduction():
    """Waste Reduction Agent — expiry risk analysis and redistribution recommendations."""
    try:
        return get_waste_analysis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/issuance")
async def ml_guided_issuance(req: IssuanceRequest):
    """
    ML-Guided Issuance Agent (Paper 10 — arXiv:2411.14939).
    Predicts return probability and recommends FEFO or newer-unit issuance.
    """
    try:
        result = get_ml_issuance_recommendation(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/predict-return")
async def predict_return(req: IssuanceRequest):
    """Standalone return-probability prediction endpoint."""
    try:
        prob = predict_return_probability(req.model_dump())
        return {
            "return_probability": round(prob, 3),
            "would_override_fefo": prob >= 0.55,
            "request": req.model_dump(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/agents/chat")
async def chat_copilot(msg: ChatMessage):
    """
    AI Copilot chat endpoint.
    Routes natural-language queries to the appropriate agent.
    """
    try:
        text = msg.message.lower()

        if any(kw in text for kw in ["stock", "inventory", "level", "restock", "supply"]):
            data = get_inventory_summary()
            return {
                "agent": "Inventory Intelligence",
                "response": data["recommendation"],
                "details": data,
            }
        elif any(kw in text for kw in ["expir", "waste", "wastage", "expire", "discard"]):
            data = get_waste_analysis()
            return {
                "agent": "Waste Reduction",
                "response": data["summary"],
                "details": data,
            }
        elif any(kw in text for kw in ["issue", "issuance", "return", "fefo", "newer", "ml"]):
            # Default demo request
            demo_req = {
                "blood_group": "O+",
                "component_type": "Whole Blood",
                "department": "General Ward",
                "urgency": "Routine",
                "units_requested": 1,
            }
            data = get_ml_issuance_recommendation(demo_req)
            return {
                "agent": "ML-Guided Issuance (Paper 10)",
                "response": data["summary"],
                "details": data,
            }
        else:
            return {
                "agent": "Copilot",
                "response": (
                    "I can help you with:\n"
                    "• **Inventory levels** — Ask about stock, supply, or restocking needs\n"
                    "• **Waste reduction** — Ask about expiring units or wastage trends\n"
                    "• **Smart issuance** — Ask about ML-guided issuance recommendations\n\n"
                    "Try asking: 'What is the current inventory status?'"
                ),
                "details": None,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
