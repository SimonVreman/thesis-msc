import { Agent } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
You determine which instances are wasteful, that is, having low cpu usage.
Your input is a list of instances, each with an ID, and p95 max cpu.
You will return the determinations in a structured format, one entry per instance.
`;

export function createWasteAgent() {
  return new Agent({
    instructions,
    name: "Waste Determination Agent",
    model: agentConstants.models.base,
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), wasteful: z.boolean() })),
    }),
  });
}

export type WasteAgent = ReturnType<typeof createWasteAgent>;
