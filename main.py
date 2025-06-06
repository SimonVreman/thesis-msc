import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp, MCPServer
from agents.model_settings import ModelSettings
from phoenix.otel import register
from typing import List, TypedDict
import json


# CONFIGURATION
SCENARIO_COUNT = 10

tracer_provider = register(
    project_name="thesis",
    auto_instrument=True,
    endpoint="http://0.0.0.0:6006/v1/traces",
)


class Instance(TypedDict):
    """Definition of an instance"""

    id: str
    type: str


class Scenario(TypedDict):
    """Definition of instances for a cloud provider."""

    instances: List[Instance]


def read_scenario(path: str) -> Scenario:
    """Read a scenario definition from a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data  # type: ignore


async def run_scenario(scenario: Scenario, mcp_servers: list[MCPServer]) -> None:
    """Run a scenario with the given MCP servers."""

    price_agent = Agent(
        name="Price Retrieval Agent",
        instructions="""
            You retrieve the prices of cloud virtual machines (instances) from different providers.

            Example input:
            [
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "D4ls v5"},
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "m5.4xlarge"},
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "n2-standard-8"}
            ]

            For each instance, you will first get the available types from each provider.
            Then, you will find the price using the MCP tool for that provider.
            You will return the prices in a structured format.
            The output should be a list of dictionaries, each containing the instance ID, type, and price.

            Example output (do not include a code block):
            [
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "D4ls v5", "price": 0.123},
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "m5.4xlarge", "price": 0.456},
                {"id": "7d1c6fe8-f263-42f2-a632-d6b02c5ed809", "type": "n2-standard-8", "price": 0.789}
            ]
        """,
        model="litellm/gemini/gemini-2.0-flash-lite",
        mcp_servers=mcp_servers,
        model_settings=ModelSettings(tool_choice="required"),
    )

    result = await Runner.run(
        starting_agent=price_agent, input=json.dumps(scenario["instances"])
    )
    print(result.final_output)


async def main():
    base_url = "http://localhost"

    async with MCPServerStreamableHttp(
        name="Azure MCP Server", params={"url": f"{base_url}:5050/mcp"}
    ) as azure_mcp, MCPServerStreamableHttp(
        name="AWS MCP Server", params={"url": f"{base_url}:5051/mcp"}
    ) as aws_mcp, MCPServerStreamableHttp(
        name="GCP MCP Server", params={"url": f"{base_url}:5052/mcp"}
    ) as gcp_mcp:

        for i in range(SCENARIO_COUNT):
            scenario = read_scenario(f"scenarios/generated/scenario-{i}.json")
            print(f"Running scenario {i} with {len(scenario['instances'])} instances")
            await run_scenario(scenario, [azure_mcp, aws_mcp, gcp_mcp])


if __name__ == "__main__":
    asyncio.run(main())
