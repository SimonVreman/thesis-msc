import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { azureInstanceTypes } from "../registry/instance-types";

export function createAzure() {
  const server = new McpServer({
    name: "Azure",
    version: "1.0.0",
  });

  server.tool(
    "azure.instances",
    "Overview of available instance types with vCPU and memory.",
    async () => ({
      content: azureInstanceTypes.map((instance) => ({
        type: "text",
        text: `${instance.name} with ${instance.vcpu} vCPUs and ${instance.memory} GB of memory`,
      })),
    })
  );

  server.tool(
    "azure.price",
    "Price per hour of a specific instance type.",
    { type: z.string() },
    async ({ type }) => {
      const price = azureInstanceTypes
        .find((p) => p.name === type)
        ?.price?.toString();

      if (price == null)
        return {
          isError: true,
          content: [{ type: "text", text: "Type not found." }],
        };

      return { content: [{ type: "text", text: price }] };
    }
  );

  return server;
}
