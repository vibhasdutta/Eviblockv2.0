const DEFAULT_CONTACT_EMAIL = "support@eviblock.com";

export function getPublicContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL;
}
