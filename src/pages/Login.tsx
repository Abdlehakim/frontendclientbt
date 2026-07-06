import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "@/auth/useAuth";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";
import signinImg from "@/assets/signin.jpg";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setIsSubmitting(true);

    try {
      await login(countryCode, phone.trim(), password);

      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-gray-900">
      <div className="fixed inset-0 z-0">
        <img
          src={signinImg}
          alt="Signin background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/20 to-transparent" />
      </div>

      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 lg:justify-start lg:px-20">
        <div className="w-full max-w-155 rounded-[18px] bg-white/95 px-10 py-10 shadow-2xl backdrop-blur-md max-sm:px-5 max-sm:py-6">
          <div className="mb-8 text-center">
            <h1 className="text-[38px] font-extrabold leading-tight text-gray-950 max-sm:text-3xl">
              Bienvenue
            </h1>

            <p className="mt-3 text-[17px] font-medium text-gray-500 max-sm:text-sm">
              Connectez-vous à votre espace client.
            </p>

            <p className="mt-5 text-[15px] font-medium text-gray-600">
              Vous n’avez pas encore de compte ?{" "}
              <Link
                to="/signup"
                className="font-bold text-[#173d6b] transition hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>

          {err ? (
            <div className="mb-4 rounded-[5px] border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {err}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-[220px_1fr] gap-4 max-sm:grid-cols-1">
              <CountryCodeSelect
                value={countryCode}
                onChange={setCountryCode}
                label="Country code"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone"
                  className="text-[15px] font-bold text-gray-900"
                >
                  Numéro de téléphone
                </label>

                <input
                  id="phone"
                  type="tel"
                  placeholder="Numéro de téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel-national"
                  className="h-12 w-full rounded-[5px] border border-[#b9d3ff] bg-white px-4 text-[16px] font-medium text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6ea8ff] focus:ring-2 focus:ring-[#d9eaff]"
                />
              </div>
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
                  autoComplete="current-password"
                  className="h-12 w-full rounded-[5px] border border-[#b9d3ff] bg-white px-4 pr-12 text-[16px] font-medium text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#6ea8ff] focus:ring-2 focus:ring-[#d9eaff]"
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

            <div className="flex items-center justify-between gap-4 text-sm font-semibold max-sm:flex-col max-sm:items-start">
              <label className="inline-flex cursor-pointer items-center text-gray-600">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                />
                <span>Se souvenir de moi</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-[#173d6b] transition hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 h-13 w-full rounded-md bg-[#173d6b] text-[17px] font-bold text-white shadow-lg transition hover:bg-[#0f2f55] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
