import { PrismaClient } from "@prisma/client";

import { singleton } from "./singleton.server";

// Hard-code a unique key, so we can look up the client when this module gets re-imported
const prisma = singleton(
  "prisma",
  () =>
    new PrismaClient({
      //   log: [
      //     { level: "query", emit: "stdout" }, // Log all queries to stdout
      //     { level: "info", emit: "stdout" }, // Log informational logs to stdout
      //     { level: "warn", emit: "stdout" }, // Log warnings to stdout
      //     { level: "error", emit: "stdout" }, // Log errors to stdout
      //   ],
    }),
);

prisma.$connect();

export { prisma };
