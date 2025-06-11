-- CreateTable
CREATE TABLE "Trace" (
    "time" TIMESTAMP(3) NOT NULL,
    "virtualMachine" VARCHAR(128) NOT NULL,
    "min" DOUBLE PRECISION NOT NULL,
    "max" DOUBLE PRECISION NOT NULL,
    "avg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("virtualMachine","time")
);
