import os
import subprocess
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import tool
import logging

# Load env vars
load_dotenv()

logger = logging.getLogger(__name__)

# --- 1. Definisi Tools untuk Executor Agent ---
@tool("Execute Shell Command")
def execute_shell_command(command: str) -> str:
    """Useful to execute bash/shell commands on the server. Input should be a string containing the command."""
    try:
        logger.info(f"Swarm Executor running: {command}")
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30 # 30 detik timeout agar tidak hang
        )
        output = f"Return Code: {result.returncode}\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        return output
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 30 seconds."
    except Exception as e:
        return f"Error executing command: {str(e)}"

# --- 2. Setup LLM ---
# Memastikan API Key Gemini ada
gemini_api_key = os.environ.get("GEMINI_API_KEY", "")

# Inisialisasi model Google Gemini lewat LangChain
if gemini_api_key:
    llm = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=gemini_api_key)
else:
    llm = None # Jika tidak ada key, CrewAI mungkin akan fallback ke OpenAI default jika tidak dihandle

def run_swarm_task(user_instruction: str) -> str:
    """Menjalankan instruksi melalui Multi-Agent Swarm (CrewAI)"""
    if not llm:
         return "Error: GEMINI_API_KEY is not set in the environment variables."

    # --- 3. Definisi Agents ---

    # Agent 1: The Manager (Perencana)
    manager_agent = Agent(
        role="System Architect & Manager",
        goal="Break down user requests into safe and actionable shell command strategies.",
        backstory="You are a brilliant system architect. When a user asks to do something on the server, you figure out the exact steps needed. You don't execute commands yourself; you delegate them to the Executor.",
        verbose=True,
        allow_delegation=True,
        llm=llm
    )

    # Agent 2: The Executor (Eksekutor Shell)
    executor_agent = Agent(
        role="Terminal Executor Worker",
        goal="Execute the exact shell commands given by the Manager and report the results back.",
        backstory="You are a highly skilled Linux terminal operator. You have the ability to run shell commands. You only do what the Manager tells you, and you report the exact STDOUT/STDERR back to the Manager.",
        verbose=True,
        allow_delegation=False,
        tools=[execute_shell_command],
        llm=llm
    )

    # --- 4. Definisi Tugas ---

    # Task 1: Manager merencanakan
    planning_task = Task(
        description=f"User request: '{user_instruction}'. Analyze this request. Decide what bash/shell commands need to be run to accomplish this. Tell the Executor Worker exactly what command to run. Wait for their response, and summarize the final outcome.",
        expected_output="A summary of what was executed and the final result of the operation.",
        agent=manager_agent
    )

    # Task 2: Executor menjalankan
    execution_task = Task(
        description="Run the exact shell command provided by the Manager using your tool. Return the raw output to the Manager.",
        expected_output="The raw STDOUT and STDERR of the executed command.",
        agent=executor_agent
    )

    # --- 5. Crew Formation ---
    crew = Crew(
        agents=[manager_agent, executor_agent],
        tasks=[planning_task, execution_task],
        process=Process.sequential, # Manager berpikir dulu, lalu menyuruh Executor
        verbose=True # Ganti verbose=2 untuk melihat log agent di terminal
    )

    try:
        # Mulai Swarm Process
        result = crew.kickoff()
        return result
    except Exception as e:
        logger.error(f"Swarm error: {str(e)}")
        return f"Swarm Process Failed: {str(e)}"

if __name__ == "__main__":
    # Test lokal jika di run langsung
    print("Testing Swarm...")
    os.environ["GEMINI_API_KEY"] = "DUMMY_KEY_UNTUK_CEK_SAJA" # Ganti asli untuk tes nyata
    res = run_swarm_task("Create a file called swarm_test.txt and write 'hello from swarm' in it, then list the files.")
    print("FINAL RESULT:\n", res)
