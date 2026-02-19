/*
  Warnings:

  - Made the column `sequence` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "TimeEntry" ALTER COLUMN "sequence" SET NOT NULL;
