import os
import sys
import builtins
import importlib

# Global import interceptor to block broken C-extensions in Python 3.14
def is_blocked(name):
    return name == 'google._upb' or name.startswith('google._upb.')

original_import = builtins.__import__
def patched_import(name, globals=None, locals=None, fromlist=(), level=0):
    if is_blocked(name):
        raise ImportError(f"Blocked {name} for Python 3.14 compatibility")
    return original_import(name, globals, locals, fromlist, level)
builtins.__import__ = patched_import

original_import_module = importlib.import_module
def patched_import_module(name, package=None):
    if is_blocked(name):
        raise ImportError(f"Blocked {name} for Python 3.14 compatibility")
    return original_import_module(name, package)
importlib.import_module = patched_import_module

os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

import ast
if not hasattr(ast, "NameConstant"):
    ast.NameConstant = ast.Constant
if not hasattr(ast, "Num"):
    ast.Num = ast.Constant
if not hasattr(ast, "Str"):
    ast.Str = ast.Constant
if not hasattr(ast, "Bytes"):
    ast.Bytes = ast.Constant
if not hasattr(ast, "Ellipsis"):
    ast.Ellipsis = ast.Constant

from fastapi import FastAPI, HTTPException, Security, Depends, Request
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import subprocess
import logging
from datetime import datetime
import os
from swarm_agents import run_swarm_task

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

class SwarmRequest(BaseModel):
    instruction: str
    provider: str = "gemini"
    api_key: str = ""
    model: str = "gemini-2.0-flash"

class CommandResponse(BaseModel):
    stdout: str
    stderr: str
    returncode: int

class SwarmResponse(BaseModel):
    result: str

class TelegramUpdateRequest(BaseModel):
    offset: int = 0

class TelegramSendRequest(BaseModel):
    chat_id: int
    text: str

BOT_TOKEN = os.environ.get("TELEGRAM_TOKEN", "8681622018:AAGro-cOuMCBTWK41Z2OZdPHaGzgCQ_ElWk")

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

@app.post("/swarm_execute", response_model=SwarmResponse)
def execute_swarm(request: SwarmRequest, api_key: str = Depends(get_api_key)):
    """
    Endpoint ini menerima instruksi bahasa natural.
    Instruksi dikirim ke Multi-Agent (Manager & Executor) untuk diselesaikan secara otonom.
    """
    logger.info(f"Swarm request received: {request.instruction} | provider={request.provider} model={request.model}")
    try:
        # Menjalankan agent swarm dengan konfigurasi dinamis dari frontend
        final_answer = run_swarm_task(
            user_instruction=request.instruction,
            provider=request.provider,
            api_key=request.api_key,
            model=request.model,
        )
        return SwarmResponse(result=str(final_answer))
    except Exception as e:
        logger.error(f"Error in swarm execution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/telegram/updates")
async def get_telegram_updates(request: TelegramUpdateRequest):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={request.offset}&timeout=5"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=10.0)
            return resp.json()
        except Exception as e:
            logger.error(f"Telegram updates error: {str(e)}")
            return {"ok": True, "result": []}

@app.post("/telegram/send")
async def send_telegram_message(request: TelegramSendRequest):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json={
                "chat_id": request.chat_id,
                "text": request.text
            })
            return resp.json()
        except Exception as e:
            logger.error(f"Telegram send error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "AuWorker FastAPI Backend is running."}
