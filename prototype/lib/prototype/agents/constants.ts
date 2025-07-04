import type { PriceAgent } from "./price";
import type { ProviderAgent } from "./provider";
import type { UsageAgent } from "./usage";
import type { WasteAgent } from "./waste";

export const agentConstants = {
  models: {
    base: "gpt-4.1-nano-2025-04-14",
  },
};

export type Agents = {
  price: PriceAgent;
  usage: UsageAgent;
  provider: ProviderAgent;
  waste: WasteAgent;
};
