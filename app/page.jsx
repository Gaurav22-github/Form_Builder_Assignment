"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createForm,
  deleteForm,
  duplicateForm,
  listForms,
} from "@/lib/forms-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function HomePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const [forms, setForms] = useState(() =>
    typeof window === "undefined" ? [] : listForms()
  );

  const refresh = () => setForms(listForms());

  const handleCreate = () => {
    const f = createForm();
    router.push(`/builder/${f.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-neutral-900 font-bold text-white">
              F
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Formcraft
            </span>
          </Link>
          <button
            onClick={handleCreate}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            New form
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          No-code form builder
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Build forms that feel bespoke — without writing a line of code.
        </h1>
        <p className="mt-4 max-w-xl text-neutral-600">
          Add fields, tune the look, share a link, and watch responses pile up
          in a clean dashboard. Everything is stored locally in your browser,
          so it works offline too.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCreate}
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Start a blank form
          </button>
          <a
            href="#your-forms"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-white"
          >
            View my forms
          </a>
        </div>
      </section>

      <section id="your-forms" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Your forms
            </h2>
            <p className="text-sm text-neutral-500">
              {hydrated
                ? `${forms.length} form${forms.length === 1 ? "" : "s"}`
                : "Loading…"}
            </p>
          </div>
        </div>

        {hydrated && forms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <h3 className="text-lg font-medium">Nothing here yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Create your first form to get started.
            </p>
            <button
              onClick={handleCreate}
              className="mt-5 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Create form
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((f) => (
              <li
                key={f.id}
                className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
              >
                <div>
                  <h3 className="line-clamp-1 text-base font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-neutral-500">
                    {f.description || "No description"}
                  </p>
                  <p className="mt-3 text-xs text-neutral-400">
                    {f.fields.length} field{f.fields.length === 1 ? "" : "s"} ·
                    updated {new Date(f.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/builder/${f.id}`}
                    className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/form/${f.id}`}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-100"
                  >
                    Open
                  </Link>
                  <Link
                    href={`/responses/${f.id}`}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-100"
                  >
                    Responses
                  </Link>
                  <button
                    onClick={() => {
                      duplicateForm(f.id);
                      refresh();
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 hover:bg-neutral-100"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${f.title}"? This cannot be undone.`)) {
                        deleteForm(f.id);
                        refresh();
                      }
                    }}
                    className="rounded-md border border-red-200 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-neutral-500">
          Formcraft · Built for the web development assignment.
        </div>
      </footer>
    </div>
  );
}
