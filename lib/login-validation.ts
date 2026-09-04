type Translate = (key: string) => string;

export type LoginFieldErrors = {
  email?: string;
  password?: string;
  code?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginEmail(email: string, t: Translate): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return t("login.emailRequired");
  if (!EMAIL_RE.test(trimmed)) return t("login.emailInvalid");
  return undefined;
}

export function validateLoginPassword(password: string, t: Translate): string | undefined {
  if (!password) return t("login.passwordRequired");
  return undefined;
}

export function validateLoginCode(code: string, t: Translate): string | undefined {
  if (!/^\d{6}$/.test(code.trim())) return t("login.codeInvalid");
  return undefined;
}
