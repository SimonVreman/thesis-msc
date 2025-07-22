import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { awsInstanceTypes, providerById } from "../registry/instance-types";
import { prisma } from "../lib/prisma";
import { textError, textSuccess } from "../lib/response";

const toolname = <T extends string>(name: T) => `aws.${name}` as const;
const tooldescription = <T extends string>(description: T) =>
  `AWS: ${description}` as const;

export function createAws() {
  const server = new McpServer({
    name: "AWS",
    version: "1.0.0",
  });

  server.tool(
    toolname("available-instances"),
    tooldescription(
      "Get a list of available instance types with their vCPU and memory."
    ),
    async () => ({
      content: awsInstanceTypes.map((instance) => ({
        type: "text",
        text: `${instance.name}: ${instance.vcpu} vCPU, ${instance.memory} GB memory`,
      })),
    })
  );

  server.tool(
    toolname("instance-price"),
    tooldescription("Get the hourly price of a specific instance type."),
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

      if (!vm || providerById(vm.id) !== "aws")
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
