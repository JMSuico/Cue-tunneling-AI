"""
SDK Bridge — Antigravity Python SDK ↔ OpenAI-compatible proxy

Reads OpenAI-format messages from stdin (JSON array), runs them through
the Antigravity SDK Agent, and outputs either:
  - Streaming: NDJSON lines {"type":"token","content":"..."} to stdout
  - Non-streaming: Single JSON {"response":"...","usage":{...}} to stdout

Usage:
  echo '[{"role":"user","content":"Hello"}]' | python sdk_bridge.py            # non-streaming
  echo '[{"role":"user","content":"Hello"}]' | python sdk_bridge.py --stream   # streaming
"""

import asyncio
import json
import sys

async def main():
    is_stream = '--stream' in sys.argv

    # Read messages from stdin
    raw = sys.stdin.read()
    try:
        messages = json.loads(raw)
    except json.JSONDecodeError as e:
        error = {"type": "error", "message": f"Invalid JSON input: {e}"}
        print(json.dumps(error), flush=True)
        return

    # Extract system instructions and build conversation prompt
    system_instructions = ""
    conversation_parts = []

    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")

        if isinstance(content, list):
            # Multimodal: extract text parts
            content = "\n".join(
                c.get("text", "") for c in content if c.get("type") == "text"
            )

        if role == "system":
            system_instructions = content
        elif role == "user":
            conversation_parts.append(f"User: {content}")
        elif role == "assistant":
            conversation_parts.append(f"Assistant: {content}")

    prompt = "\n\n".join(conversation_parts)

    try:
        from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

        config = LocalAgentConfig(
            system_instructions=system_instructions or "You are a helpful AI assistant.",
            capabilities=CapabilitiesConfig(),
        )

        async with Agent(config) as agent:
            response = await agent.chat(prompt)

            if is_stream:
                full_text = ""
                async for token in response:
                    full_text += token
                    print(json.dumps({"type": "token", "content": token}), flush=True)
                # Signal completion
                print(json.dumps({"type": "done", "full_text": full_text}), flush=True)
            else:
                full_text = ""
                async for token in response:
                    full_text += token
                result = {
                    "response": full_text,
                    "usage": {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0
                    }
                }
                print(json.dumps(result), flush=True)

    except ImportError:
        error_msg = "Antigravity SDK not installed. Run: pip install google-antigravity"
        if is_stream:
            print(json.dumps({"type": "error", "message": error_msg}), flush=True)
        else:
            print(json.dumps({"error": error_msg}), flush=True)
        sys.exit(1)
    except Exception as e:
        error_msg = f"SDK error: {str(e)}"
        if is_stream:
            print(json.dumps({"type": "error", "message": error_msg}), flush=True)
        else:
            print(json.dumps({"error": error_msg}), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
