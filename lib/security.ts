import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 128) {
    return "Password is too long";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include uppercase, lowercase, and a number";
  }

  return null;
}

export function hashToken(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateNumericCode(length = 6): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  const value = crypto.randomInt(min, max);
  return String(value);
}
