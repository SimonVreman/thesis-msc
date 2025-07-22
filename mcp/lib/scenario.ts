import { z } from "zod";

export const Scenario = z.object({
  instances: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      provider: z.string(),
    })
  ),
});

export type Scenario = z.infer<typeof Scenario>;
