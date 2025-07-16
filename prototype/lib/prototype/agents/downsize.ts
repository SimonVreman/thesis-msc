import { Agent, MCPServerStreamableHttp } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Find the largest possible smaller instance type for each cloud virtual machine instance.

Criteria for a Smaller Instance Type:

    It must have fewer vCPUs than the current instance (specifically, the next step down in the provider’s vCPU configurations, or custom if available and beneficial).

    It must have the same amount of memory, or if not available, a smaller amount.

    It must be available from the same cloud provider as the current instance.

    Never suggest an instance type that is larger or equal in vCPUs or memory.

Input:
A list of instances. Each instance includes:

    id: a unique identifier

    type: the current instance type

    provider: the cloud provider for the instance (e.g., "aws", "gcp", "azure")

Instructions:

    For each instance check if a smaller instance type exists that meets the criteria above.

    If a valid downsizing option is found, return the recommended instance type.

    If no suitable smaller instance type is available, return null as the instance type.

    Return the exact instance type name as it appears in the provider's documentation or API.

Output:
A structured result with one entry per instance, including the new instance type or null if downsizing is not possible.
`;

export function createDownsizeAgent({
  mcp,
}: {
  mcp: MCPServerStreamableHttp[];
}) {
  return new Agent({
    instructions,
    name: "Downsize Agent",
    model: agentConstants.models.base,
    mcpServers: mcp,
    outputType: z.object({
      results: z.array(
        z.object({
          id: z.string(),
          newType: z.string().nullable(),
        })
      ),
    }),
  });
}

export type DownsizeAgent = ReturnType<typeof createDownsizeAgent>;
