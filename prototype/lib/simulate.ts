import { run } from "@openai/agents";
import type { PriceAgent } from "../agents/price";
import type { UsageAgent } from "../agents/usage";
import type { ProviderAgent } from "../agents/provider";

export async function simulate({
  scenario,
  agents,
}: {
  scenario: string;
  agents: { price: PriceAgent; usage: UsageAgent; provider: ProviderAgent };
}) {
  const withProviders = JSON.stringify(
    (await run(agents.provider, scenario)).finalOutput
  );

  const [prices, usage] = await Promise.all([
    run(agents.price, withProviders),
    run(agents.usage, withProviders),
  ]);

  console.log("Price results:", prices.finalOutput);
  console.log("Usage results:", usage.finalOutput);
}
