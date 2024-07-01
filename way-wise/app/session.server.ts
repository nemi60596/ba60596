import { createCookieSessionStorage, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { v4 as uuidv4 } from "uuid";

import { prisma } from "../app/db.server";
invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // Set default maxAge to 7 days
  },
});

const ROUTE_RESULTS_SESSION_KEY = "routingSessionId";

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getRouteResults(
  request: Request,
): Promise<string[] | undefined> {
  const session = await getSession(request);
  const sessionId = session.get(ROUTE_RESULTS_SESSION_KEY);
  if (!sessionId) return undefined;

  const routingSession = await prisma.routingSession.findUnique({
    where: { id: sessionId },
  });

  return routingSession ? routingSession.routeResults.split(",") : undefined;
}

export async function createRoutingSession({
  request,
  routeResults,
  remember,
  redirectTo,
}: {
  request: Request;
  routeResults: string[];
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getSession(request);
  const sessionId = uuidv4();
  await prisma.routingSession.create({
    data: {
      id: sessionId,
      routeResults: routeResults.join(","),
    },
  });

  session.set(ROUTE_RESULTS_SESSION_KEY, sessionId);

  const cookieOptions = remember ? { maxAge: 60 * 60 * 24 * 7 } : {};

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, cookieOptions),
    },
  });
}

export async function clearRoutingSession(request: Request) {
  const session = await getSession(request);
  const sessionId = session.get(ROUTE_RESULTS_SESSION_KEY);
  if (sessionId) {
    await prisma.routingSession.delete({
      where: { id: sessionId },
    });
  }
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
