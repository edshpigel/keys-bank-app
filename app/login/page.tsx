"use client";

import {
  Alert,
  Button,
  FieldError,
  Input,
  InputGroup,
  InputOTP,
  Label,
  REGEXP_ONLY_DIGITS,
  Tabs,
  TextField,
} from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { AppLoadingScreen } from "@/components/app-loading-screen";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ApiError, api } from "@/lib/api";
import { useT } from "@/lib/i18n-provider";
import {
  type LoginFieldErrors,
  validateLoginCode,
  validateLoginEmail,
  validateLoginPassword,
} from "@/lib/login-validation";
import {
  getTelegramInitData,
  initTelegramUi,
  isTelegramWebApp,
} from "@/lib/telegram";
import { useBrowserAutofillSync } from "@/lib/use-browser-autofill-sync";
import { useAppNavigation } from "@/lib/navigation";

const loginTabsClass = [
  "grid w-full grid-cols-2 gap-1 rounded-2xl border border-brand-border bg-brand-cream p-1",
  "**:data-[slot=tabs-tab]:!h-auto",
  "**:data-[slot=tabs-tab]:rounded-full",
  "**:data-[slot=tabs-tab]:px-3",
  "**:data-[slot=tabs-tab]:py-2",
  "**:data-[slot=tabs-tab]:text-sm",
  "**:data-[slot=tabs-tab]:font-medium",
  "**:data-[slot=tabs-tab]:text-brand-text-muted",
  "**:data-[slot=tabs-tab]:data-[selected=true]:text-brand-text",
  "**:data-[slot=tabs-indicator]:rounded-full",
  "**:data-[slot=tabs-indicator]:bg-white",
  "**:data-[slot=tabs-indicator]:shadow-sm",
].join(" ");

