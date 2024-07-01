-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Run" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notes" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "runId" INTEGER NOT NULL,
    "rawRouteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Benchmark_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Benchmark_rawRouteId_fkey" FOREIGN KEY ("rawRouteId") REFERENCES "RawRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoutingEngineResult" (
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
    CONSTRAINT "RoutingEngineResult_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rawRoutesId" INTEGER,
    "loadingState" TEXT NOT NULL,
    "unitAvailable" BOOLEAN NOT NULL,
    "modeOfTransport" TEXT NOT NULL,
    "distanceValue" REAL NOT NULL,
    "distanceUnit" TEXT NOT NULL,
    "tollDistanceValue" REAL NOT NULL,
    "tollDistanceUnit" TEXT NOT NULL,
    "durationValue" REAL NOT NULL,
    "durationUnit" TEXT NOT NULL,
    "geometries" TEXT NOT NULL,
    "partOfRoundtrip" BOOLEAN DEFAULT false,
    "co2Value" REAL DEFAULT 0.0,
    "co2Unit" TEXT DEFAULT 'kg',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reference_rawRoutesId_fkey" FOREIGN KEY ("rawRoutesId") REFERENCES "RawRoute" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RawRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startLat" REAL NOT NULL,
    "startLon" REAL NOT NULL,
    "destinationLat" REAL NOT NULL,
    "destinationLon" REAL NOT NULL,
    "distance" REAL NOT NULL DEFAULT 0.0,
    "distanceClass" TEXT NOT NULL DEFAULT 'undefined',
    "regionClass" TEXT NOT NULL DEFAULT 'undefined',
    "referenceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "ResultsRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routinEngineResultId" INTEGER NOT NULL,
    "runId" INTEGER NOT NULL,
    "benchmarkId" INTEGER NOT NULL,
    "rawRouteId" INTEGER NOT NULL,
    "referenceDistance" REAL NOT NULL,
    "referenceDuration" REAL NOT NULL,
    "meanReferenceSpeed" REAL NOT NULL,
    "referenceTollDistance" REAL NOT NULL,
    "referenceGeometries" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" REAL NOT NULL,
    "duration" REAL NOT NULL,
    "meanSpeed" REAL NOT NULL,
    "tollDistance" REAL,
    "rtt" REAL NOT NULL,
    "geometries" TEXT NOT NULL,
    "distanceClass" TEXT NOT NULL,
    "regionClass" TEXT NOT NULL,
    "snapshotId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResultsRoute_routinEngineResultId_fkey" FOREIGN KEY ("routinEngineResultId") REFERENCES "RoutingEngineResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResultsRoute_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResultsRoute_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResultsRoute_rawRouteId_fkey" FOREIGN KEY ("rawRouteId") REFERENCES "RawRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ResultsRoute_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "Snapshot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE INDEX "Benchmark_runId_rawRouteId_idx" ON "Benchmark"("runId", "rawRouteId");

-- CreateIndex
CREATE INDEX "RoutingEngineResult_benchmarkId_idx" ON "RoutingEngineResult"("benchmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_rawRoutesId_key" ON "Reference"("rawRoutesId");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_geometries_key" ON "Reference"("geometries");

-- CreateIndex
CREATE UNIQUE INDEX "RawRoute_referenceId_key" ON "RawRoute"("referenceId");

-- CreateIndex
CREATE INDEX "RawRoute_referenceId_idx" ON "RawRoute"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "RawRoute_startLat_startLon_destinationLat_destinationLon_key" ON "RawRoute"("startLat", "startLon", "destinationLat", "destinationLon");

-- CreateIndex
CREATE INDEX "ResultsRoute_snapshotId_idx" ON "ResultsRoute"("snapshotId");

-- CreateIndex
CREATE INDEX "ResultsRoute_benchmarkId_idx" ON "ResultsRoute"("benchmarkId");

-- CreateIndex
CREATE INDEX "ResultsRoute_routinEngineResultId_idx" ON "ResultsRoute"("routinEngineResultId");
