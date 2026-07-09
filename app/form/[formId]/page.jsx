"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { addResponse, getForm, uid } from "@/lib/forms-store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function FillPage() {
  const { formId } = useParams(); // URL se form ID nikaalte hain
  const hydrated = useHydrated(); // localStorage ready check
  const router = useRouter();     // Redirect ke liye

  // --- State variables ---
  const [form, setForm] = useState(null);      // Form ka structure aur style
  const [values, setValues] = useState({});    // User ki entered values: { fieldId: value }
  const [errors, setErrors] = useState({});    // Validation errors: { fieldId: "Error msg" }
  const [submitted, setSubmitted] = useState(false); // Thank you screen dikhani hai?

  // Page load hone par form data localStorage se lo
  useEffect(() => {
    if (!hydrated) return;        // localStorage ready nahi, wait karo
    const f = getForm(formId);    // Form dhundo
    if (!f) router.push("/");     // Nahi mila? Home pe bhejo
    else setForm(f);              // Mila! State mein save karo
  }, [hydrated, formId, router]);

  if (!form) {
    return (
      <div className="grid min-h-screen place-items-center text-neutral-500">
        Loading…
      </div>
    );
  }

  // User jab bhi koi field mein kuch type karta/karti hai
  // values state update hoti hai: values[fieldId] = newValue
  const setVal = (id, v) => setValues((p) => ({ ...p, [id]: v }));

  // Submit se PEHLE validation karo.
  // Required fields empty hain? Email format sahi hai?
  // Errors object mein save karo taaki red text UI mein dikh sake.
  // Return karta hai: true = koi error nahi (aage badho), false = errors hain (ruko)
  const validate = () => {
    const errs = {};
    for (const f of form.fields) {
      const v = values[f.id];
      if (f.required) {
        // Value empty ya undefined hai?
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
          errs[f.id] = "This field is required";
          continue;
        }
      }
      // Email field ka format check — basic regex pattern
      if (f.type === "email" && typeof v === "string" && v && !/^\S+@\S+\.\S+$/.test(v)) {
        errs[f.id] = "Enter a valid email";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0; // Errors nahi hain to true
  };

  // Form submit button click
  const handleSubmit = (e) => {
    e.preventDefault(); // Browser ka default page-reload rokta hai
    if (!validate()) return; // Errors hain? Yahan hi ruko, submit mat karo

    // Response object banao aur localStorage mein save karo
    addResponse({
      id: uid("resp"),          // Unique response ID
      formId: form.id,          // Kis form ka response hai
      submittedAt: Date.now(),  // Timestamp
      data: values,             // User ki saari entered values
    });
    setSubmitted(true); // Thank you message dikhao
  };

  const primary = form.style.primaryColor;
  const alignClass = form.style.align === "center" ? "text-center" : "text-left";

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{
        backgroundColor: form.style.background,
        fontFamily: form.style.fontFamily,
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 text-xs text-neutral-500">
          <Link href="/" className="hover:underline">
            ← Back to forms
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="h-2" style={{ backgroundColor: primary }} />
          <div className={`p-8 ${alignClass}`}>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-2 text-sm text-neutral-600">{form.description}</p>
            )}

            {submitted ? (
              <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-left">
                <h2 className="text-lg font-semibold text-emerald-800">
                  Thanks — response saved.
                </h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Your submission was recorded.
                </p>
                <button
                  onClick={() => {
                    setValues({});
                    setSubmitted(false);
                  }}
                  className="mt-4 text-sm font-medium underline"
                  style={{ color: primary }}
                >
                  Submit another response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
                {form.fields.map((f) => (
                  <div key={f.id}>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                      {f.label}
                      {f.required && <span style={{ color: primary }}> *</span>}
                    </label>
                    <FieldInput
                      field={f}
                      value={values[f.id]}
                      onChange={(v) => setVal(f.id, v)}
                      primary={primary}
                    />
                    {errors[f.id] && (
                      <p className="mt-1 text-xs text-red-600">{errors[f.id]}</p>
                    )}
                  </div>
                ))}

                {form.fields.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    This form has no fields yet.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={form.fields.length === 0}
                  className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-40"
                  style={{ backgroundColor: primary }}
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange, primary }) {
  const base =
    "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-900";

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} min-h-[100px] resize-y`}
        />
      );
    case "dropdown":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-1.5">
          {(field.options ?? []).map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.id}
                checked={value === o}
                onChange={() => onChange(o)}
                style={{ accentColor: primary }}
              />
              {o}
            </label>
          ))}
        </div>
      );
    case "checkbox": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          {(field.options ?? []).map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={arr.includes(o)}
                onChange={(e) => {
                  const next = e.target.checked ? [...arr, o] : arr.filter((x) => x !== o);
                  onChange(next);
                }}
                style={{ accentColor: primary }}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    default:
      return (
        <input
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
              ? "date"
              : field.type === "email"
              ? "email"
              : "text"
          }
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
  }
}
