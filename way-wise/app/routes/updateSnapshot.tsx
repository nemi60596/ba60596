// routes/updateSnapshot.tsx
//very buggy
import { ActionFunction, json } from "@remix-run/node";

import { prisma } from "../db.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const rawRouteIds = formData.getAll("rawRouteIds") as string[];
  const runIds = formData.getAll("runIds") as string[];

  const rawRouteIdsInt = rawRouteIds
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));
  const runIdsInt = runIds
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id));
  console.log(rawRouteIdsInt, runIdsInt);
  await prisma.resultsRoute.deleteMany({
    where: {
      AND: [
        { rawRouteId: { in: rawRouteIdsInt } },
        { runId: { in: runIdsInt } },
      ],
    },
  });

  return json({ success: true });
};
