from fastapi import FastAPI, Depends, HTTPException, Header, status
from pydantic import BaseModel
import subprocess
from dotenv import load_dotenv
import os

# Import our swarm execution logic
from swarm_agents import execute_swarm

load_dotenv()

app = FastAPI(title="Swarm Orchestrator Backend")

# In a real scenario, this should be stored securely
API_KEY = os.getenv("API_KEY")

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

@app.get("/")
def read_root():
    return {"message": "Swarm Backend is running"}

@app.post("/swarm_execute", dependencies=[Depends(verify_api_key)])
def run_swarm(request: SwarmRequest):
    try:
        # Panggil fungsi eksekusi swarm dari swarm_agents.py
        result = execute_swarm(request.topic)
        return {"topic": request.topic, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/shell_execute", dependencies=[Depends(verify_api_key)])
def run_shell(request: ShellRequest):
    """
    WARNING: Executing remote shell commands via subprocess.run(shell=True)
    is dangerous and only implemented here based on explicit user request.
    Use with extreme caution.
    """
    try:
        # Menjalankan perintah shell secara otonom
        result = subprocess.run(
            request.command,
            shell=True,
            capture_output=True,
            text=True
        )
        return {
            "command": request.command,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
