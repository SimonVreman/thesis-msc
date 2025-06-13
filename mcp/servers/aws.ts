import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { awsInstanceTypes } from "../registry/instance-types";

export function createAws() {
  const server = new McpServer({
    name: "AWS",
    version: "1.0.0",
  });

  server.tool(
    "aws.available-instances",
    "Get a list of available instance types with their vCPU and memory.",
    async () => ({
      content: awsInstanceTypes.map((instance) => ({
        type: "text",
        text: `${instance.name}: ${instance.vcpu} vCPU, ${instance.memory} GB memory`,
      })),
    })
  );

  server.tool(
    "aws.instance-price",
    "Get the hourly price of a specific instance type.",
    { name: z.string() },
    async ({ name }) => {
      const price = awsInstanceTypes
        .find((p) => p.name === name)
        ?.price?.toString();

      if (price == null)
        return {
          isError: true,
          content: [{ type: "text", text: "Error: Instance type not found." }],
        };

      return { content: [{ type: "text", text: price }] };
    }
  );

  return server;
}
