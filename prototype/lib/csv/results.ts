import { z } from "zod";
import { createCSVHelper } from ".";

export const resultCSV = createCSVHelper(
  z.object({
    scenario: z.number(),
    id: z.string(),
    type: z.string(),
    provider: z.string().nullable(),
    providerActual: z.string(),
    avgCpu: z.number().nullable(),
    avgCpuActual: z.number(),
    price: z.number().nullable(),
    priceActual: z.number().nullable(),
    wasteful: z.boolean(),
    newType: z.string().nullable(),
    newPrice: z.number().nullable(),
    newPriceActual: z.number().nullable(),
    lifetime: z.number(),
  })
);
