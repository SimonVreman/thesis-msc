import { run } from "@openai/agents";
import type { Agents } from "./agents/constants";
import type { Scenario } from "../types";
import { mergeById } from "../utils";

const maxTurns = 20;
const debugMessages: boolean = false;

function debug(message: string) {
  if (debugMessages !== true) return;
  console.log("[Simulation] " + message);
}

export async function runPrototype({
  scenario,
  agents,
}: {
  scenario: Scenario;
  agents: Agents;
}) {
  debug("Starting simulation");
  const providers = await run(agents.provider, JSON.stringify(scenario));

  if (providers.finalOutput == null)
    throw new Error("Provider agent failed to return output");

  debug("Got providers");

  const scenarioWithProviders = JSON.stringify(
    mergeById(providers.finalOutput.results, scenario.instances)
  );

  const [prices, usage] = await Promise.all([
    run(agents.price, scenarioWithProviders, { maxTurns }),
    run(agents.usage, scenarioWithProviders, { maxTurns }),
  ]);

  if (prices.finalOutput == null)
    throw new Error("Price agent failed to return output");
  if (usage.finalOutput == null)
    throw new Error("Usage agent failed to return output");

  debug("Got prices and usage");

  const waste = await run(
    agents.waste,
    JSON.stringify(usage.finalOutput.results)
  );

  if (waste.finalOutput == null)
    throw new Error("Waste agent failed to return output");

  debug("Got waste determination");

  const recommendation = await run(
    agents.recommendation,
    JSON.stringify(
      mergeById(
        scenario.instances,
        providers.finalOutput.results,
        waste.finalOutput.results
      )
    )
  );

  if (recommendation.finalOutput == null)
    throw new Error("Recommendation agent failed to return output");

  debug("Got recommendations");

  return mergeById(
    scenario.instances,
    providers.finalOutput.results,
    prices.finalOutput.results,
    usage.finalOutput.results,
    waste.finalOutput.results,
    recommendation.finalOutput.results
  );
}
