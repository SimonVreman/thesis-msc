import { metaCSV } from "../csv/meta";
import { resultCSV } from "../csv/results";
import { getSanity } from "../sanity";
import type { SimulationBatchResult } from "./batched-simulation";

function getFileName(suffix: string) {
  const datetime = new Date().toISOString().replace(/[^\d]/g, "");
  return `./out/${datetime.substring(0, datetime.length - 3)}-${suffix}.csv`;
}

export function createResultWriter() {
  const outFile = Bun.file(getFileName("results"));
  const out = outFile.writer();
  out.write(resultCSV.getHeader());
  return out;
}

export function createMetaWriter() {
  const outFile = Bun.file(getFileName("meta"));
  const out = outFile.writer();
  out.write(metaCSV.getHeader());
  return out;
}

export async function processBatch({
  batch: bareBatch,
  out,
  outMeta,
}: {
  batch: SimulationBatchResult;
  out: Bun.FileSink;
  outMeta: Bun.FileSink;
}) {
  const batch = [];
  const batchChunks = Math.ceil(bareBatch.length / 5);

  for (let i = 0; i < batchChunks; i++) {
    const chunk = bareBatch.slice(i * 5, (i + 1) * 5);

    const chunkPromises = chunk.map(async (b) => {
      const instancesWithNewType =
        b.result?.instances
          .filter((r) => r.newType != null)
          .map(({ id, provider, newType }) => ({
            id,
            provider,
            type: newType!,
          })) ?? [];

      return [
        b,
        await getSanity(b.scenario),
        await getSanity({ instances: instancesWithNewType }),
      ] as const;
    });

    batch.push(...(await Promise.all(chunkPromises)));
  }

  for (const [scenario, sanity, newSanity] of batch) {
    outMeta.write(
      metaCSV.getRow({
        scenario: scenario.id,
        success: scenario.success,
        ...scenario.result?.metrics,
      })
    );

    if (!scenario.success) {
      console.log(`Simulation ${scenario.id} failed`);
      continue;
    }

    for (const instance of scenario.result.instances) {
      const s = sanity.instances.find((i) => i.id === instance.id)!;
      const newS = newSanity.instances.find((i) => i.id === instance.id);

      out.write(
        resultCSV.getRow({
          scenario: scenario.id,
          id: instance.id,
          type: instance.type,
          provider: instance.provider,
          providerActual: s.provider,
          avgCpu: instance.avgCpu,
          avgCpuActual: s.avg,
          price: instance.price,
          priceActual: s.price ?? null,
          wasteful: instance.wasteful,
          newType: instance.newType,
          newPrice: instance.newPrice,
          newPriceActual: newS?.price ?? null,
          lifetime: s.lifetime,
        })
      );
    }
  }
}
