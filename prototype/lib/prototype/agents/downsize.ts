import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { agentConstants } from "./constants";

const instructions = `
Task:
Find the CPU downize option for the cloud virtual machine instance based on its type and the given options.

Input:
A cloud virtual machine instance, which includes:

    id: a unique identifier

    type: the current instance type

And a list of the available instance types for the provider of the instance. Each type includes:

    name: the instance type name

    vcpu: the number of virtual CPUs

    memory: the amount of memory in GB

Instructions:

    Call the tool get_smaller_instance with the list of available instance types and the instance type name.

    If a valid downsizing option is found, return the recommended instance type.

    If no suitable smaller instance type is available, return null as the instance type.

    Return the exact instance type name as it appears in the provider's documentation or API.

Output:
The new instance type or null if downsizing is not possible.
`;

const getSmallerInstance = tool({
  name: "get_smaller_instance",
  description:
    "Get the first smaller instance from a list of instance types. Give the full list of instance types for the provider, and the name of the instance type to downsize.",
  parameters: z.object({
    list: z.array(
      z.object({ name: z.string(), vcpu: z.number(), memory: z.number() })
    ),
    smallerThan: z.string(),
  }),
  async execute({ list, smallerThan: smallerThanName }) {
    const smallerThan = list.find((i) => i.name === smallerThanName);
    if (!smallerThan) return null;

    list.sort((a, b) => b.vcpu - a.vcpu || b.memory - a.memory);
    const smallerInstance = list.find(
      (i) => i.vcpu < smallerThan.vcpu && i.memory <= smallerThan.memory
    );

    return smallerInstance ? smallerInstance.name : null;
  },
});

export function createDownsizeAgent() {
  return new Agent({
    instructions,
    name: "Downsize Agent",
    model: agentConstants.models.base,
    tools: [getSmallerInstance],
    outputType: z.object({
      newType: z.string().nullable(),
    }),
  });
}

export type DownsizeAgent = ReturnType<typeof createDownsizeAgent>;
