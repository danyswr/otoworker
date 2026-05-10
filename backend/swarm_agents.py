import os
import subprocess
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
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
            timeout=30  # 30 detik timeout agar tidak hang
        )
        output = f"Return Code: {result.returncode}\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        return output
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 30 seconds."
    except Exception as e:
        return f"Error executing command: {str(e)}"


# --- 2. Dynamic LLM Factory ---
def create_llm(provider: str = "gemini", api_key: str = "", model: str = "gemini-2.0-flash"):
    """Create LLM instance based on provider selection from frontend settings."""

    # Fallback to env key if none provided
    if not api_key:
        if provider == "gemini":
            api_key = os.environ.get("GEMINI_API_KEY", "")
        else:
            api_key = os.environ.get("OPENROUTER_API_KEY", "")

    if not api_key:
        return None

    if provider == "openrouter":
        # OpenRouter uses OpenAI-compatible API
        return ChatOpenAI(
            model=model,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://otoworker.local",
                "X-Title": "Otoworker"
            },
            temperature=0.7,
        )
    else:
        # Default: Google Gemini via LangChain
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
        )


def run_swarm_task(
    user_instruction: str,
    provider: str = "gemini",
    api_key: str = "",
    model: str = "gemini-2.0-flash"
) -> str:
    """Menjalankan instruksi melalui Multi-Agent Swarm (CrewAI) dengan konfigurasi LLM dinamis."""

    llm = create_llm(provider, api_key, model)
    if not llm:
        return "Error: No API Key configured. Please open Settings (⚙) and add your API key."

    logger.info(f"Swarm using provider={provider}, model={model}")

    # --- 3. Definisi Agents ---
    manager_agent = Agent(
        role="Manager",
        goal="Handle user requests efficiently.",
        backstory="""You are the brain of Otoworker. Decide: DELEGATE to Executor or REPLY directly.
        Response MUST be JSON:
        {
          "thought_process": "...",
          "spoken_reply": "...",
          "action_type": "command" | "talk" | "done",
          "command": "...",
          "save_memory": { "type": "fact", "content": "..." },
          "update_goal": "..."
        }""",
        verbose=False,
        allow_delegation=True,
        llm=llm
    )

    executor_agent = Agent(
        role="Executor",
        goal="Execute commands.",
        backstory="""Linux admin. Return raw output.""",
        verbose=False,
        allow_delegation=False,
        tools=[execute_shell_command],
        llm=llm
    )

    # --- 4. Definisi Tugas ---
    main_task = Task(
        description=f"""Process the user request: '{user_instruction}'
        Provide the final answer in the EXACT JSON format specified.
        No surrounding markdown or extra text.""",
        expected_output="""A valid JSON object matching the required schema.""",
        agent=manager_agent
    )

    # --- 5. Crew Formation ---
    crew = Crew(
        agents=[manager_agent, executor_agent],
        tasks=[main_task],
        process=Process.sequential,
        verbose=True
    )

    try:
        result = str(crew.kickoff())

        # Cleanup markdown if LLM includes it
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].split("```")[0].strip()

        return result.strip()
    except Exception as e:
        logger.error(f"Swarm error: {str(e)}")
        return f"Swarm Process Failed: {str(e)}"


if __name__ == "__main__":
    # Test lokal jika di run langsung
    print("Testing Swarm...")
    os.environ["GEMINI_API_KEY"] = "DUMMY_KEY_UNTUK_CEK_SAJA"
    res = run_swarm_task("say hello", provider="gemini", api_key="", model="gemini-2.0-flash")
    print("FINAL RESULT:\n", res)
