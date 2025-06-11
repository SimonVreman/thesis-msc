import {
  PrismaClient,
  type Trace,
  type VirtualMachine,
} from "../generated/prisma";
import { read, readChunked } from "./csvgz";

const which = "cpu1" as "vm" | "cpu1";

const paths = {
  cpu1: "./traces/cpu/1.csv.gz",
  vm: "./traces/vmtable.csv.gz",
};

const idx = {
  cpu: { t: 0, vm: 1, min: 2, max: 3, avg: 4 },
  vm: {
    id: 0,
    subId: 1,
    depId: 2,
    tCreate: 3,
    tDelete: 4,
    max: 5,
    avg: 6,
    p95Max: 7,
    cat: 8,
    core: 9,
    mem: 10,
  },
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

const cpuLine = (line: string) => {
  const [t, vm, min, max, avg] = line.split(",");
  return { t, vm, min, max, avg };
};

const timeOffset = new Date(2019, 9, 1).getTime() / 1000;
const prisma = new PrismaClient();

let chunk = 0;

if (which === "vm")
  await readChunked({
    path: paths.vm,
    chunkSize: 1e5,
    callback: async (lines) => {
      const currentChunk = ++chunk;
      console.log(
        "processing chunk",
        currentChunk,
        "of",
        Math.ceil(2695548 / 1e5)
      );
      await prisma.virtualMachine.createMany({
        skipDuplicates: true,
        data: lines.map((line) => {
          const vm = vmLine(line);
          return {
            id: vm.id,
            subscription: vm.subId,
            deployment: vm.depId,
            created: new Date((+vm.tCreate + timeOffset) * 1000),
            deleted: new Date((+vm.tDelete + timeOffset) * 1000),
            maxCpu: +vm.max,
            avgCpu: +vm.avg,
            p95MaxCpu: +vm.p95Max,
            category: vm.cat,
            cores: vm.core === ">24" ? 30 : +vm.mem,
            memory: vm.mem === ">64" ? 70 : +vm.mem,
          } satisfies VirtualMachine;
        }),
      });
      console.log("chunk", currentChunk, "done");
    },
  });

if (which === "cpu1")
  await readChunked({
    path: paths.cpu1,
    chunkSize: 1e5,
    callback: async (lines) => {
      const currentChunk = ++chunk;
      console.log(
        "processing chunk",
        currentChunk,
        "of",
        Math.ceil(10_000_000 / 1e5)
      );

      await prisma.trace.createMany({
        skipDuplicates: true,
        data: lines
          .map((line) => {
            const trace = cpuLine(line);

            if (!trace.vm) return null; // skip traces without VM

            return {
              time: new Date((+trace.t + timeOffset) * 1000),
              virtualMachine: trace.vm,
              min: +trace.min,
              max: +trace.max,
              avg: +trace.avg,
            } satisfies Trace;
          })
          .filter((t) => t !== null),
      });
      console.log("chunk", currentChunk, "done");
    },
  });
