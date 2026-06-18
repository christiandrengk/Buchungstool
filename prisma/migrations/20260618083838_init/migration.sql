-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "studentsAllowed" BOOLEAN NOT NULL DEFAULT true,
    "ownerDepartmentId" INTEGER,
    CONSTRAINT "ResourceCategory_ownerDepartmentId_fkey" FOREIGN KEY ("ownerDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResourceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "note" TEXT,
    "unavailableReason" TEXT,
    "ownerDepartmentId" INTEGER,
    CONSTRAINT "ResourceItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResourceItem_ownerDepartmentId_fkey" FOREIGN KEY ("ownerDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "resourceItemId" INTEGER NOT NULL,
    "bookerName" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "purpose" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_resourceItemId_fkey" FOREIGN KEY ("resourceItemId") REFERENCES "ResourceItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");

-- CreateIndex
CREATE INDEX "Booking_resourceItemId_startTime_endTime_idx" ON "Booking"("resourceItemId", "startTime", "endTime");
