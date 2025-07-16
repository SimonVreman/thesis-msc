import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Determine the cloud provider for each virtual machine instance based on its type, using MCP resources and a predefined list of valid providers.

Input:
A list of instances. Each instance includes:

    id: a unique identifier

    type: the instance type (used to determine the provider)

Valid Providers:
Each provider must be exactly one of the following:

    "aws"

    "gcp"

    "azure"

Available Resources:
You have access to MCP resources that list the instance types available for each cloud provider.

Instructions:

    Use the MCP resources to identify which provider supports each instance type.

    Assign exactly one provider ("aws", "gcp", or "azure") to every instance.

    Never leave a provider empty or undefined.

    If a type appears under multiple providers, apply a consistent and deterministic strategy to select one (e.g., prioritize in the order: aws > gcp > azure).

Output:
Return a structured list, where each entry contains:

    id: the original instance ID

    provider: the resolved provider name ("aws", "gcp", or "azure")
`;

export function createProviderAgent({
  mcp,
}: {
  mcp: MCPServerStreamableHttp[];
}) {
  return new Agent({
    instructions,
    name: "Provider Retrieval Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), provider: z.string() })),
    }),
  });
}

export type ProviderAgent = ReturnType<typeof createProviderAgent>;
