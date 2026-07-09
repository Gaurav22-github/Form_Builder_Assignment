# Formcraft — No-Code Form Builder

A small Next.js app to design custom forms without writing code, share a link,
collect responses, and export them as CSV. Built as a web development
assignment submission.

Everything runs client-side; form definitions and responses live in the
browser's `localStorage`, so no backend or account is required to try it.

---

## Tech stack

- **Next.js 14** (App Router)
- **React 18** — plain JSX, no TypeScript
- **Tailwind CSS 3** for styling
- **localStorage** as the data layer (swappable for an API later)

---

## Getting started

```bash
# 1. install dependencies
npm install

# 2. run the dev server
npm run dev

# 3. open the app
# http://localhost:3000
```

Build & run production:

```bash
npm run build
npm start
```

---

## Assignment checklist

| Requirement | Where it lives |
|---|---|
| Create fully customizable forms with a no-code UI | `app/builder/[formId]/page.jsx` |
| Field types: text, textarea, email, number, date, dropdown, radio, checkbox | `FIELD_TYPES` in the builder page |
| Customize layout & styling (colors, fonts, alignment) | Design panel (right sidebar) in the builder |
| Create / edit / duplicate / delete forms | `app/page.jsx` (home dashboard) |
| Manage multiple forms | Home page grid, sorted by last updated |
| Users can fill and submit forms | `app/form/[formId]/page.jsx` |
| Responsive & accessible on all devices | Tailwind responsive classes + semantic HTML |
| Store submitted responses | `lib/forms-store.js` (`addResponse`) |
| Admin can view & download collected data | `app/responses/[formId]/page.jsx` (table + CSV export) |

---

## Project structure

```
nextjs-export/
├── app/
│   ├── layout.jsx              # root layout + site metadata
│   ├── globals.css             # Tailwind directives + base styles
│   ├── page.jsx                # HOME — list, create, duplicate, delete forms
│   ├── builder/
│   │   └── [formId]/
│   │       └── page.jsx        # BUILDER — add/edit fields + design panel
│   ├── form/
│   │   └── [formId]/
│   │       └── page.jsx        # PUBLIC FORM — end user fills & submits
│   └── responses/
│       └── [formId]/
│           └── page.jsx        # RESPONSES — table view + CSV download
├── hooks/
│   └── use-hydrated.js         # avoids SSR/localStorage mismatch
├── lib/
│   └── forms-store.js          # single source of truth for forms/responses
├── package.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.mjs
├── jsconfig.json               # enables the "@/..." import alias
└── README.md
```

---

## Code flow — how a form travels through the app

1. **Home (`app/page.jsx`)**
   - Reads all forms via `listForms()` from `lib/forms-store.js`.
   - "New form" → `createForm()` returns a fresh form object and routes to
     `/builder/<id>`.
   - Duplicate / delete call `duplicateForm()` / `deleteForm()` and refresh
     the local state.

2. **Builder (`app/builder/[formId]/page.jsx`)**
   - Loads the form by id, keeps it in local React state.
   - Left sidebar: add a field of any supported type.
   - Middle: reorder, rename, mark required, edit placeholders/options.
   - Right sidebar: change primary color, background, font, alignment.
   - "Save" calls `saveForm()` which writes the whole schema back to
     `localStorage`.

3. **Public form (`app/form/[formId]/page.jsx`)**
   - Renders each field based on its `type`.
   - Applies the form's own `style` (primary color, background, font,
     alignment) inline so the same form can look completely different.
   - On submit → validates required + email fields → calls `addResponse()`
     to persist the entry.

4. **Responses (`app/responses/[formId]/page.jsx`)**
   - Reads via `listResponses(formId)` and renders a table.
   - "Download CSV" builds a CSV in memory from the current form schema and
     responses, then triggers a browser download — no server involved.

---

## Data model (all in `lib/forms-store.js`)

```
FormSchema {
  id, title, description,
  fields: FormField[],
  style: { primaryColor, background, fontFamily, align },
  createdAt, updatedAt
}

FormField {
  id, type, label,
  placeholder?, required?, options?  // options only for dropdown/radio/checkbox
}

FormResponse {
  id, formId, submittedAt, data: { [fieldId]: value }
}
```

Two `localStorage` keys are used:

- `fb.forms.v1` — array of `FormSchema`
- `fb.responses.v1` — array of `FormResponse`

Swapping this for a real database later means replacing the functions in
`lib/forms-store.js` with `fetch()` calls; nothing else in the UI needs to
change.

---

## Notes

- The `useHydrated()` hook prevents a hydration mismatch when the first
  render reads from `localStorage`.
- No external UI library is used — everything is hand-rolled Tailwind so the
  markup stays easy to read and tweak.
