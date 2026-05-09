import os
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

from agent_tools import read_file_tool, write_file_tool, execute_shell_tool
from memory_tools import store_memory_tool, search_memory_tool

load_dotenv()

# Set up the LLM, we use Gemini by default as it's common in this repo
def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-pro",
        verbose=True,
        temperature=0.7,
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

import asyncio
from websocket_manager import manager

def create_swarm(topic: str):
    llm = get_llm()

    # Daftar alat yang bisa digunakan oleh para agen untuk bekerja otonom
    agent_tools = [read_file_tool, write_file_tool, execute_shell_tool, store_memory_tool, search_memory_tool]

    # 1. The Autonomous Worker
    worker_agent = Agent(
        role='Autonomous OpenClaw Worker',
        goal='To formulate strong solutions, write code, run it in the workspace, and argue your points using actual output.',
        backstory='You are a brilliant and highly autonomous computer operator. When given a problem, you don\'t just talk; you use your tools to write code/scripts into your workspace, execute them, and use the results to build a rock-solid, opinionated proposal.',
        verbose=True,
        allow_delegation=False,
        tools=agent_tools,
        llm=llm
    )

    # 2. The Autonomous Debater / Critic
    critic_agent = Agent(
        role='Autonomous Devil\'s Advocate',
        goal='To find flaws in the Worker\'s code/proposal by inspecting their files, running counter-tests, and proving them wrong.',
        backstory='You are a ruthless technical critic. You don\'t just argue with words; you use your tools to read the Worker\'s files, execute commands to find bugs, and formulate a crushing technical counter-argument.',
        verbose=True,
        allow_delegation=False,
        tools=agent_tools,
        llm=llm
    )

    # 3. The Orchestrator / Judge
    orchestrator_agent = Agent(
        role='System Orchestrator',
        goal='To oversee the autonomous debate, verify the final output, and synthesize the ultimate decision.',
        backstory='You manage the OpenClaw swarm. You review the Worker\'s practical solution and the Critic\'s technical teardown. You synthesize the results and make the final technical judgment.',
        verbose=True,
        allow_delegation=True,
        llm=llm
    )

    # Tasks
    task1 = Task(
        description=f'Topic: {topic}\nUsing your tools, write a script/file to solve this problem, run it to verify, and present your opinionated, proven solution.',
        expected_output='A proven proposal with the actual output of the executed code/commands.',
        agent=worker_agent
    )

    task2 = Task(
        description='Read the Worker\'s proposal and their files in the workspace. Write your own test script or run commands to break their code. Output a harsh technical critique.',
        expected_output='A harsh technical critique based on actual file inspection and shell execution.',
        agent=critic_agent
    )

    task3 = Task(
        description='Review the Worker\'s solution and the Critic\'s counter-tests. Synthesize the findings and declare the ultimate truth or final solution.',
        expected_output='The final executive technical summary and decision.',
        agent=orchestrator_agent
    )

    # Instantiate the Crew
    crew = Crew(
        agents=[worker_agent, critic_agent, orchestrator_agent],
        tasks=[task1, task2, task3],
        process=Process.sequential,  # Sequential processing ensures the debate flows logically
        verbose=True
    )

    return crew

def execute_swarm(topic: str):
    crew = create_swarm(topic)

    # Define a callback to stream output to websocket
    def step_callback(step_output):
        # step_output could be a TaskOutput or AgentAction, we convert it to string
        msg = f"Agent Action: {str(step_output)}"
        manager.broadcast_sync(msg)

    crew.step_callback = step_callback

    # Broadcast start
    manager.broadcast_sync(f"Starting swarm for topic: {topic}")

    result = crew.kickoff()

    # Broadcast completion
    manager.broadcast_sync("Swarm execution completed.")

    return result

if __name__ == "__main__":
    # Test execution
    print(execute_swarm("Should we rewrite our entire monolith into microservices?"))
