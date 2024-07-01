-- CreateTable
CREATE TABLE "RoutingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeResults" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
