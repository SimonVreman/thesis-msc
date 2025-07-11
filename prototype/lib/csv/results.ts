import { z } from "zod";

const row = z.object({
  scenario: z.number(),
  id: z.string(),
  type: z.string(),
  provider: z.string().nullable(),
  providerActual: z.string(),
  p95Cpu: z.number().nullable(),
  p95CpuActual: z.number(),
  price: z.number().nullable(),
  priceActual: z.number().nullable(),
  wasteful: z.boolean(),
  newType: z.string().nullable(),
  newPrice: z.number().nullable(),
  newPriceActual: z.number().nullable(),
});

type ResultRow = z.infer<typeof row>;

const keys = Object.keys(row.shape).sort() as (keyof ResultRow)[];

export const resultCSV = {
  getHeader: () => keys.join(",") + "\n",
  getRow: (row: ResultRow) =>
    keys.map((v) => row[v] ?? "null").join(",") + "\n",
};
