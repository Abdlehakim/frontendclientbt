import { useEffect, useRef, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { MdOutlineArrowDropDownCircle } from "react-icons/md";
import { useAuth } from "@/auth/useAuth";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import type { AccountType } from "@/lib/api";
import signinImg from "@/assets/signin.jpg";

const accountTypeOptions: Array<{ label: string; value: AccountType }> = [
  { label: "Utilisateur individuel", value: "INDIVIDUAL" },
  { label: "Entreprise", value: "ENTERPRISE" },
];

function FormInput({
  id,
  label,
  optional,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold text-gray-900">
        {label}{" "}
        {optional ? (
          <span className="font-medium text-gray-500">(optionnel)</span>
        ) : null}
      </label>

      <input
        id={id}
        {...props}
        className={[
          "h-11 w-full rounded-[5px] border border-[#b9d3ff] bg-white px-4",
          "text-[16px] font-medium text-gray-900 shadow-sm",
          "placeholder:text-gray-400",
          "outline-none transition",
          "focus:border-[#6ea8ff] focus:ring-2 focus:ring-[#d9eaff]",
          className,
        ].join(" ")}
      />
    </div>
  );
}

function AccountTypeDropdown({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (value: AccountType) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected =
    accountTypeOptions.find((option) => option.value === value) ??
    accountTypeOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1.5">
      <label className="text-[15px] font-bold text-gray-900">
        Type de compte
      </label>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "flex h-11 w-full items-center justify-between rounded-[5px]",
          "border border-[#b9d3ff] bg-white px-4 text-left",
          "text-[16px] font-medium text-gray-900 shadow-sm",
          "outline-none transition",
          open
            ? "border-[#6ea8ff] ring-2 ring-[#d9eaff]"
            : "hover:border-[#8bbcff]",
        ].join(" ")}
      >
        <span>{selected.label}</span>

        <span className="flex h-7 w-7 items-center justify-center text-gray-800">
          <MdOutlineArrowDropDownCircle
            size={24}
            className={[
              "transition-transform duration-200",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-gray-200 bg-white p-1.5 shadow-xl">
          {accountTypeOptions.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={[
                  "w-full rounded-sm px-3.5 py-2.5 text-left text-[15px] font-medium transition",
                  isSelected
                    ? "bg-[#d7e8ff] text-[#163d6d]"
                    : "text-gray-800 hover:bg-gray-100",
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [accountType, setAccountType] = useState<AccountType>("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setIsSubmitting(true);

    try {
      await signup({
        name: username.trim() || undefined,
        countryCode,
        phone: phone.trim(),
        email: email.trim(),
        password,
        accountType,
        companyName:
          accountType === "ENTERPRISE"
            ? companyName.trim() || undefined
            : undefined,
      });

      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign-up failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-gray-900">
      <div className="fixed inset-0 z-0">
        <img
          src={signinImg}
          alt="Signup background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0" />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/20 to-transparent" />
      </div>

      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 lg:justify-start lg:px-20">
        <div className="w-full max-w-[520px] rounded-[18px] bg-white/95 px-7 py-7 shadow-2xl backdrop-blur-md max-sm:px-4 max-sm:py-5">
          <div className="mb-5 text-center">
            <h1 className="text-[32px] font-extrabold leading-tight text-gray-950 max-sm:text-3xl">
              Bienvenue Client
            </h1>

            <p className="mt-2 text-[17px] font-medium text-gray-500 max-sm:text-sm">
              Créez votre compte pour accéder à votre espace client.
            </p>

            <p className="mt-3 text-[15px] font-medium text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link
                to="/login"
                className="font-bold text-[#173d6b] transition hover:underline"
              >
                Connectez-vous
              </Link>
            </p>
          </div>

          {err ? (
            <div className="mb-4 rounded-[5px] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {err}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <AccountTypeDropdown
              value={accountType}
              onChange={setAccountType}
            />

            {accountType === "ENTERPRISE" ? (
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormInput
                  id="companyName"
                  label="Nom de l’entreprise"
                  placeholder="Nom de l’entreprise"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <FormInput
                  id="username"
                  label="Nom complet"
                  placeholder="Votre nom"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="name"
                />
              </div>
            ) : (
              <FormInput
                id="username"
                label="Nom complet"
                placeholder="Votre nom"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="name"
              />
            )}

            <div className="grid grid-cols-[220px_1fr] gap-4 max-sm:grid-cols-1">
              <CountryCodeSelect
                value={countryCode}
                onChange={setCountryCode}
                label="Code pays"
              />

              <FormInput
                id="phone"
                label="Téléphone"
                placeholder="Numéro de téléphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel-national"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormInput
                id="email"
                label="Email"
                placeholder="votreemail@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-[15px] font-bold text-gray-900"
              >
                Mot de passe
              </label>

              <div className="relative">
                <input
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-11 w-full rounded-[5px] border border-[#b9d3ff] bg-white px-4 pr-12 text-[16px] font-medium text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6ea8ff] focus:ring-2 focus:ring-[#d9eaff]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 flex items-center text-gray-500 transition hover:text-gray-900"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 h-12 w-full rounded-md bg-[#173d6b] text-[17px] font-bold text-white shadow-lg transition hover:bg-[#0f2f55] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Création du compte..." : "Créer un compte"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
