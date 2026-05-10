import sys
import importlib

# --- PATCHING ---
def patched_import(name, globals=None, locals=None, fromlist=(), level=0):
    if name == 'google._upb._message':
        raise ImportError("google._upb._message is blocked for Python 3.14 compatibility")
    return original_import(name, globals, locals, fromlist, level)

original_import = __import__
import builtins
builtins.__import__ = patched_import

import ast
if not hasattr(ast, 'Num'):
    class NumPatch:
        def __init__(self, n): self.n = n
    ast.Num = NumPatch
if not hasattr(ast, 'Str'):
    class StrPatch:
        def __init__(self, s): self.s = s
    ast.Str = StrPatch
# --- END PATCHING ---

import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
print("Available Models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
