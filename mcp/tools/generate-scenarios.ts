import { prisma } from "../lib/prisma";
import type { Scenario } from "../lib/scenario";
import { providerById, vmInstanceTypeMap } from "../registry/instance-types";

const outputDirectory = "./generated/scenarios";
const scenarioCount = 100;
const maxScenarioSize = 10; // Maximum size of a scenario.

let skip = 0;

for (let scenarioIndex = 0; scenarioIndex < scenarioCount; scenarioIndex++) {
  const scenarioSize = (scenarioIndex % maxScenarioSize) + 1;
  const scenario: Scenario = { instances: [] };

  const vms = await prisma.virtual_machine.findMany({
    skip,
    take: scenarioSize,
    orderBy: { created: "asc" },
    where: { OR: [{ cores: { not: 2 } }, { memory: { not: 2 } }] }, // TODO not available in all providers, should be
  });

  for (let vmIndex = 0; vmIndex < vms.length; vmIndex++) {
    const vm = vms[vmIndex];

    const type = vmInstanceTypeMap({
      vcpu: vm.cores,
      memory: vm.memory,
      provider: providerById(vm.id),
    });

    if (!type)
      throw new Error(
        `No instance type found for VM ${vm.id} with vCPU ${vm.cores} and memory ${vm.memory}`
      );

    scenario.instances.push({ id: vm.id, type: type.name });
  }

  const scenarioFileName = `${outputDirectory}/scenario-${scenarioIndex}.json`;
  Bun.write(scenarioFileName, JSON.stringify(scenario, null, 2));

  skip += scenarioSize;
}
