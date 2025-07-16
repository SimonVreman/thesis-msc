import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Retrieve usage data for cloud virtual machines across multiple providers.

Input:
A list of instances. Each instance includes:

    ID

    Type

    Provider

Instructions:

    For each instance, use the appropriate MCP tool specific to its provider to obtain usage data, specifically the average CPU usage.

    Ensure that usage data is requested from the correct provider—the one associated with the given instance ID.

    Retain full numerical precision for usage data, as it may be used for further calculations.

Output:
Return the usage data in a clear, structured format, with one entry per instance.
`;

export function createUsageAgent({ mcp }: { mcp: MCPServerStreamableHttp[] }) {
  return new Agent({
    instructions,
    name: "Usage Retrieval Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), avgCpu: z.number() })),
    }),
  });
}

export type UsageAgent = ReturnType<typeof createUsageAgent>;
