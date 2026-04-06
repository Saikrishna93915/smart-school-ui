/* =========================
   USER ROLES
========================= */
export type UserRole =
  | "admin"
  | "owner"
  | "teacher"
  | "parent"
  | "student"
  | "accountant"
  | "cashier"
  | "principal"
  | "driver";

/* =========================
   USER (AUTH CONTEXT)
   – MUST MATCH BACKEND LOGIN RESPONSE
========================= */
export interface User {
  _id?: string;                // optional MongoDB id
  id?: string;                 // optional normalized id
  name: string;                 // ✅ REQUIRED (Nagendra Babu)
  role: UserRole;               // ✅ REQUIRED
  forcePasswordChange: boolean; // ✅ REQUIRED
  email?: string;               // optional (useful later)
  phone?: string;               // optional phone number
  createdAt?: string;           // account creation date
  updatedAt?: string;           // last update date
}

/* =========================
   AUTH STATE
========================= */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

/* =========================
   ROLE LABELS (UI)
========================= */
export const roleLabels: Record<UserRole, string> = {
  admin: "School Admin",
  owner: "School Owner",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
  accountant: "Accountant",
  cashier: "Cashier",
  principal: "Principal",
  driver: "Driver",
};

/* =========================
   ROLE COLORS (UI)
========================= */
export const roleColors: Record<UserRole, string> = {
  admin: "bg-primary text-primary-foreground",
  owner: "bg-warning text-warning-foreground",
  teacher: "bg-secondary text-secondary-foreground",
  parent: "bg-accent text-accent-foreground",
  student: "bg-success text-success-foreground",
  accountant: "bg-blue-500 text-blue-50",
  cashier: "bg-teal-500 text-teal-50",
  principal: "bg-indigo-600 text-white",
  driver: "bg-orange-500 text-orange-50",
};