import { PrismaClient } from "../generated/prisma";

let start = performance.now();

const prisma = new PrismaClient();

// const minDate = (await prisma.trace.aggregate({ _min: { time: true } }))._min
//   .time;
// const maxDate = (await prisma.trace.aggregate({ _max: { time: true } }))._max
//   .time;

// Takes a while to query, so just storing these.
const minDate = new Date("2019-09-30T22:00:00.000Z");
const maxDate = new Date("2019-10-01T16:30:00.000Z");

if (!minDate || !maxDate) throw new Error("No traces found in the database");

console.log(
  `Found minimum date ${minDate.toISOString()} and maximum date ${maxDate.toISOString()}, took ${(
    (performance.now() - start) /
    1e3
  ).toFixed(2)} s.`
);

start = performance.now();

const availableVMs = await prisma.virtualMachine.count({
  where: {
    AND: [{ created: { gte: minDate }, deleted: { lte: maxDate } }],
  },
});

console.log(
  `Found ${availableVMs} virtual machines in the database for the given range, took ${(
    (performance.now() - start) /
    1e3
  ).toFixed(2)} s.`
);

console.log(
  await prisma.virtualMachine.findFirst({
    where: {
      AND: [{ created: { gte: minDate }, deleted: { lte: maxDate } }],
    },
  })
);
