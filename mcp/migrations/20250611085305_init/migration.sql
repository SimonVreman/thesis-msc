/*
  Warnings:

  - The primary key for the `VirtualMachine` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "VirtualMachine" DROP CONSTRAINT "VirtualMachine_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "subscription" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "deployment" SET DATA TYPE VARCHAR(128),
ADD CONSTRAINT "VirtualMachine_pkey" PRIMARY KEY ("id");
