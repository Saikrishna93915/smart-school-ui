/* =========================
   USER ROLES
========================= */
export type UserRole =
  | "admin"
  | "owner"
  | "teacher"
  | "parent"
  | "student";

/* =========================
   USER (AUTH CONTEXT)
   – MUST MATCH BACKEND LOGIN RESPONSE
========================= */
export interface User {
  name: string;                 // ✅ REQUIRED (Nagendra Babu)
  role: UserRole;               // ✅ REQUIRED
  forcePasswordChange: boolean; // ✅ REQUIRED
  email?: string;               // optional (useful later)
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
};
