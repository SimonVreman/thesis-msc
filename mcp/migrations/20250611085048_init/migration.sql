-- CreateTable
CREATE TABLE "VirtualMachine" (
    "id" CHAR(64) NOT NULL,
    "subscription" CHAR(64) NOT NULL,
    "deployment" CHAR(64) NOT NULL,
    "created" INTEGER NOT NULL,
    "deleted" INTEGER NOT NULL,
    "maxCpu" DOUBLE PRECISION NOT NULL,
    "avgCpu" DOUBLE PRECISION NOT NULL,
    "p95MaxCpu" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "cores" INTEGER NOT NULL,
    "memory" INTEGER NOT NULL,

    CONSTRAINT "VirtualMachine_pkey" PRIMARY KEY ("id")
);
