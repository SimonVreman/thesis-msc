import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PrismaClient } from "../generated/prisma";
import { textError, textSuccess } from "../lib/response";
import { gcpInstanceTypes } from "../registry/instance-types";

const toolname = <T extends string>(name: T) => `gcp.${name}` as const;
const prisma = new PrismaClient();

export function createGCP() {
  const server = new McpServer({
    name: "Google Cloud Platform",
    version: "1.0.0",
  });

  server.tool(
    toolname("machines"),
    "Overview of available machine types with vCPU and memory.",
    async () => ({
      content: gcpInstanceTypes.map((instance) => ({
        type: "text",
        text: `NAME: ${instance.name}; VCPU: ${instance.vcpu}; MEMORY: ${instance.memory};`,
      })),
    })
  );

  server.tool(
    toolname("machine-price"),
    "Price for one hour of a specific machine type.",
    { type: z.string() },
    async ({ type }) => {
      const price = gcpInstanceTypes
        .find((p) => p.name === type)
        ?.price?.toString();

      if (price == null) return textError("ERR: machine type not found.");

      return { content: [{ type: "text", text: price }] };
    }
  );

  server.tool(
    toolname("usage"),
    "Get the usage of a specific machine.",
    { id: z.string() },
    async ({ id }) => {
      const vm = await prisma.virtual_machine.findFirst({
        where: { id: { equals: id } },
      });

      if (!vm) return textError(`ERR: machine with ID ${id} not found.`);

      return textSuccess(
        `Max CPU: ${vm.max_cpu}, Avg CPU: ${vm.avg_cpu}, P95 Max CPU: ${vm.p95_max_cpu}`
      );
    }
  );

  return server;
}
