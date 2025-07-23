import {
  Agent,
  run,
  RunContext,
  RunResult,
  RunState,
  type AgentInputItem,
  type NonStreamRunOptions,
} from "@openai/agents";
import type { Agents } from "./agents/constants";
import type { Scenario } from "../types";
import { mergeById } from "../utils";

const maxTurns = 20;

const runWithContext = async <
  TAgent extends Agent<any, any>,
  TContext = undefined
>(
  agent: TAgent,
  input: string | AgentInputItem[] | RunState<TContext, TAgent>,
  options?: NonStreamRunOptions<TContext>
): Promise<{
  result: RunResult<TContext, TAgent>["finalOutput"];
  context: RunContext<TContext>;
  tokens: { in: number; out: number };
}> => {
  const context = new RunContext<TContext>();
  const result = await run(agent, input, { ...options, context });

  return {
    result: result.finalOutput,
    context,
    tokens: { in: context.usage.inputTokens, out: context.usage.outputTokens },
  };
};

const js = JSON.stringify;

export async function runPrototype({
  scenario,
  agents,
}: {
  scenario: Scenario;
  agents: Agents;
}) {
  const metrics = {
    duration: 0,
    i_offering: 0,
    o_offering: 0,
    i_price: 0,
    o_price: 0,
    i_usage: 0,
    o_usage: 0,
    i_waste: 0,
    o_waste: 0,
    i_downsize: null as number | null,
    o_downsize: null as number | null,
    i_downsizePrice: null as number | null,
    o_downsizePrice: null as number | null,
  };

  const start = performance.now();

  const providers = scenario.instances
    .map((i) => i.provider)
    .filter((v, i, a) => a.indexOf(v) === i);

  const offerings = await Promise.all(
    providers.map(async (p) => {
      const offering = await runWithContext(agents.offering, p);

      metrics.i_offering += offering.tokens.in;
      metrics.o_offering += offering.tokens.out;

      return {
        name: p,
        types: offering.result?.offering ?? [],
      };
    })
  );

  const [prices, usage] = await Promise.all([
    runWithContext(agents.price, js(scenario), { maxTurns }),
    runWithContext(
      agents.usage,
      js(scenario.instances.map(({ id, provider }) => ({ id, provider }))),
      { maxTurns }
    ),
  ]);

  if (prices.result == null) throw new Error("Price agent failed");
  if (usage.result == null) throw new Error("Usage agent failed");

  metrics.i_price = prices.tokens.in;
  metrics.o_price = prices.tokens.out;
  metrics.i_usage = usage.tokens.in;
  metrics.o_usage = usage.tokens.out;

  const waste = await runWithContext(agents.waste, js(usage.result.results));

  if (waste.result == null) throw new Error("Waste agent failed");

  metrics.i_waste = waste.tokens.in;
  metrics.o_waste = waste.tokens.out;

  const shouldDownsize = mergeById(scenario.instances, waste.result.results)
    .filter((r) => r.wasteful)
    .map(({ id, type, provider }) => ({ id, type, provider }));

  const downsized = await Promise.all(
    shouldDownsize.map(async ({ id, type, provider }) => {
      const options = offerings.find((r) => r.name === provider)?.types;

      if (!options) return { id, newType: null };

      const output = await runWithContext(
        agents.downsize,
        js({ instance: { id, type }, options })
      );

      metrics.i_downsize ??= 0;
      metrics.o_downsize ??= 0;
      metrics.i_downsize += output.tokens.in;
      metrics.o_downsize += output.tokens.out;

      return { id, newType: output.result?.newType || null };
    })
  );

  let newPrices: { id: string; newPrice: number }[] = [];
  if (downsized.some((r) => r.newType != null)) {
    const downsizePrices = await runWithContext(
      agents.price,
      js(
        mergeById(scenario.instances, downsized)
          .map((r) => ({ id: r.id, type: r.newType, provider: r.provider }))
          .filter((r) => !!r.type)
      )
    );

    newPrices = (downsizePrices.result?.results ?? []).map(
      ({ id, price: newPrice }) => ({ id, newPrice })
    );

    if (downsizePrices.result == null)
      throw new Error("Recommendation prices agent failed");

    metrics.i_downsizePrice ??= downsizePrices.tokens.in;
    metrics.o_downsizePrice ??= downsizePrices.tokens.out;
  }

  metrics.duration = Math.round(performance.now() - start);

  return {
    metrics,
    instances: mergeById(
      scenario.instances,
      prices.result.results,
      usage.result.results,
      waste.result.results,
      downsized,
      newPrices
    ),
  };
}
