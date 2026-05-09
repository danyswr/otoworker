from fastapi import FastAPI, Depends, HTTPException, Header, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
from dotenv import load_dotenv
import os

# Import our swarm execution logic
from swarm_agents import execute_swarm
from database import SessionLocal, SwarmHistory
from websocket_manager import manager
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = FastAPI(title="Swarm Orchestrator Backend")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Setup CORS Middleware so the Next.js frontend can communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In a real scenario, this should be stored securely
API_KEY = os.getenv("API_KEY", "default-secret-key")

def verify_api_key(x_api_key: str = Header(None)):
    if not API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: API_KEY is not set."
        )
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return x_api_key

class SwarmRequest(BaseModel):
    topic: str

class ShellRequest(BaseModel):
    command: str

@app.on_event("startup")
async def startup_event():
    import asyncio
    from websocket_manager import manager
    manager.main_loop = asyncio.get_running_loop()

@app.get("/")
def read_root():
    return {"message": "Swarm Backend is running"}

@app.post("/swarm_execute", dependencies=[Depends(verify_api_key)])
def run_swarm(request: SwarmRequest, db = Depends(get_db)):
    try:
        # Panggil fungsi eksekusi swarm dari swarm_agents.py
        result = execute_swarm(request.topic)

        # Simpan ke database
        db_history = SwarmHistory(topic=request.topic, result=result)
        db.add(db_history)
        db.commit()
        db.refresh(db_history)

        return {"id": db_history.id, "topic": db_history.topic, "result": db_history.result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", dependencies=[Depends(verify_api_key)])
def get_history(db = Depends(get_db)):
    try:
        history = db.query(SwarmHistory).order_by(SwarmHistory.created_at.desc()).all()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Bisa dipakai untuk command real-time jika diperlukan
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
