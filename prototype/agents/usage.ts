import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";

const instructions = `
You retrieve the usage of cloud virtual machines (instances) from different providers.
Your input is a list of instances, each with an ID and type.
For each instance, you will find the usage data using the MCP tool for that provider.
You will return the usage in a structured format, one entry per instance.
`;

export function createUsageAgent({ mcp }: { mcp: MCPServerStreamableHttp[] }) {
  return new Agent({
    instructions,
    name: "Usage Retrieval Agent",
    model: "litellm/gemini/gemini-2.0-flash-lite",
    mcpServers: mcp,
    modelSettings: { toolChoice: "required" },
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), avgCpu: z.number() })),
    }),
  });
}

export type UsageAgent = ReturnType<typeof createUsageAgent>;
