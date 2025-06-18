import { randomUUIDv7 } from "bun";
import { instanceTypes } from "../registry/instance-types";

const outputDirectory = "../generated/scenarios";
const scenarioCount = 10;

type Scenario = {
  instances: { id: string; type: string }[];
};

const getRandomInstanceType = () =>
  instanceTypes[Math.floor(Math.random() * instanceTypes.length)];

for (let i = 0; i < scenarioCount; i++) {
  const scenarioSize = (i % 5) + 1;
  const scenario: Scenario = { instances: [] };

  for (let j = 0; j < scenarioSize; j++)
    scenario.instances.push({
      id: randomUUIDv7(),
      type: getRandomInstanceType().name,
    });

  const scenarioFileName = `${outputDirectory}/scenario-${i}.json`;
  Bun.write(scenarioFileName, JSON.stringify(scenario, null, 2));
}
