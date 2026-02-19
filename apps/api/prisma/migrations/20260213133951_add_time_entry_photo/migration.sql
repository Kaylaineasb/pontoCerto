/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `TimeEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TimeEntry" DROP COLUMN "photoUrl",
ADD COLUMN     "photoBase64" TEXT,
ADD COLUMN     "photoMime" TEXT;
