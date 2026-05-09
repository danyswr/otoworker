import os
from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

# Set up the LLM, we use Gemini by default as it's common in this repo
def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-pro",
        verbose=True,
        temperature=0.7,
        google_api_key=os.getenv("GEMINI_API_KEY")
    )

def create_swarm(topic: str):
    llm = get_llm()

    # 1. The Opinionated Worker
    worker_agent = Agent(
        role='Opinionated Expert Worker',
        goal='To formulate strong, opinionated solutions and arguments regarding the given topic.',
        backstory='You are a highly skilled but stubborn expert. You do not just give generic answers; you take a strong stance, formulate a bold opinion, and propose a concrete, possibly unconventional solution. You believe your way is the best way.',
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # 2. The Debater / Critic
    critic_agent = Agent(
        role='The Devil\'s Advocate / Ruthless Critic',
        goal='To aggressively find flaws, debate, and tear down the proposals made by the worker.',
        backstory='You are a skeptical, highly analytical critic. Your sole purpose is to find weaknesses, logical fallacies, and risks in the Expert Worker\'s proposal. You argue passionately and challenge assumptions.',
        verbose=True,
        allow_delegation=False,
        llm=llm
    )

    # 3. The Orchestrator / Judge
    orchestrator_agent = Agent(
        role='Wise Orchestrator & Judge',
        goal='To mediate the debate, synthesize the arguments, and make a final, well-reasoned autonomous decision.',
        backstory='You are the calm and wise manager of the swarm. You listen to the passionate opinions of the Worker and the harsh critiques of the Critic. You do not take sides initially. Your job is to extract the truth from their debate and formulate the final, optimal, and actionable conclusion.',
        verbose=True,
        allow_delegation=True,
        llm=llm
    )

    # Tasks
    task1 = Task(
        description=f'Propose a strong, highly opinionated solution or stance on the following topic: {topic}. Be bold and defend your perspective in advance.',
        expected_output='A detailed, opinionated proposal and argument on the topic.',
        agent=worker_agent
    )

    task2 = Task(
        description='Read the Worker\'s proposal. Rip it apart. Find every single flaw, risk, and bad assumption. Propose a counter-argument.',
        expected_output='A harsh critique and counter-argument to the worker\'s proposal.',
        agent=critic_agent
    )

    task3 = Task(
        description='Review the original proposal from the Worker and the critique from the Critic. Synthesize the debate. Decide who makes more sense and output a final, refined, and robust solution that addresses the critique.',
        expected_output='The final executive summary of the debate and the ultimate authorized solution.',
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
    result = crew.kickoff()
    return result

if __name__ == "__main__":
    # Test execution
    print(execute_swarm("Should we rewrite our entire monolith into microservices?"))
