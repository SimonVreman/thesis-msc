import { readChunked } from "../lib/csvgz";

// Up to which base64 index should we sample traces?
// 0 = 0%, 5 = 9.4%, 31 = 50%, 63 = 100%
const sample = 5;
const file = +Bun.argv[Bun.argv.length - 1] || 1; // default to file 1 if no argument is given

const sampling = {
  sample,
  timeOffset: new Date(2019, 9, 1).getTime() / 1000,
  isSampled: (line: string) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(
      line[0]
    ) <= sample,
};

export const samplingConfiguration = sampling;

const cpuLine = (line: string) => {
  const [t, vm, min, max, avg] = line.split(",");
  return { t, vm, min, max, avg };
};

let chunk = 0;
const chunkSize = 1e5;
const chunkCount = Math.ceil(10_000_000 / chunkSize);

const output = Bun.file(
  `./generated/traces/traces-${file}-at-sample-${sample}.csv`
);
const writer = output.writer();

await readChunked({
  path: `./traces/cpu/vm_cpu_readings-file-${file}-of-195.csv.gz`,
  chunkSize,
  callback: async (lines) => {
    const currentChunk = ++chunk;

    console.log("processing chunk", currentChunk, "of", chunkCount);

    for (const line of lines) {
      const trace = cpuLine(line);
      if (!trace.vm || !sampling.isSampled(trace.vm)) continue; // skip traces without VM or not sampled

      writer.write(
        `${new Date((+trace.t + sampling.timeOffset) * 1000).toISOString()},${
          trace.vm
        },${trace.min},${trace.max},${trace.avg}\n`
      );
    }
  },
});

await writer.end();

console.log("finished sampling all chunks of", file);

// DIRECT IMPORT
// Move files to tmp
// su postgres
// psql
// \c thesis
// \copy "trace" from '/tmp/traces-1-at-sample-5.csv' with (format csv, delimiter ',', header FALSE)
