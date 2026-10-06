"""
ThreatLens Enterprise Security Alert Intelligence & Incident Correlation Backend
Main FastAPI application entrypoint with CORS, WebSockets, and modular routing.
"""
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from app.core.state import app_state
from app.api.alerts import router as alerts_router
from app.api.incidents import router as incidents_router
from app.api.campaigns import router as campaigns_router
from app.api.mitre import router as mitre_router
from app.api.assets import router as assets_router
from app.api.analytics import router as analytics_router
from app.api.pipeline import router as pipeline_router
from app.api.benchmarks import router as benchmarks_router
from app.api.feedback import router as feedback_router
from app.api.audit import router as audit_router
from app.api.search import router as search_router
from app.api.simulation import router as simulation_router
from app.api.datasets import router as datasets_router

app = FastAPI(
    title="ThreatLens SOC Platform API",
    description="Enterprise Security Alert Intelligence & Incident Correlation Engine",
    version="1.0.0"
)

# CORS configuration for enterprise frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(alerts_router)
app.include_router(incidents_router)
app.include_router(campaigns_router)
app.include_router(mitre_router)
app.include_router(assets_router)
app.include_router(analytics_router)
app.include_router(pipeline_router)
app.include_router(benchmarks_router)
app.include_router(feedback_router)
app.include_router(audit_router)
app.include_router(search_router)
app.include_router(simulation_router)
app.include_router(datasets_router)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ThreatLens SOC Engine",
        "version": "1.0.0",
        "total_alerts": len(app_state.raw_alerts),
        "total_incidents": len(app_state.incidents)
    }


@app.get("/api/auth/me")
def get_current_user():
    return {
        "id": app_state.analyst_id,
        "name": app_state.analyst_name,
        "role": app_state.analyst_role,
        "shift": "Shift Alpha (08:00 - 16:00 UTC)",
        "assigned_queue": "Tier-1 MSSP Primary Queue"
    }


@app.post("/api/auth/role")
def switch_analyst_role(payload: Dict[str, str]):
    role = payload.get("role", "Tier-1 Analyst")
    if role in ["Tier-1 Analyst", "Senior Analyst", "SOC Lead / Admin"]:
        app_state.analyst_role = role
        return {"status": "success", "new_role": role}
    return {"status": "error", "message": "Invalid role"}


# WebSocket Manager for real-time live alert stream updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass


ws_manager = ConnectionManager()


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial status
        await websocket.send_text(json.dumps({
            "type": "INITIAL_METRICS",
            "active_incidents": len(app_state.incidents),
            "alerts_count": len(app_state.raw_alerts),
            "timestamp": "connected"
        }))
        while True:
            data = await websocket.receive_text()
            # Echo or process commands
            await websocket.send_text(json.dumps({"type": "ACK", "payload": data}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# Mount static frontend build if present
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

