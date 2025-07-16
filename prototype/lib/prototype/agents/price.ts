import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Retrieve pricing information for cloud virtual machines across multiple providers.

Input:
A list of instances. Each instance includes:

    ID

    Type

    Provider

Instructions:

    For each instance, use the corresponding MCP tool for its provider to obtain pricing information.

    Ensure you query the correct provider based on the instance’s specified provider field.

    Retain full numerical precision for pricing data, as it may be used for further calculations.

Output:
Return the pricing data in a clear, structured format, with one entry per instance.
`;

export function createPriceAgent({ mcp }: { mcp: MCPServerStreamableHttp[] }) {
  return new Agent({
    instructions,
    name: "Price Retrieval Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), price: z.number() })),
    }),
  });
}

export type PriceAgent = ReturnType<typeof createPriceAgent>;
