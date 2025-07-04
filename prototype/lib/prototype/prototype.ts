import { run } from "@openai/agents";
import type { Agents } from "./agents/constants";

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
  scenario: string;
  agents: Agents;
}) {
  debug("Starting simulation");
  const providers = await run(agents.provider, scenario);

  if (providers.finalOutput == null)
    throw new Error("Provider agent failed to return output");

  debug("Got providers");
  const scenarioWithProviders = JSON.stringify(providers.finalOutput);

  const [prices, usage] = await Promise.all([
    run(agents.price, scenarioWithProviders, { maxTurns }),
    run(agents.usage, scenarioWithProviders, { maxTurns }),
  ]);

  if (prices.finalOutput == null)
    throw new Error("Price agent failed to return output");
  if (usage.finalOutput == null)
    throw new Error("Usage agent failed to return output");

  debug("Got prices and usage");

  const waste = await run(agents.waste, JSON.stringify(usage.finalOutput));

  if (waste.finalOutput == null)
    throw new Error("Waste agent failed to return output");

  debug("Got waste determination");

  return (JSON.parse(scenario).instances as any[]).map(
    ({ id }: { id: string }) => ({
      id,
      p95Cpu: usage.finalOutput?.results.find((r) => r.id === id)?.p95Cpu,
      price: prices.finalOutput?.results.find((r) => r.id === id)?.price,
      wasteful: waste.finalOutput?.results.find((r) => r.id === id)?.wasteful,
    })
  );
}
