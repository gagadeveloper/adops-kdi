-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "roleId" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
