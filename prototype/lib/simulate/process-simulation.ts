import { resultCSV } from "../csv/results";
import { getSanity } from "../sanity";
import type { SimulationBatchResult } from "./batched-simulation";

function getFileName() {
  const datetime = new Date().toISOString().replace(/[^\d]/g, "");
  return `./out/${datetime.substring(
    0,
    datetime.length - 3
  )}-simulation-results.csv`;
}

export function createResultWriter() {
  const outFile = Bun.file(getFileName());
  const out = outFile.writer();
  out.write(resultCSV.getHeader());
  return out;
}

export async function processBatch({
  batch: bareBatch,
  out,
}: {
  batch: SimulationBatchResult;
  out: Bun.FileSink;
}) {
  const batch = await Promise.all(
    bareBatch.map(
      async (b) =>
        [
          b,
          ...(await Promise.all([
            getSanity(b.scenario),
            getSanity({
              instances:
                b.result
                  ?.filter((r) => r.newType != null)
                  .map((r) => ({ id: r.id, type: r.newType! })) ?? [],
            }),
          ])),
        ] as const
    )
  );

  for (const [scenario, sanity, newSanity] of batch) {
    if (!scenario.success) {
      console.log(`Simulation ${scenario.id} failed`);
      continue;
    }

    for (const instance of scenario.result) {
      const s = sanity.instances.find((i) => i.id === instance.id)!;
      const newS = newSanity.instances.find((i) => i.id === instance.id);

      out.write(
        resultCSV.getRow({
          scenario: scenario.id,
          id: instance.id,
          type: instance.type,
          provider: instance.provider,
          providerActual: s.provider,
          p95Cpu: instance.p95Cpu,
          p95CpuActual: s.p95,
          price: instance.price,
          priceActual: s.price ?? null,
          wasteful: instance.wasteful,
          newType: instance.newType,
          newPrice: instance.newPrice,
          newPriceActual: newS?.price ?? null,
        })
      );
    }
  }
}
