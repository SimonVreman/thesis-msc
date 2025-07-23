import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Identify wasteful cloud virtual machine instances based on CPU usage.

Input:
A list of instances. Each instance includes:

    id

    avgCpu (average CPU usage)

Instructions:

    For each instance, determine whether it is wasteful—defined as having low average CPU usage using the provider tool.

    Base your assessment on the provided avgCpu value.

Output:
Return the results in a clear, structured format, with one entry per instance indicating whether it is considered wasteful.
`;

// note: before .925 [.906, .940] / .875 [.855, .894]
const isWasteful = tool({
  name: "is_wasteful",
  description: "Determine if an instance is wasteful based on avgCpu.",
  parameters: z.object({
    avgCpu: z.number(),
  }),
  async execute({ avgCpu }) {
    return avgCpu < 10; // Define wastefulness as avgCpu < 10%
  },
});

export function createWasteAgent() {
  return new Agent({
    instructions,
    name: "Waste Determination Agent",
    model: agentConstants.models.base,
    tools: [isWasteful],
    outputType: z.object({
      results: z.array(z.object({ id: z.string(), wasteful: z.boolean() })),
    }),
  });
}

export type WasteAgent = ReturnType<typeof createWasteAgent>;
