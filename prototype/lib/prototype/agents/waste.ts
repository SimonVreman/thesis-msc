import { Agent } from "@openai/agents";
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

    For each instance, determine whether it is wasteful—defined as having low average CPU usage, such as less than 10%.

    Base your assessment on the provided avgCpu value.

Output:
Return the results in a clear, structured format, with one entry per instance indicating whether it is considered wasteful.
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
