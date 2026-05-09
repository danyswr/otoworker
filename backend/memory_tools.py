import os
import chromadb
from chromadb.config import Settings
from langchain.tools import tool

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")

# Setup Chroma DB
client = chromadb.PersistentClient(
    path=CHROMA_DB_DIR,
    settings=Settings(anonymized_telemetry=False)
)

# Get or create collection
collection = client.get_or_create_collection(name="swarm_memory")

@tool("Store Memory Tool")
def store_memory_tool(topic: str, content: str) -> str:
    """Use this tool to store a proven solution or important knowledge into your long-term memory.
    Arguments must be exactly a string 'topic' and a string 'content'.
    """
    try:
        # Generate a simple ID based on count
        mem_id = f"mem_{collection.count() + 1}"
        collection.add(
            documents=[content],
            metadatas=[{"topic": topic}],
            ids=[mem_id]
        )
        return f"Successfully stored memory with ID {mem_id} for topic: {topic}"
    except Exception as e:
        return f"Error storing memory: {str(e)}"

@tool("Search Memory Tool")
def search_memory_tool(query: str) -> str:
    """Use this tool to search your long-term memory for past solutions or related knowledge.
    Provide the search 'query' as argument.
    """
    try:
        results = collection.query(
            query_texts=[query],
            n_results=2
        )
        if results['documents'] and results['documents'][0]:
            docs = results['documents'][0]
            metas = results['metadatas'][0]
            output = "Found the following memories:\n"
            for doc, meta in zip(docs, metas):
                output += f"- Topic: {meta.get('topic')}\n  Content: {doc}\n"
            return output
        else:
            return "No relevant memories found."
    except Exception as e:
        return f"Error searching memory: {str(e)}"
