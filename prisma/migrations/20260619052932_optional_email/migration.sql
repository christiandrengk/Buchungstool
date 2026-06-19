-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resourceItemId" INTEGER NOT NULL,
    "bookerName" TEXT NOT NULL,
    "bookerEmail" TEXT,
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
INSERT INTO "new_Booking" ("bookerEmail", "bookerName", "createdAt", "departmentId", "endTime", "id", "purpose", "resourceItemId", "role", "startTime", "usageType") SELECT "bookerEmail", "bookerName", "createdAt", "departmentId", "endTime", "id", "purpose", "resourceItemId", "role", "startTime", "usageType" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE INDEX "Booking_resourceItemId_startTime_endTime_idx" ON "Booking"("resourceItemId", "startTime", "endTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
