import { run } from "@openai/agents";
import type { Agents } from "./agents/constants";
import type { Scenario } from "../types";
import { mergeById } from "../utils";

const maxTurns = 20;

export async function runPrototype({
  scenario,
  agents,
}: {
  scenario: Scenario;
  agents: Agents;
}) {
  const providers = scenario.instances
    .map((i) => i.provider)
    .filter((v, i, a) => a.indexOf(v) === i);

  const offerings = await Promise.all(
    providers.map(async (p) => ({
      name: p,
      types: (await run(agents.offering, p)).finalOutput?.offering ?? [],
    }))
  );

  const [prices, usage] = await Promise.all([
    run(agents.price, JSON.stringify(scenario), { maxTurns }),
    run(
      agents.usage,
      JSON.stringify(
        scenario.instances.map(({ id, provider }) => ({ id, provider }))
      ),
      { maxTurns }
    ),
  ]);

  if (prices.finalOutput == null) throw new Error("Price agent failed");
  if (usage.finalOutput == null) throw new Error("Usage agent failed");

  const waste = await run(
    agents.waste,
    JSON.stringify(usage.finalOutput.results)
  );

  if (waste.finalOutput == null) throw new Error("Waste agent failed");

  const shouldDownsize = mergeById(
    scenario.instances,
    waste.finalOutput.results
  )
    .filter((r) => r.wasteful)
    .map(({ id, type, provider }) => ({ id, type, provider }));

  const downsized = await Promise.all(
    shouldDownsize.map(async ({ id, type, provider }) => {
      const options = offerings.find((r) => r.name === provider)?.types;

      if (!options) return { id, newType: null };

      const output = await run(
        agents.downsize,
        JSON.stringify({ instance: { id, type }, options })
      );

      return { id, newType: output.finalOutput?.newType || null };
    })
  );

  const recommendationPrices = await run(
    agents.price,
    JSON.stringify(
      mergeById(scenario.instances, downsized)
        .map((r) => ({ id: r.id, type: r.newType, provider: r.provider }))
        .filter((r) => !!r.type)
    )
  );

  if (recommendationPrices.finalOutput == null)
    throw new Error("Recommendation prices agent failed");

  return mergeById(
    scenario.instances,
    prices.finalOutput.results,
    usage.finalOutput.results,
    waste.finalOutput.results,
    downsized,
    recommendationPrices.finalOutput.results.map(({ id, price: newPrice }) => ({
      id,
      newPrice,
    }))
  );
}
