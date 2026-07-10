"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  defaultStyle,
  getForm,
  saveForm,
  uid,
} from "@/lib/forms-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAdminGuard } from "@/hooks/use-admin-guard";

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio group" },
  { value: "checkbox", label: "Checkboxes" },
];

const FONTS = [
  "Inter, system-ui, sans-serif",
  "Georgia, serif",
  "'Courier New', monospace",
  "'Helvetica Neue', Helvetica, Arial, sans-serif",
];

function labelFor(t) {
  switch (t) {
    case "text": return "Short answer";
    case "textarea": return "Long answer";
    case "email": return "Email address";
    case "number": return "Number";
    case "date": return "Date";
    case "dropdown": return "Choose one";
    case "radio": return "Pick an option";
    case "checkbox": return "Select all that apply";
    default: return "Field";
  }
}

export default function BuilderPage() {
  const { formId } = useParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { authorized } = useAdminGuard();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!hydrated || !authorized) return;
    
    // Agar naya form bana rahe hain, to localStorage se mat dhundo
    if (formId === "new") {
      setForm({
        id: uid("form"), // Temporary ID, save hone par pakki ho jayegi
        title: "Untitled form",
        description: "",
        fields: [],
        style: defaultStyle,
      });
      return;
    }

    const f = getForm(formId);
    if (!f) {
      router.push("/");
      return;
    }
    setForm(f);
  }, [hydrated, authorized, formId, router]);

  // Form ki koi bhi property update karne ke liye shortcut function.
  // "patch" mein wahi properties bhejo jo badalni hain.
  // Example: update({ title: "New Title" }) — sirf title badlega
  const update = (patch) =>
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  // --- Actions ---

  const addField = (type) => {
    const f = {
      id: uid("f"),
      type,
      label: labelFor(type),
      required: false,
    };
    if (type === "dropdown" || type === "radio" || type === "checkbox") {
      f.options = ["Option 1"];
    }
    update({ fields: [...form.fields, f] });
  };

  const removeField = (id) => {
    update({ fields: form.fields.filter((f) => f.id !== id) });
  };

  const updateField = (id, patch) => {
    const next = form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f));
    update({ fields: next });
  };

  // ↑ ↓ buttons ke liye: field ko array mein upar ya neeche shift karo.
  // dir = -1 matlab upar, dir = +1 matlab neeche.
  // Boundary check: pehla element upar nahi ja sakta, aakhri neeche nahi.
  const move = (id, dir) => {
    if (!form) return;
    const idx = form.fields.findIndex((f) => f.id === id); // Field ki current position
    const target = idx + dir;                               // Nayi position
    if (idx < 0 || target < 0 || target >= form.fields.length) return; // Out of bounds? Rok lo
    const next = [...form.fields];
    [next[idx], next[target]] = [next[target], next[idx]]; // Two elements swap karo
    update({ fields: next });
  };

  // "Save" button: current form state ko localStorage mein likhta hai.
  const handleSave = () => {
    if (!form) return;
    saveForm(form);
    setSaved(true);
    
    // Agar "new" URL par thay, to actual ID wale URL par URL replace karo
    // Isse form localStorage mein safe rahega refresh par
    if (formId === "new") {
      router.replace(`/builder/${form.id}`);
    }
    
    setTimeout(() => setSaved(false), 1500);
  };

  if (!authorized || !form) {
    return (
      <div className="grid min-h-screen place-items-center text-neutral-500">
        Loading builder…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">
              ← All forms
            </Link>
            <span className="text-neutral-300">/</span>
            <input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className="rounded px-2 py-1 text-sm font-semibold outline-none hover:bg-neutral-100 focus:bg-neutral-100"
            />
          </div>
          <div className="flex items-center gap-2">
            {formId !== "new" && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/form/${form.id}`;
                  navigator.clipboard.writeText(url);
                  alert("Share Link copied to clipboard!\n\n" + url);
                }}
                className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Share Link
              </button>
            )}
            <a
              href={formId === "new" ? "#" : `/form/${form.id}`}
              target="_blank"
              onClick={(e) => {
                if (formId === "new") {
                  e.preventDefault();
                  alert("Please save the form first to preview it.");
                }
              }}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Preview
            </a>
            <button
              onClick={handleSave}
              className="min-w-[5rem] rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Add field
          </h3>
          <div className="mt-3 grid gap-1.5">
            {FIELD_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => addField(t.value)}
                className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
              >
                {t.label}
                <span className="text-lg leading-none">+</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-xl border border-neutral-200 bg-white p-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="A short intro for people filling this out…"
            className="mt-2 w-full resize-y rounded-md border border-neutral-200 p-3 text-sm outline-none focus:border-neutral-900"
            rows={2}
          />

          <div className="mt-6 space-y-4">
            {form.fields.length === 0 && (
              <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                Add a field from the left to get started.
              </div>
            )}
            {form.fields.map((field, i) => (
              <FieldEditor
                key={field.id}
                field={field}
                index={i}
                total={form.fields.length}
                onChange={(patch) => updateField(field.id, patch)}
                onRemove={() => removeField(field.id)}
                onMove={(dir) => move(field.id, dir)}
              />
            ))}
          </div>
        </main>

        <aside className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Design
          </h3>
          <div className="mt-4 space-y-4 text-sm">
            <ColorInput
              label="Primary color"
              value={form.style.primaryColor}
              onChange={(v) => update({ style: { ...form.style, primaryColor: v } })}
            />
            <ColorInput
              label="Background"
              value={form.style.background}
              onChange={(v) => update({ style: { ...form.style, background: v } })}
            />
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Font</label>
              <select
                value={form.style.fontFamily}
                onChange={(e) => update({ style: { ...form.style, fontFamily: e.target.value } })}
                className="w-full rounded-md border border-neutral-200 px-2 py-1.5"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f.split(",")[0].replace(/'/g, "")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Alignment</label>
              <div className="flex gap-2">
                {["left", "center"].map((a) => (
                  <button
                    key={a}
                    onClick={() => update({ style: { ...form.style, align: a } })}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize ${
                      form.style.align === a
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => update({ style: defaultStyle })}
              className="w-full rounded-md border border-neutral-200 px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-900"
            >
              Reset design
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FieldEditor({ field, index, total, onChange, onRemove, onMove }) {
  const hasOptions = useMemo(
    () => field.type === "dropdown" || field.type === "radio" || field.type === "checkbox",
    [field.type]
  );

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full rounded px-2 py-1 text-sm font-medium outline-none hover:bg-neutral-50 focus:bg-neutral-50"
          />
          <p className="mt-0.5 px-2 text-xs uppercase tracking-wide text-neutral-400">
            {field.type}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded px-2 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            onClick={onRemove}
            className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      </div>

      {(field.type === "text" ||
        field.type === "textarea" ||
        field.type === "email" ||
        field.type === "number") && (
        <input
          value={field.placeholder ?? ""}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          placeholder="Placeholder text"
          className="mt-3 w-full rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
        />
      )}

      {hasOptions && (
        <div className="mt-3 space-y-2">
          {(field.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => {
                  const next = [...(field.options ?? [])];
                  next[i] = e.target.value;
                  onChange({ options: next });
                }}
                className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 text-sm"
              />
              <button
                onClick={() =>
                  onChange({ options: (field.options ?? []).filter((_, j) => j !== i) })
                }
                className="rounded px-2 py-1 text-xs text-neutral-500 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              onChange({
                options: [
                  ...(field.options ?? []),
                  `Option ${(field.options?.length ?? 0) + 1}`,
                ],
              })
            }
            className="text-xs font-medium text-neutral-700 hover:text-neutral-900"
          >
            + Add option
          </button>
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={!!field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        Required
      </label>
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-neutral-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-neutral-200"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-neutral-200 px-2 py-1.5 font-mono text-xs"
        />
      </div>
    </div>
  );
}
