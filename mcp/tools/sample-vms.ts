import { readChunked } from "../lib/csvgz";

// Copied from sample-traces.ts, should be the same sample!
const sample = 5;
const sampling = {
  sample,
  timeOffset: new Date(2019, 9, 1).getTime() / 1000,
  isSampled: (line: string) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(
      line[0]
    ) <= sample,
};

const vmLine = (line: string) => {
  const [id, subId, depId, tCreate, tDelete, max, avg, p95Max, cat, core, mem] =
    line.split(",");
  return {
    id,
    subId,
    depId,
    tCreate,
    tDelete,
    max,
    avg,
    p95Max,
    cat,
    core,
    mem,
  };
};

let chunk = 0;
const chunkSize = 1e5;
const chunkCount = "unknown";

const output = Bun.file(`./generated/vms/vms-at-sample-${sampling.sample}.csv`);
const writer = output.writer();

const handleTime = (t: string) =>
  new Date((+t + sampling.timeOffset) * 1000).toISOString();

await readChunked({
  path: "../figures/azure-dataset/v2/vmtable.csv.gz",
  chunkSize,
  callback: async (lines) => {
    const currentChunk = ++chunk;

    console.log("processing chunk", currentChunk, "of", chunkCount);

    for (const line of lines) {
      const vm = vmLine(line);
      if (!vm.id || !sampling.isSampled(vm.id)) continue; // skip traces not sampled;

      writer.write(
        [
          vm.id,
          vm.subId,
          vm.depId,
          vm.max,
          vm.avg,
          vm.p95Max,
          vm.cat,
          vm.core === ">24" ? "30" : vm.core,
          vm.mem === ">64" ? "70" : vm.mem,
          handleTime(vm.tCreate),
          handleTime(vm.tDelete),
        ].join(",") + "\n"
      );
    }
  },
});

await writer.end();

console.log("finished sampling all vm chunks");

// DIRECT IMPORT
// Move files to tmp
// su postgres
// psql
// \c thesis
// \copy "virtual_machine" from '/tmp/vms-at-sample-5.csv' with (format csv, delimiter ',', header FALSE)
