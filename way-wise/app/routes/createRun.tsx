import { ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { redirect } from "react-router";

import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const runNotes = formData.get("runNotes");
  if (runNotes === null) {
    return new Response("No run notes", { status: 400 });
  }
  const run = await prisma.run.create({
    data: {
      notes: runNotes.toString(),
    },
  });
  return redirect(`/selectRoutes/${run.id}`);
}

export default function createRun() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 sm:p-12">
      <div className="container mx-auto space-y-12">
        <div className="p-5 max-w-lg mx-auto my-10 bg-white rounded-xl shadow-md">
          <h1 className="text-5xl font-bold text-blue-600 mb-4">
            Create a new run
          </h1>
          <Form method="post" action="/createRun" className="space-y-6">
            <div className="flex flex-col">
              <label
                htmlFor="runNotes"
                className="mb-2 font-medium text-gray-600"
              >
                Notes (Markdown supported)
              </label>
              <textarea
                id="runNotes"
                name="runNotes"
                placeholder="Enter your markdown notes here"
                rows={5}
                className="form-textarea px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Create run
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
