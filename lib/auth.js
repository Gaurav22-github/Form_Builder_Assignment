/**
 * auth.js — Admin Authentication
 *
 * Simple session-based auth using localStorage.
 * Admin ek password enter karta hai, hum localStorage mein
 * "logged in" flag save kar dete hain.
 */

// ✏️ Admin password yahan set karo
const ADMIN_PASSWORD = "admin123";

const SESSION_KEY = "fb.admin.session";
const isBrowser = () => typeof window !== "undefined";

/** Check karo ki admin logged in hai ya nahi */
export function isAdminLoggedIn() {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(SESSION_KEY) === "true";
}

/** Admin login attempt */
export function adminLogin(password) {
  if (password === ADMIN_PASSWORD) {
    if (isBrowser()) {
      window.localStorage.setItem(SESSION_KEY, "true");
    }
    return true;
  }
  return false;
}

/** Admin logout */
export function adminLogout() {
  if (isBrowser()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
}
