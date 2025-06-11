import {
  count,
  countWhere,
  read,
  readNth,
  readNthWhere,
  readWhere,
} from "./csvgz";

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

// const vmLineCount = await count({ path: paths.vm });
// const cpu1LineCount = await count({ path: paths.cpu1 });
const vmLineCount = 2695548;
const cpu1LineCount = 10000000;

console.log("vm linecount:", vmLineCount);
console.log("cpu 1 linecount:", cpu1LineCount);

// const myRandomVM = (
//   await readNth({ path: paths.vm, n: Math.floor(Math.random() * 100) })
// )?.split(",");

// console.log("random vm:", myRandomVM);

// await readWhere({
//   path: paths.cpu1,
//   predicate: (l) =>
//     l.split(",")[1] ===
//     "yNf/R3X8fyXkOJm3ihXQcT0F52a8cDWPPRzTT6QFW8N+1QPfeKR5//6xyX0VYn7X", //myRandomVM?.[0],
//   callback: (l) => console.log("VM trace:", l),
//   limit: 10,
// });

// console.log(await readNth({ path: paths.cpu1, n: 0 }));

const firstCpuLine = await readNth({ path: paths.cpu1, n: 0 });
const lastCpuLine = await readNth({ path: paths.cpu1, n: cpu1LineCount - 1 });
const tMin = +cpuLine(firstCpuLine!).t;
const tMax = +cpuLine(lastCpuLine!).t;

const tPredicate = (l: string) => {
  const vm = vmLine(l);
  return +vm.tCreate < tMax && +vm.tDelete > tMin;
};

const vmsWithinTime = await countWhere({
  path: paths.vm,
  predicate: tPredicate,
});

const randomVM = await readNthWhere({
  path: paths.vm,
  predicate: tPredicate,
  n: Math.floor(Math.random() * vmsWithinTime),
});

console.log("random vm within time:", vmLine(randomVM!));

await readWhere({
  path: paths.cpu1,
  predicate: (l) => cpuLine(l).vm === vmLine(randomVM!).id,
  callback: (l) => console.log("VM trace:", l),
  limit: 10,
});
