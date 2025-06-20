import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { azureInstanceTypes, providerById } from "../registry/instance-types";
import { textError, textSuccess } from "../lib/response";
import { prisma } from "../lib/prisma";

const toolname = <T extends string>(name: T) => `azure.${name}` as const;

export function createAzure() {
  const server = new McpServer({
    name: "Azure",
    version: "1.0.0",
  });

  server.tool(
    toolname("instances"),
    "Overview of available instance types with vCPU and memory.",
    async () => ({
      content: azureInstanceTypes.map((instance) => ({
        type: "text",
        text: `${instance.name} with ${instance.vcpu} vCPUs and ${instance.memory} GB of memory`,
      })),
    })
  );

  server.tool(
    toolname("price"),
    "Price per hour of a specific instance type.",
    { type: z.string() },
    async ({ type }) => {
      const price = azureInstanceTypes
        .find((p) => p.name === type)
        ?.price?.toString();

      if (price == null) return textError("Type not found.");

      return { content: [{ type: "text", text: price }] };
    }
  );

  server.tool(
    toolname("usage"),
    "Usage by machine ID.",
    { id: z.string() },
    async ({ id }) => {
      const vm = await prisma.virtual_machine.findFirst({
        where: { id: { equals: id } },
      });

      if (!vm || providerById(vm.id) !== "azure")
        return textError(`ERR: machine with ID ${id} not found.`);

      return textSuccess(
        `Max CPU: ${vm.max_cpu}, Avg CPU: ${vm.avg_cpu}, P95 Max CPU: ${vm.p95_max_cpu}`
      );
    }
  );

  return server;
}
