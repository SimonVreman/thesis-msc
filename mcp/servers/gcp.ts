import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { textError, textSuccess } from "../lib/response";
import { gcpInstanceTypes, providerByUUID } from "../registry/instance-types";
import { prisma } from "../lib/prisma";

const toolname = <T extends string>(name: T) => `gcp.${name}` as const;
const tooldescription = <T extends string>(description: T) =>
  `GCP: ${description}` as const;

export function createGCP() {
  const server = new McpServer({
    name: "Google Cloud Platform",
    version: "1.0.0",
  });

  server.tool(
    toolname("machines"),
    tooldescription(
      "Overview of available machine types with vCPU and memory."
    ),
    async () => ({
      content: gcpInstanceTypes.map((instance) => ({
        type: "text",
        text: JSON.stringify({
          name: instance.name,
          vcpu: instance.vcpu,
          memory:
            JSON.stringify(instance.memory) +
            (typeof instance.memory === "object" ? " per core" : ""),
        }),
      })),
    })
  );

  server.tool(
    toolname("machine-price"),
    tooldescription("Price for one hour of a specific machine type."),
    { type: z.string() },
    async ({ type }) => {
      const price = gcpInstanceTypes
        .find((p) => p.name === type)
        ?.price?.toString();

      if (price == null) return textError("ERR: machine type not found.");

      return textSuccess(JSON.stringify({ price }));
    }
  );

  server.tool(
    toolname("usage"),
    tooldescription("Get the usage of a specific machine."),
    { id: z.string() },
    async ({ id }) => {
      const vm = await prisma.virtual_machine.findFirst({
        where: { id: { equals: id } },
      });

      if (!vm || providerByUUID(vm.uuid) !== "gcp")
        return textError(`ERR: machine with ID ${id} not found.`);

      return textSuccess(
        JSON.stringify({
          max_cpu: vm.max_cpu,
          avg_cpu: vm.avg_cpu,
          p95_max_cpu: vm.p95_max_cpu,
        })
      );
    }
  );

  return server;
}
