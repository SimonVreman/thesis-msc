import { z } from "zod";
import { createCSVHelper } from ".";

export const metaCSV = createCSVHelper(
  z.object({
    scenario: z.number(),
    success: z.boolean(),
    duration: z.number().optional(),
    i_offering: z.number().optional(),
    o_offering: z.number().optional(),
    i_price: z.number().optional(),
    o_price: z.number().optional(),
    i_usage: z.number().optional(),
    o_usage: z.number().optional(),
    i_waste: z.number().optional(),
    o_waste: z.number().optional(),
    i_downsize: z.number().nullable().optional(),
    o_downsize: z.number().nullable().optional(),
    i_downsizePrice: z.number().nullable().optional(),
    o_downsizePrice: z.number().nullable().optional(),
  })
);
