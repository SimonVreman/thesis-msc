import { getSanity } from "../sanity";
import type { SimulationBatchResult } from "./batched-simulation";

const csvHeader = [
  "scenario",
  "id",
  "p95Cpu",
  "p95Cpu_aligns",
  "price",
  "price_aligns",
  "wasteful",
].join(",");

const csvRow = (
  ...args: [
    batch: number,
    id: string,
    p95Cpu: number | undefined,
    p95CpuAligns: boolean,
    price: number | undefined,
    priceAligns: boolean,
    wasteful: boolean | undefined
  ]
) => args.map((v) => v ?? "null").join(",");

function getFileName() {
  const datetime = new Date().toISOString().replace(/[^\d]/g, "");
  return `./out/${datetime.substring(
    0,
    datetime.length - 3
  )}-simulation-results.csv`;
}

function aligns(a: number | undefined, b: number) {
  return a != null && Math.abs(a - b) < 0.1;
}

export function createResultWriter() {
  const outFile = Bun.file(getFileName());
  const out = outFile.writer();
  out.write(csvHeader + "\n");
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
    bareBatch.map(async (b) => [b, await getSanity(b.scenario)] as const)
  );

  for (const [scenario, sanity] of batch) {
    if (!scenario.success) {
      console.log(`Simulation ${scenario.id} failed`);
      continue;
    }

    for (const instance of scenario.result) {
      const instanceSanity = sanity.instances.find(
        (i) => i.id === instance.id
      )!;

      out.write(
        csvRow(
          scenario.id,
          instance.id,
          instance.p95Cpu,
          aligns(instance.p95Cpu, instanceSanity.p95),
          instance.price,
          aligns(instance.price, instanceSanity.price),
          instance.wasteful
        ) + "\n"
      );
    }
  }
}
