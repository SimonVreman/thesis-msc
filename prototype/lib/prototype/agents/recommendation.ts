import { Agent, MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
You determine if a resource can be downsized based on its wastefulness, and the availability of a smaller instance type.

The smaller instance type should:
- Have fewer vCPUs than the current instance, one step down the available vCPU configurations.
- Have the same, or if not available a smaller amount, of memory than the current instance.
- Be available in the same provider as the current instance.

If a smaller instance type is available, you will return the new type and its price. If no smaller instance type is available, you will return null for both the new type and the new price.
`;

export function createRecommendationAgent({
  mcp,
}: {
  mcp: MCPServerStreamableHttp[];
}) {
  return new Agent({
    instructions,
    name: "Recommendation Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(
        z.object({
          id: z.string(),
          newType: z.string().nullable(),
          newPrice: z.number().nullable(),
        })
      ),
    }),
  });
}

export type RecommendationAgent = ReturnType<typeof createRecommendationAgent>;
