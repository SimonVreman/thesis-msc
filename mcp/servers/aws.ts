import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const instances = [
  { name: "t3a.small", vcpu: 2, memory: 2, price: 0.0204 },
  { name: "c5.large", vcpu: 2, memory: 4, price: 0.096 },
  { name: "m5.large", vcpu: 2, memory: 8, price: 0.107 },
  { name: "r5.large", vcpu: 2, memory: 16, price: 0.141 },
  { name: "c5.xlarge", vcpu: 4, memory: 8, price: 0.192 },
  { name: "m5.xlarge", vcpu: 4, memory: 16, price: 0.214 },
  { name: "m5.2xlarge", vcpu: 8, memory: 32, price: 0.428 },
  { name: "r5.2xlarge", vcpu: 8, memory: 64, price: 0.564 },
  { name: "m5.4xlarge", vcpu: 16, memory: 64, price: 0.856 },
  { name: "m5.8xlarge", vcpu: 32, memory: 128, price: 1.712 },
  { name: "m5.12xlarge", vcpu: 48, memory: 192, price: 2.568 },
] as const;

export function createAws() {
  const server = new McpServer({
    name: "AWS",
    version: "1.0.0",
  });

  server.tool(
    "available-instances",
    "Get a list of available instance types with their vCPU and memory.",
    async () => ({
      content: instances.map((instance) => ({
        type: "text",
        text: `${instance.name}: ${instance.vcpu} vCPU, ${instance.memory} GB memory`,
      })),
    })
  );

  server.tool(
    "instance-price",
    "Get the hourly price of a specific instance type.",
    { name: z.string() },
    async ({ name }) => {
      const price = instances.find((p) => p.name === name)?.price?.toString();

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
