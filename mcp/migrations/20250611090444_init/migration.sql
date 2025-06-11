/*
  Warnings:

  - Changed the type of `created` on the `VirtualMachine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `deleted` on the `VirtualMachine` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "VirtualMachine" DROP COLUMN "created",
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL,
DROP COLUMN "deleted",
ADD COLUMN     "deleted" TIMESTAMP(3) NOT NULL;
