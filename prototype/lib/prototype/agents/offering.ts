import {
  Agent,
  tool,
  type MCPServerStreamableHttp,
  type Tool,
} from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
You have been provided with MCP servers for each provider. These have a specific, unique, product offering. You task is to retrieve the offering for the provider given in the input.
`;

export async function createOfferingAgent({
  mcp,
}: {
  mcp: MCPServerStreamableHttp[];
}) {
  const tools: Tool[] = [];
  for (const server of mcp) {
    const listed = await server.listTools();
    for (const t of listed) {
      tools.push(
        tool({
          name: t.name,
          description: t.description ?? "",
          parameters: z.object({}),
          execute: async (args) => {
            return await server.callTool(t.name, args);
          },
        })
      );
    }
  }

  return new Agent({
    instructions,
    name: "Product Offering Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    tools,
    outputType: z.object({
      offering: z.array(
        z.object({
          name: z.string(),
          vcpu: z.number(),
          memory: z.number(),
        })
      ),
    }),
  });
}

export type OfferingAgent = Awaited<ReturnType<typeof createOfferingAgent>>;
