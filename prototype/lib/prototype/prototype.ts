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
const ts = (t?: number) => {
  const tNext = performance.now();
  return { t: tNext, dt: Math.round(tNext - (t ?? tNext)) };
};

const createMetrics = () => ({
  t_overall: 0,
  i_offering: 0,
  o_offering: 0,
  t_offering: 0,
  i_price: 0,
  o_price: 0,
  t_price: 0,
  i_usage: 0,
  o_usage: 0,
  t_usage: 0,
  i_waste: 0,
  o_waste: 0,
  t_waste: 0,
  i_downsize: null as number | null,
  o_downsize: null as number | null,
  t_downsize: 0,
  i_downsizePrice: null as number | null,
  o_downsizePrice: null as number | null,
  t_downsizePrice: 0,
});

export async function runPrototype({
  scenario,
  agents,
}: {
  scenario: Scenario;
  agents: Agents;
}) {
  const metrics = createMetrics();
  let t = ts().t;
  let tStart = t;

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

  ({ t, dt: metrics.t_offering } = ts(t));

  const [prices, usage] = await Promise.all([
    runWithContext(agents.price, js(scenario), { maxTurns }).then(
      (r) => ([r, (metrics.t_price = ts(t).dt)] as const)[0]
    ),
    runWithContext(
      agents.usage,
      js(scenario.instances.map(({ id, provider }) => ({ id, provider }))),
      { maxTurns }
    ).then((r) => ([r, (metrics.t_usage = ts(t).dt)] as const)[0]),
  ]);

  if (prices.result == null) throw new Error("Price agent failed");
  if (usage.result == null) throw new Error("Usage agent failed");

  metrics.i_price = prices.tokens.in;
  metrics.o_price = prices.tokens.out;
  metrics.i_usage = usage.tokens.in;
  metrics.o_usage = usage.tokens.out;

  t = ts().t;

  const waste = await runWithContext(agents.waste, js(usage.result.results));

  if (waste.result == null) throw new Error("Waste agent failed");

  metrics.i_waste = waste.tokens.in;
  metrics.o_waste = waste.tokens.out;

  ({ t, dt: metrics.t_waste } = ts(t));

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

  ({ t, dt: metrics.t_downsize } = ts(t));

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

  ({ t, dt: metrics.t_downsizePrice } = ts(t));
  ({ dt: metrics.t_overall } = ts(tStart));

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
