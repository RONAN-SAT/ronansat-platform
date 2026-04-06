export type Role = "STUDENT" | "PARENT" | "ADMIN";

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
    "review.chatOwn",
    "pdf.exportOwn",
  ],
  PARENT: [
    "auth.login",
    "user.readSelf",
    "user.updateSelfProfile",
    "parentLink.requestChildVerification",
    "parentLink.verifyChildCode",
    "parentLink.create",
    "parentLink.readOwnChildren",
    "result.readChild",
    "progress.readChild",
    "review.readChild",
    "pdf.exportChild",
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
