export type Role = "STUDENT" | "ADMIN";

export function normalizeRole(role: string | undefined | null): Role {
  return role === "ADMIN" ? "ADMIN" : "STUDENT";
}

export const ROLE_PERMISSIONS = {
  STUDENT: [
    "auth.login",
    "user.readSelf",
    "user.updateSelfProfile",
    "test.readList",
    "test.readDetail",
    "question.readByTest",
    "question.readExplanation",
    "result.createOwn",
    "result.readOwn",
    "progress.readOwn",
    "review.readOwn",
    "pdf.exportOwn",
  ],
  ADMIN: ["*"],
} as const satisfies Record<Role, readonly string[]>;

export function hasPermission(role: string | undefined | null, permission: string): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[role as Role] as readonly string[];
  return permissions.includes("*") || permissions.includes(permission);
}
