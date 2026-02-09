import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from "@/auth/useAuth";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  // UI fields (backend currently uses only email + password)
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [err, setErr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setIsSubmitting(true);

    try {
      await signup(email, password);
      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign-up failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative w-full h-screen">
      <div className="w-[60%] max-lg:w-full flex justify-center items-center h-screen">
        <div className="px-8 flex flex-col w-150 max-w-[92vw] h-175 max-md:h-auto max-md:py-10 bg-white/80 rounded-xl justify-center gap-4 z-10 shadow">
          <div className="flex flex-col gap-2 items-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Bienvenu Client</h1>
            <p className="text-lg text-gray-600">Create an account.</p>

            <div className="text-sm text-gray-600">
              Vous avez deja un compte ?{" "}
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
                Connectez-vous
              </Link>
            </div>

            <div className="flex items-center w-75 gap-2">
              <div className="grow border-t border-gray-300" />
              <Link to="/login" className="text-indigo-600 text-sm font-semibold hover:underline">
                Click here pour connectez a votre compte
              </Link>
              <div className="grow border-t border-gray-300" />
            </div>
          </div>

          {err && <p className="text-red-600 text-center font-semibold">{err}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {/* Username (UI only for now) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-lg font-medium text-gray-900">
                Username
              </label>
              <input
                id="username"
                placeholder="Votre name"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12.5 border px-4 border-indigo-600 rounded-md focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            {/* Phone (UI only for now) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="phone" className="text-lg font-medium text-gray-900">
                Phone (optional)
              </label>
              <input
                id="phone"
                placeholder="Numero de telephone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-12.5 border px-4 border-indigo-600 rounded-md focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-lg font-medium text-gray-900">
                Email
              </label>
              <input
                id="email"
                placeholder="Votremail@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-12.5 border px-4 border-indigo-600 rounded-md focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1 relative">
              <label htmlFor="password" className="text-lg font-medium text-gray-900">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  placeholder="*******"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full border border-indigo-600 rounded-md px-3 py-2 pr-10 focus:outline-none text-lg font-semibold bg-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <AiOutlineEyeInvisible size={22} /> : <AiOutlineEye size={22} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12.5 w-full text-white text-lg font-semibold py-2 rounded-md bg-indigo-600 transition duration-200 mt-4 hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? "Signing up..." : "Sign up"}
            </button>
          </form>
        </div>
      </div>

      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <img src="/signin.jpg" alt="signin background" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
