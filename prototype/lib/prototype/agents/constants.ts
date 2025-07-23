import type { DownsizeAgent } from "./downsize";
import type { OfferingAgent } from "./offering";
import type { PriceAgent } from "./price";
import type { UsageAgent } from "./usage";
import type { WasteAgent } from "./waste";

export const agentConstants = {
  models: {
    base: "gpt-4.1-nano-2025-04-14",
    smart: "gpt-4.1-mini-2025-04-14",
    smarter: "gpt-4.1-2025-04-14",
  },
};

export type Agents = {
  price: PriceAgent;
  usage: UsageAgent;
  waste: WasteAgent;
  downsize: DownsizeAgent;
  offering: OfferingAgent;
};
