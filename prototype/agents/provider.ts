import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";

const instructions = `
You retrieve the provider of cloud virtual machines (instances) from a configuration.
Your input is a list of instances, each with an ID and type.
Retrieve the provider for each instance, based on its type, from the provider.
You will return the providers in a structured format, one entry per instance.
Always pick a provider, never return an empty provider.
`;

export function createProviderAgent({
  mcp,
}: {
  mcp: MCPServerStreamableHttp[];
}) {
  return new Agent({
    instructions,
    name: "Provider Retrieval Agent",
    model: "gpt-4o-mini",
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(
        z.object({ id: z.string(), type: z.string(), provider: z.string() })
      ),
    }),
  });
}

export type ProviderAgent = ReturnType<typeof createProviderAgent>;
