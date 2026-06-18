/*
  Warnings:

  - Added the required column `bookerEmail` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resourceItemId" INTEGER NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerEmail" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "usageType" TEXT NOT NULL DEFAULT 'TAKEOUT',
    "purpose" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookerName", "createdAt", "departmentId", "endTime", "id", "purpose", "resourceItemId", "role", "startTime") SELECT "bookerName", "createdAt", "departmentId", "endTime", "id", "purpose", "resourceItemId", "role", "startTime" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_resourceItemId_startTime_endTime_idx" ON "Booking"("resourceItemId", "startTime", "endTime");
CREATE TABLE "new_ResourceCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "studentsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "studentsInRoomOnly" BOOLEAN NOT NULL DEFAULT false,
    "ownerDepartmentId" INTEGER,
    CONSTRAINT "ResourceCategory_ownerDepartmentId_fkey" FOREIGN KEY ("ownerDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ResourceCategory" ("description", "id", "kind", "name", "ownerDepartmentId", "sortOrder", "studentsAllowed") SELECT "description", "id", "kind", "name", "ownerDepartmentId", "sortOrder", "studentsAllowed" FROM "ResourceCategory";
DROP TABLE "ResourceCategory";
ALTER TABLE "new_ResourceCategory" RENAME TO "ResourceCategory";
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
