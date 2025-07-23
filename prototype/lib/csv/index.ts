import type z from "zod";

export const createCSVHelper = <T extends z.AnyZodObject>(schema: T) => {
  const keys = Object.keys(schema.shape).sort() as (keyof z.infer<
    typeof schema
  >)[];

  return {
    getHeader: () => keys.join(",") + "\n",
    getRow: (row: z.infer<typeof schema>) =>
      keys
        .map((v) =>
          new String(
            ["boolean", "number"].includes(typeof row[v])
              ? row[v]
              : row[v] || "null"
          ).replace(",", " -")
        )
        .join(",") + "\n",
  };
};
