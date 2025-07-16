import {
  instanceTypes,
  providerById,
  vmInstanceTypeMap,
} from "../registry/instance-types";
import { prisma } from "./prisma";
import { Scenario } from "./scenario";
import { type Express } from "express";

export function attachSanityHandler(app: Express) {
  app.post("/sanity", async (req, res) => {
    const { data: scenario } = Scenario.safeParse(req.body);

    if (!scenario) {
      res.status(400).json({ error: "Invalid scenario data" });
      return;
    }

    const sanity = {
      instances: [] as {
        id: string;
        p95: number;
        avg: number;
        price?: number;
        name: string;
        provider: string;
      }[],
    };

    for (const { id, type } of scenario.instances) {
      const vm = await prisma.virtual_machine.findFirst({
        where: { id: { equals: id } },
      });

      if (!vm) {
        console.warn(`VM with id ${id} not found`);
        continue;
      }

      const provider = providerById(vm.id);
      const { name } = vmInstanceTypeMap({
        vcpu: vm.cores,
        memory: vm.memory,
        provider,
      })!;

      const price = instanceTypes.find((p) => p.name === type)?.price;
      const p95 = vm.p95_max_cpu;
      const avg = vm.avg_cpu;

      sanity.instances.push({
        id,
        p95,
        avg,
        price: typeof price === "object" ? undefined : price,
        name,
        provider,
      });
    }

    res.json(sanity);
  });
}
