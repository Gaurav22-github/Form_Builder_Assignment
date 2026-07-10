"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getForm, listResponses } from "@/lib/forms-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAdminGuard } from "@/hooks/use-admin-guard";

export default function ResponsesPage() {
  const { formId } = useParams(); // URL se form ID nikaalte hain
  const hydrated = useHydrated(); // localStorage ready check
  const { authorized } = useAdminGuard();
  const router = useRouter();     // Redirect ke liye

  const [form, setForm] = useState(null);       // Form ka structure (field names ke liye)
  const [responses, setResponses] = useState([]); // Saare submitted responses

  // Page load hone par form aur uske responses localStorage se lo
  useEffect(() => {
    if (!hydrated || !authorized) return;
    const f = getForm(formId);
    if (!f) {
      router.push("/"); // Form nahi mila? Home pe bhejo
      return;
    }
    setForm(f);
    setResponses(listResponses(formId)); // Is form ke saare responses lo
  }, [hydrated, authorized, formId, router]);

  /**
   * CSV string generate karta hai saare responses se.
   * useMemo isliye use kiya: sirf tab recalculate hoga jab form ya responses change hon.
   * Baar baar render hone par unnecessary computation avoid hota hai.
   *
   * CSV format:
   *   Row 1 (headers): "submittedAt","Name","Email",...
   *   Row 2+: "2024-01-15T10:30:00Z","Rahul","rahul@email.com",...
   */
  const csv = useMemo(() => {
    if (!form) return "";

    // Column headers: pehla column time, phir har field ka label
    const headers = ["submittedAt", ...form.fields.map((f) => f.label)];

    // Har response ke liye ek row banao
    const rows = responses.map((r) => [
      new Date(r.submittedAt).toISOString(), // Time ko readable string mein
      ...form.fields.map((f) => {
        const v = r.data[f.id];              // Is field ki value dhundo
        if (Array.isArray(v)) return v.join("; "); // Checkbox: multiple values ko join karo
        return v == null ? "" : String(v);         // Null/undefined ko empty string karo
      }),
    ]);

    // Saari rows ko CSV format mein convert karo (cells ko quotes mein wrap karo)
    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
  }, [form, responses]);

  /**
   * CSV file download karta hai.
   * Koi server nahi chahiye — browser mein hi file banti hai aur download hoti hai.
   *
   * Steps:
   * 1. CSV string se Blob (binary file) banao
   * 2. Blob ke liye temporary URL banao
   * 3. Invisible <a> tag banao aur click karo — download start
   * 4. Temporary URL delete karo (memory free)
   */
  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);             // Temporary browser URL
    const a = document.createElement("a");             // Invisible link
    a.href = url;
    a.download = `${form?.title.replace(/\s+/g, "_") ?? "form"}_responses.csv`;
    a.click();                                         // Download trigger
    URL.revokeObjectURL(url);                          // Memory cleanup
  };

  // Auth check hone tak loading screen
  if (!authorized || !form) {
    return (
      <div className="grid min-h-screen place-items-center text-neutral-500">
        Loading responses…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-xs text-neutral-500 hover:underline">
              ← All forms
            </Link>
            <h1 className="mt-1 text-lg font-semibold">
              {form.title} · Responses
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/builder/${form.id}`}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
            >
              Edit form
            </Link>
            <button
              onClick={downloadCsv}
              disabled={responses.length === 0}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40"
            >
              Download CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm text-neutral-500">
            {responses.length} response{responses.length === 1 ? "" : "s"}
          </p>
        </div>

        {responses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <h3 className="text-lg font-medium">No responses yet</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Share the form link to start collecting answers.
            </p>
            <Link
              href={`/form/${form.id}`}
              className="mt-4 inline-block rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
            >
              Open form
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Submitted</th>
                  {form.fields.map((f) => (
                    <th key={f.id} className="px-4 py-3">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100 align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {new Date(r.submittedAt).toLocaleString()}
                    </td>
                    {form.fields.map((f) => {
                      const v = r.data[f.id];
                      const display = Array.isArray(v)
                        ? v.join(", ")
                        : v == null
                        ? "—"
                        : String(v);
                      return (
                        <td key={f.id} className="px-4 py-3">
                          {display || "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
