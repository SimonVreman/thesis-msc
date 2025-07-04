import { Agent, type MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
You retrieve the prices of cloud virtual machines (instances) from different providers.
Your input is a list of instances, each with an ID, type and provider.
You will find the price using the MCP tool for that provider.
You will return the prices in a structured format, one entry per instance.
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
