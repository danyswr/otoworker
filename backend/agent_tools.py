import os
import subprocess
from langchain.tools import tool

# Tentukan absolute path untuk workspace agar tetap terisolasi dengan aman
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.join(BASE_DIR, "workspace")

def _get_safe_path(filename: str) -> str:
    """Memastikan agen hanya mengakses file di dalam folder workspace."""
    safe_path = os.path.join(WORKSPACE_DIR, os.path.basename(filename))
    return safe_path

@tool("Read File Tool")
def read_file_tool(filename: str) -> str:
    """Use this tool to read the contents of a file in your workspace.
    Provide the filename as the argument."""
    filepath = _get_safe_path(filename)
    if not os.path.exists(filepath):
        return f"Error: File '{filename}' does not exist in workspace."
    try:
        with open(filepath, 'r') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@tool("Write File Tool")
def write_file_tool(filename: str, content: str) -> str:
    """Use this tool to write content to a file in your workspace.
    Arguments must be exactly a string 'filename' and string 'content'.
    Overwrites the file if it exists."""
    filepath = _get_safe_path(filename)
    try:
        with open(filepath, 'w') as f:
            f.write(content)
        return f"Successfully wrote to '{filename}'."
    except Exception as e:
        return f"Error writing file: {str(e)}"

@tool("Execute Shell Command Tool")
def execute_shell_tool(command: str) -> str:
    """Use this tool to execute a shell command safely inside an isolated Docker sandbox.
    Useful for running scripts (e.g., 'python script.py', 'ls', 'node test.js').
    Returns the stdout and stderr of the command."""
    try:
        # DOCKER SANDBOX EXECUTION:
        # We mount the workspace into a restricted python:3.12-slim docker container.
        # This prevents the AI from running destructive commands on the host server.
        # Ensure docker is installed and running on the host server.

        docker_cmd = [
            "docker", "run", "--rm",
            "--network", "none", # Disable internet access for safety
            "-v", f"{WORKSPACE_DIR}:/workspace",
            "-w", "/workspace",
            "--memory", "512m",
            "--cpus", "0.5",
            "python:3.12-slim",
            "bash", "-c", command
        ]

        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        output = f"Exit Code: {result.returncode}\n"
        if result.stdout:
            output += f"STDOUT:\n{result.stdout}\n"
        if result.stderr:
            output += f"STDERR:\n{result.stderr}\n"
        return output
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 30 seconds. Infinite loop detected or command is too heavy."
    except Exception as e:
        return f"Error executing command: Ensure Docker is installed on the server. Details: {str(e)}"
