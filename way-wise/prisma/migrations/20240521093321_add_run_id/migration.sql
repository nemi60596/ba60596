-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RoutingEngineResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "benchmarkId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "distance" REAL NOT NULL,
    "distanceByCountry" TEXT,
    "calculatedDistance" REAL,
    "tollDistanceByCountry" TEXT,
    "calculatedTollDistance" REAL,
    "duration" REAL NOT NULL,
    "rtt" REAL NOT NULL,
    "elevation" REAL DEFAULT 0.0,
    "geometry" TEXT,
    "runId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RoutingEngineResult_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RoutingEngineResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RoutingEngineResult" ("benchmarkId", "calculatedDistance", "calculatedTollDistance", "distance", "distanceByCountry", "duration", "elevation", "geometry", "id", "name", "rtt", "tollDistanceByCountry") SELECT "benchmarkId", "calculatedDistance", "calculatedTollDistance", "distance", "distanceByCountry", "duration", "elevation", "geometry", "id", "name", "rtt", "tollDistanceByCountry" FROM "RoutingEngineResult";
DROP TABLE "RoutingEngineResult";
ALTER TABLE "new_RoutingEngineResult" RENAME TO "RoutingEngineResult";
CREATE INDEX "RoutingEngineResult_benchmarkId_idx" ON "RoutingEngineResult"("benchmarkId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