function LoginForm() {
  const t = useT();
  const { navigate } = useAppNavigation();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"code" | "password">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);
  const [tgChecking, setTgChecking] = useState(true);

  const goNext = useCallback(() => {
    const next = searchParams.get("next") || "/points/";
    navigate(next.startsWith("/") ? next : "/points/", { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function tryTelegram() {
      if (!isTelegramWebApp()) {
        setTgChecking(false);
        return;
      }
      initTelegramUi();
      const initData = getTelegramInitData();
      if (!initData) {
        setTgChecking(false);
        return;
      }
      try {
        const res = await api.auth.telegramInit({ init_data: initData });
        if (cancelled) return;
        if (res.needs_bind) {
          setTelegramUserId(res.telegram_user_id || null);
          setMode("code");
          setInfo(t("login.telegramLink"));
          setTgChecking(false);
          return;
        }
        if (res.ok !== false) {
          goNext();
          return;
        }
      } catch {
        /* manual login */
      }
      if (!cancelled) setTgChecking(false);
    }

    void tryTelegram();
    return () => {
      cancelled = true;
    };
  }, [goNext, t]);

  const autofillFields = useMemo(
    () => [
      { name: "username", value: email, setValue: setEmail },
      { name: "password", value: password, setValue: setPassword },
    ],
    [email, password, setEmail, setPassword],
  );

  useBrowserAutofillSync(mode === "password", autofillFields);

  function readPasswordFormValues(form: HTMLFormElement) {
    const emailEl = form.elements.namedItem("username") as HTMLInputElement | null;
    const passwordEl = form.elements.namedItem("password") as HTMLInputElement | null;
    return {
      email: (emailEl?.value ?? email).trim(),
      password: passwordEl?.value ?? password,
    };
  }

  function onFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "password") {
      void onPasswordLogin(e);
      return;
    }
    if (!codeSent) {
      void onRequestCode(e);
      return;
    }
    void onVerifyCode(e);
  }

  function mapError(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status >= 500) return t("login.serverError");
      if (err.status === 403) return t("login.forbidden");
      if (err.status === 401) return t("login.invalidCredentials");
      if (err.status === 429) return t("login.rateLimited");
      return err.message;
    }
    return t("common.networkError");
  }

  function clearField(name: keyof LoginFieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormError(null);
  }

  async function onRequestCode(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    const form = e?.currentTarget;
    const emailValue = form
      ? ((form.elements.namedItem("otp-email") as HTMLInputElement | null)?.value ?? email).trim()
      : email.trim();
    if (emailValue !== email) setEmail(emailValue);

    const emailError = validateLoginEmail(emailValue, t);
    setFieldErrors(emailError ? { email: emailError } : {});
    if (emailError) return;

    setFormError(null);
    setLoading(true);
    try {
      await api.auth.otpRequest({ email: emailValue });
      setCodeSent(true);
      setInfo(t("login.codeSent"));
    } catch (err) {
      const message = mapError(err);
      setFieldErrors({ email: message });
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(value: string) {
    const codeError = validateLoginCode(value, t);
    if (codeError) {
      setFieldErrors({ code: codeError });
      return;
    }
    if (loading) return;

    setFieldErrors({});
    setFormError(null);
    setLoading(true);
    try {
      if (telegramUserId) {
        await api.auth.telegramBind({
          telegram_user_id: telegramUserId,
          email: email.trim(),
          code: value.trim(),
        });
      } else {
        await api.auth.otpVerify({ email: email.trim(), code: value.trim() });
      }
      goNext();
    } catch (err) {
      setFieldErrors({ code: mapError(err) });
      setLoading(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    await verifyCode(code);
  }

  async function onPasswordLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { email: emailValue, password: passwordValue } = readPasswordFormValues(e.currentTarget);

    if (emailValue !== email) setEmail(emailValue);
    if (passwordValue !== password) setPassword(passwordValue);

    const errors: LoginFieldErrors = {};
    const emailError = validateLoginEmail(emailValue, t);
    const passwordError = validateLoginPassword(passwordValue, t);
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    if (emailError || passwordError) return;

    setFormError(null);
    setLoading(true);
    try {
      await api.auth.login({ email: emailValue, password: passwordValue });
      goNext();
    } catch (err) {
      const message = mapError(err);
      setFieldErrors({ password: message });
      setLoading(false);
    }
  }

  if (tgChecking) {
    return <AppLoadingScreen message={t("login.telegramChecking")} native />;
  }

  return (
    <div className="safe-top safe-bottom flex min-h-dvh items-center justify-center bg-brand-header px-4 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(182,153,85,0.35), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(182,153,85,0.2), transparent 45%)",
        }}
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher variant="dark" compact />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <form
            id="login-form"
            method="post"
            autoComplete="on"
            onSubmit={onFormSubmit}
            className="w-full"
            noValidate
          >
          <Tabs
            selectedKey={mode}
            onSelectionChange={(key) => {
              setMode(key as "code" | "password");
              setFieldErrors({});
              setFormError(null);
              setInfo(null);
            }}
            className="w-full"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Auth mode" className={loginTabsClass}>
                <Tabs.Tab id="code">
                  {t("login.tabCode")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="password">
                  {t("login.tabPassword")}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            {formError ? (
              <Alert status="danger" className="mt-4">
                {formError}
              </Alert>
            ) : null}
            {info ? (
              <Alert status="accent" className="mt-4">
                {info}
              </Alert>
            ) : null}

            <Tabs.Panel id="code" className="mt-4">
              {!codeSent ? (
                <div className="space-y-4">
                  <TextField
                    name="otp-email"
                    type="email"
                    isRequired
                    value={email}
                    onChange={(value) => {
                      setEmail(value);
                      clearField("email");
                    }}
                    isInvalid={Boolean(fieldErrors.email)}
                    validationBehavior="aria"
                    className="w-full"
                    aria-label={t("login.email")}
                  >
                    <Input
                      id="login-otp-email"
                      name="otp-email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={t("login.email")}
                    />
                    <FieldError>{fieldErrors.email}</FieldError>
                  </TextField>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="h-12 rounded-xl bg-brand-gold text-base font-semibold text-white"
                    isDisabled={loading}
                  >
                    {loading ? t("login.sendingCode") : t("login.sendCode")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-sm text-brand-text-muted">{email}</p>
                  <div className="space-y-2">
                    <Label className="block text-center">{t("login.code")}</Label>
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        clearField("code");
                      }}
                      autoFocus
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      isDisabled={loading}
                      isInvalid={Boolean(fieldErrors.code)}
                      className="kb-auth-otp justify-center"
                      onComplete={(value) => {
                        void verifyCode(value);
                      }}
                    >
                      <InputOTP.Group>
                        <InputOTP.Slot index={0} />
                        <InputOTP.Slot index={1} />
                        <InputOTP.Slot index={2} />
                      </InputOTP.Group>
                      <InputOTP.Separator />
                      <InputOTP.Group>
                        <InputOTP.Slot index={3} />
                        <InputOTP.Slot index={4} />
                        <InputOTP.Slot index={5} />
                      </InputOTP.Group>
                    </InputOTP>
                    {fieldErrors.code ? (
                      <p className="text-center text-sm text-danger" role="alert">
                        {fieldErrors.code}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    className="h-12 rounded-xl bg-brand-gold text-base font-semibold text-white"
                    isDisabled={loading || code.length !== 6}
                  >
                    {loading ? t("login.verifying") : t("login.verifyCode")}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-brand-text-muted underline"
                    onClick={() => {
                      setCodeSent(false);
                      setCode("");
                      setFieldErrors({});
                    }}
                  >
                    {t("login.changeEmail")}
                  </button>
                </div>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="password" className="mt-4">
              <div className="space-y-4">
                <TextField
                  name="username"
                  type="email"
                  isRequired
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    clearField("email");
                  }}
                  isInvalid={Boolean(fieldErrors.email)}
                  validationBehavior="aria"
                  className="w-full"
                  aria-label={t("login.email")}
                >
                  <Input
                    id="login-email"
                    name="username"
                    autoComplete="username"
                    inputMode="email"
                    spellCheck={false}
                    placeholder={t("login.email")}
                  />
                  <FieldError>{fieldErrors.email}</FieldError>
                </TextField>

                <TextField
                  name="password"
                  isRequired
                  isInvalid={Boolean(fieldErrors.password)}
                  validationBehavior="aria"
                  className="w-full"
                  aria-label={t("login.password")}
                >
                  <InputGroup>
                    <InputGroup.Input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("login.password")}
                      onInput={() => clearField("password")}
                    />
                    <InputGroup.Suffix>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-brand-text-muted transition hover:bg-black/5 hover:text-brand-text"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? t("login.hidePassword") : t("login.showPassword")
                        }
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" strokeWidth={1.75} />
                        ) : (
                          <Eye className="size-4" strokeWidth={1.75} />
                        )}
                      </button>
                    </InputGroup.Suffix>
                  </InputGroup>
                  <FieldError>{fieldErrors.password}</FieldError>
                </TextField>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="h-12 rounded-xl bg-brand-gold text-base font-semibold text-white"
                  isDisabled={loading}
                >
                  {loading ? t("login.signingIn") : t("login.signIn")}
                </Button>
              </div>
            </Tabs.Panel>
          </Tabs>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AppLoadingScreen native />}>
      <LoginForm />
    </Suspense>
  );
}
