import type { User } from "@supabase/supabase-js";

export const schoolDomain =
  process.env.NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN?.replace(/^@/, "").toLowerCase() ?? "";

export const googleHostedDomain =
  process.env.NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN?.replace(/^@/, "").toLowerCase() || schoolDomain;

export function isSchoolUser(user: User | null): boolean {
  if (!user?.email || !schoolDomain) {
    return false;
  }

  const domain = user.email.toLowerCase().split("@").at(-1);
  return domain === schoolDomain || Boolean(domain?.endsWith(`.${schoolDomain}`));
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
