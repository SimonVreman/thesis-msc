import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";

const instructions = `
You retrieve the usage of cloud virtual machines (instances) from different providers.
Your input is a list of instances, each with an ID, type and provider.
For each instance, you will find the usage data using the MCP tool for that provider.
Make sure that you request the usage data from the correct provider, that is the provider than belongs to the instance with the given id.
You will return the usage in a structured format, one entry per instance.
`;

export function createUsageAgent({ mcp }: { mcp: MCPServerStreamableHttp[] }) {
  return new Agent({
    instructions,
    name: "Usage Retrieval Agent",
    model: "gpt-4o-mini",
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), avgCpu: z.number() })),
    }),
  });
}

export type UsageAgent = ReturnType<typeof createUsageAgent>;
