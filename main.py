from agents import Agent, Runner
from phoenix.otel import register

tracer_provider = register(
    project_name="thesis",
    auto_instrument=True,
)

first_layer_agent = Agent(
    name="Assistant",
    instructions="You are a helpful assistant",
    model="litellm/gemini/gemini-2.0-flash-lite",
)

result = Runner.run_sync(agent, "Write a haiku about recursion in programming.")

print(result.final_output)
