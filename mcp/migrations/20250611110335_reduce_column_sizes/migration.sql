/*
  Warnings:

  - The primary key for the `Trace` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `virtualMachine` on the `Trace` table. The data in that column could be lost. The data in that column will be cast from `VarChar(128)` to `Char(64)`.
  - The primary key for the `VirtualMachine` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `VirtualMachine` table. The data in that column could be lost. The data in that column will be cast from `VarChar(128)` to `Char(64)`.
  - You are about to alter the column `subscription` on the `VirtualMachine` table. The data in that column could be lost. The data in that column will be cast from `VarChar(128)` to `Char(64)`.
  - You are about to alter the column `deployment` on the `VirtualMachine` table. The data in that column could be lost. The data in that column will be cast from `VarChar(128)` to `Char(88)`.

*/
-- AlterTable
ALTER TABLE "Trace" DROP CONSTRAINT "Trace_pkey",
ALTER COLUMN "virtualMachine" SET DATA TYPE CHAR(64),
ADD CONSTRAINT "Trace_pkey" PRIMARY KEY ("virtualMachine", "time");

-- AlterTable
ALTER TABLE "VirtualMachine" DROP CONSTRAINT "VirtualMachine_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(64),
ALTER COLUMN "subscription" SET DATA TYPE CHAR(64),
ALTER COLUMN "deployment" SET DATA TYPE CHAR(88),
ADD CONSTRAINT "VirtualMachine_pkey" PRIMARY KEY ("id");
