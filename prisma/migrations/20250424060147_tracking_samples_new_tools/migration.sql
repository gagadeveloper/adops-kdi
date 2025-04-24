/*
  Warnings:

  - You are about to drop the column `departmentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `password_hash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `roleId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "departmentId",
DROP COLUMN "password",
ADD COLUMN     "department" TEXT,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT uuid_generate_v4(),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "roleId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "menu_name" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(50),
    "path" VARCHAR(255),
    "menu_order" INTEGER,
    "parent_id" INTEGER,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_menus" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER,
    "menu_id" INTEGER,

    CONSTRAINT "RoleMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_menus" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "menu_id" INTEGER,

    CONSTRAINT "user_menus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "RoleMenu_menuId_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "RoleMenu_roleId_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_menus" ADD CONSTRAINT "user_menus_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_menus" ADD CONSTRAINT "user_menus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
