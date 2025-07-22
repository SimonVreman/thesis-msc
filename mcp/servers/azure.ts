import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { azureInstanceTypes, providerById } from "../registry/instance-types";
import { textError, textSuccess } from "../lib/response";
import { prisma } from "../lib/prisma";

const toolname = <T extends string>(name: T) => `azure.${name}` as const;
const tooldescription = <T extends string>(description: T) =>
  `Azure: ${description}` as const;

export function createAzure() {
  const server = new McpServer({
    name: "Azure",
    version: "1.0.0",
  });

  server.tool(
    toolname("instances"),
    tooldescription(
      "Overview of available instance types with vCPU and memory."
    ),
    async () => ({
      content: azureInstanceTypes.map((instance) => ({
        type: "text",
        text: `${instance.name} with ${instance.vcpu} vCPUs and ${instance.memory} GB of memory`,
      })),
    })
  );

  server.tool(
    toolname("price"),
    tooldescription("Price per hour of a specific instance type."),
    { type: z.string() },
    async ({ type }) => {
      const price = azureInstanceTypes
        .find((p) => p.name === type)
        ?.price?.toString();

      if (price == null) return textError("Type not found.");

      return textSuccess(JSON.stringify({ price }));
    }
  );

  server.tool(
    toolname("usage"),
    tooldescription("Usage by machine ID."),
    { id: z.string() },
    async ({ id }) => {
      const vm = await prisma.virtual_machine.findFirst({
        where: { id: { equals: id } },
      });

      if (!vm || providerById(vm.id) !== "azure")
        return textError(`ERR: machine with ID ${id} not found.`);

      return textSuccess(
        JSON.stringify({
          maxCpu: vm.max_cpu,
          averageCpu: vm.avg_cpu,
          p95MaxCpu: vm.p95_max_cpu,
        })
      );
    }
  );

  return server;
}
