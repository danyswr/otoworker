from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import logging
from datetime import datetime
import os

# Konfigurasi Logging
logging.basicConfig(
    filename="execute.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

API_KEY = os.environ.get("EXECUTE_API_KEY", "super_secret_jules_key_123")
API_KEY_NAME = "X-API-KEY"

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate API KEY")

app = FastAPI()

# Enable CORS for frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommandRequest(BaseModel):
    command: str

class CommandResponse(BaseModel):
    stdout: str
    stderr: str
    returncode: int

@app.post("/execute", response_model=CommandResponse)
def execute_command(request: CommandRequest, api_key: str = Depends(get_api_key)):
    logger.info(f"Executing command: {request.command}")
    try:
        # Warning: shell=True can be extremely dangerous if not properly secured.
        # Ensure that this is what the user specifically requested.
        result = subprocess.run(
            request.command,
            shell=True,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            logger.info(f"Command execution successful (Return Code: {result.returncode})")
        else:
            logger.warning(f"Command execution failed (Return Code: {result.returncode}) | Stderr: {result.stderr.strip()}")

        return CommandResponse(
            stdout=result.stdout,
            stderr=result.stderr,
            returncode=result.returncode
        )
    except Exception as e:
        logger.error(f"Error executing command: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "AuWorker FastAPI Backend is running."}
