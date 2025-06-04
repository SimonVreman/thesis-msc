import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const instances = [
  { name: "D2ls v5", vcpu: 2, memory: 4, price: 0.097 },
  { name: "D2 v5", vcpu: 2, memory: 8, price: 0.115 },
  { name: "E2as v6", vcpu: 2, memory: 16, price: 0.144 },
  { name: "D4ls v5", vcpu: 4, memory: 8, price: 0.194 },
  { name: "D4 v5", vcpu: 4, memory: 16, price: 0.23 },
  { name: "D8 v5", vcpu: 8, memory: 32, price: 0.46 },
  { name: "E8as v5", vcpu: 8, memory: 64, price: 0.548 },
  { name: "D16 v5", vcpu: 16, memory: 64, price: 0.92 },
  { name: "D32 v5", vcpu: 32, memory: 128, price: 1.84 },
  { name: "D48 v5", vcpu: 48, memory: 192, price: 2.76 },
] as const;

const instancePrice = (name: string): string | undefined =>
  instances.find((p) => p.name === name)?.price?.toString();

export function createAzure() {
  const server = new McpServer({
    name: "Azure",
    version: "1.0.0",
  });

  server.tool(
    "instances",
    "Overview of available instance types with vCPU and memory.",
    async () => ({
      content: instances.map((instance) => ({
        type: "text",
        text: `${instance.name} with ${instance.vcpu} vCPUs and ${instance.memory} GB of memory`,
      })),
    })
  );

  server.tool(
    "price",
    "Price per hour of a specific instance type.",
    { type: z.string() },
    async ({ type }) => {
      const price = instances.find((p) => p.name === type)?.price?.toString();

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
