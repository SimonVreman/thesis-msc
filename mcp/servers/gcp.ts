import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const instances = [
  { name: "e2-micro", vcpu: 2, memory: 2, price: 0.0184 },
  { name: "n4-highcpu-2", vcpu: 2, memory: 4, price: 0.088 },
  { name: "n2-standard-2", vcpu: 2, memory: 8, price: 0.1044 },
  { name: "n4-highmem-2", vcpu: 2, memory: 16, price: 0.137 },
  { name: "n4-highcpu-4", vcpu: 4, memory: 8, price: 0.1761 },
  { name: "n2-standard-4", vcpu: 4, memory: 16, price: 0.2087 },
  { name: "n2-standard-8", vcpu: 8, memory: 32, price: 0.4174 },
  { name: "n4-highmem-8", vcpu: 8, memory: 64, price: 0.5479 },
  { name: "n2-standard-16", vcpu: 16, memory: 64, price: 0.8348 },
  { name: "n2-standard-32", vcpu: 32, memory: 128, price: 1.6697 },
  { name: "n2-standard-48", vcpu: 48, memory: 192, price: 2.5045 },
] as const;

export function createGCP() {
  const server = new McpServer({
    name: "Google Cloud Platform",
    version: "1.0.0",
  });

  server.tool(
    "machines",
    "Overview of available machine types with vCPU and memory.",
    async () => ({
      content: instances.map((instance) => ({
        type: "text",
        text: `NAME: ${instance.name}; VCPU: ${instance.vcpu}; MEMORY: ${instance.memory};`,
      })),
    })
  );

  server.tool(
    "price",
    "Price for one hour of a specific machine type.",
    { type: z.string() },
    async ({ type }) => {
      const price = instances.find((p) => p.name === type)?.price?.toString();

      if (price == null)
        return {
          isError: true,
          content: [{ type: "text", text: "ERR: machine type not found." }],
        };

      return { content: [{ type: "text", text: price }] };
    }
  );

  return server;
}
