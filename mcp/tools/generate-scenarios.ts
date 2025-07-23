import type { virtual_machine } from "../generated/prisma";
import { prisma } from "../lib/prisma";
import type { Scenario } from "../lib/scenario";
import { providerById, vmInstanceTypeMap } from "../registry/instance-types";

const outputDirectory = "./generated/scenarios";
const scenarioCount = 10000;
const maxScenarioSize = 10; // Maximum size of a scenario.

let skip = 0;

for (let scenarioIndex = 0; scenarioIndex < scenarioCount; scenarioIndex++) {
  const scenarioSize = (scenarioIndex % maxScenarioSize) + 1;
  const scenario: Scenario = { instances: [] };

  const vms: virtual_machine[] =
    await prisma.$queryRaw`SELECT * FROM virtual_machine ORDER BY reverse(id) LIMIT ${scenarioSize} OFFSET ${skip}`;

  for (let vmIndex = 0; vmIndex < vms.length; vmIndex++) {
    const vm = vms[vmIndex];
    const provider = providerById(vm.id);

    const type = vmInstanceTypeMap({
      vcpu: vm.cores,
      memory: vm.memory,
      provider,
    });

    if (!type)
      throw new Error(
        `No instance type found for VM ${vm.id} with vCPU ${vm.cores} and memory ${vm.memory}`
      );

    scenario.instances.push({ id: vm.id, type: type.name, provider });
  }

  const scenarioFileName = `${outputDirectory}/scenario-${scenarioIndex}.json`;
  Bun.write(scenarioFileName, JSON.stringify(scenario, null, 2));

  skip += scenarioSize;
}
