/**
 * forms-store.js
 *
 * Yeh file poori app ka "database" hai.
 * Koi real server ya database nahi hai — sab kuch browser ke
 * localStorage mein save hota hai.
 *
 * Do separate keys use kiye hain:
 *   - FORMS_KEY  → saare forms ka array
 *   - RESP_KEY   → saare submitted responses ka array
 *
 * Agar kabhi real backend add karna ho, sirf read() aur write()
 * functions ko API calls se replace karo — baaki sab wahi rahega.
 */

// localStorage keys — unique strings jisse data identify hota hai
const FORMS_KEY = "fb.forms.v1";
const RESP_KEY = "fb.responses.v1";

// Check karo ki hum browser mein hain ya Next.js ke server par
// Server par window exist nahi karta, isliye yeh check zaroori hai
const isBrowser = () => typeof window !== "undefined";

// localStorage se data padhta hai.
// Agar data nahi mila ya koi error aaya, to fallback return karo.
function read(key, fallback) {
  if (!isBrowser()) return fallback; // Server par chalane se rokta hai
  try {
    const raw = window.localStorage.getItem(key); // String milti hai
    return raw ? JSON.parse(raw) : fallback;       // String ko object mein badlo
  } catch {
    return fallback; // Corrupt data hone par crash mat karo
  }
}

// localStorage mein data likhta hai.
// Object ko JSON string mein convert karke save karta hai.
function write(key, value) {
  if (!isBrowser()) return; // Server par kuch mat karo
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Unique ID generator — har form aur field ke liye alag ID banata hai.
// Example output: "form_k3x9a2z1p" ya "f_mn7q3"
// Math.random() + Date.now() use karta hai taaki IDs kabhi repeat na hon.
export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}

export const defaultStyle = {
  primaryColor: "#2563eb",
  background: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  align: "left",
};

// Saare saved forms laata hai, sabse recently updated pehle.
export function listForms() {
  return read(FORMS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

// Ek specific form dhundta hai uske ID se.
// Nahi mila to undefined return karta hai.
export function getForm(id) {
  return listForms().find((f) => f.id === id);
}

// Existing form ko update karta hai localStorage mein.
// Agar form pehle se hai to replace karta hai, nahi to add karta hai.
export function saveForm(form) {
  const forms = read(FORMS_KEY, []);
  const idx = forms.findIndex((f) => f.id === form.id); // Form ka index dhundo
  const next = { ...form, updatedAt: Date.now() };       // updatedAt refresh karo
  if (idx >= 0) forms[idx] = next; // Purana replace karo
  else forms.push(next);           // Naya add karo
  write(FORMS_KEY, forms);
}

// Bilkul naya blank form banata hai aur localStorage mein save karta hai.
// "partial" se custom title/description provide kar sakte hain (optional).
export function createForm(partial) {
  const now = Date.now();
  const form = {
    id: uid("form"),                           // Unique ID generate karo
    title: partial?.title ?? "Untitled form",  // Default title
    description: partial?.description ?? "",
    fields: partial?.fields ?? [],             // Shuru mein koi field nahi
    style: partial?.style ?? defaultStyle,     // Default design settings
    createdAt: now,
    updatedAt: now,
  };
  const forms = read(FORMS_KEY, []);
  forms.push(form);
  write(FORMS_KEY, forms);
  return form; // Naya form return karo (ID chahiye hogi redirect ke liye)
}

// Form aur uske SAARE responses dono delete karta hai.
// Yeh important hai — form delete hone par orphan responses nahi bachne chahiye.
export function deleteForm(id) {
  write(FORMS_KEY, read(FORMS_KEY, []).filter((f) => f.id !== id));
  write(RESP_KEY, read(RESP_KEY, []).filter((r) => r.formId !== id));
}

// Existing form ki exact copy banata hai nayi ID ke saath.
// Note: Har field ko bhi nayi ID milti hai — warna duplicate IDs hoti.
export function duplicateForm(id) {
  const orig = getForm(id);
  if (!orig) return; // Form nahi mila — kuch mat karo
  const copy = {
    ...orig,                                          // Original ki sab properties copy karo
    id: uid("form"),                                  // Nayi unique form ID
    title: `${orig.title} (copy)`,                    // Title mein "(copy)" add karo
    fields: orig.fields.map((f) => ({ ...f, id: uid("f") })), // Har field ki nayi ID
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const forms = read(FORMS_KEY, []);
  forms.push(copy);
  write(FORMS_KEY, forms);
  return copy;
}

// User ka submitted response localStorage mein save karta hai.
// Har response mein formId hota hai jisse pata chale yeh kis form ka hai.
export function addResponse(resp) {
  const all = read(RESP_KEY, []);
  all.push(resp);
  write(RESP_KEY, all);
}

// Ek specific form ke saare responses laata hai, newest pehle.
export function listResponses(formId) {
  return read(RESP_KEY, [])
    .filter((r) => r.formId === formId)      // Sirf is form ke responses chahiye
    .sort((a, b) => b.submittedAt - a.submittedAt); // Naye pehle
}
