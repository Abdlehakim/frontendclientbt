import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from "@/auth/useAuth";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      const redirectTo = params.get("redirectTo") || "/app";
      nav(redirectTo);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative w-full h-screen">
      <div className="w-[60%] max-lg:w-full flex justify-center items-center h-screen">
        <div className="px-8 flex flex-col w-150 max-w-[92vw] h-175 max-md:h-auto max-md:py-10 bg-white/80 rounded-xl justify-center gap-4 z-10 shadow">
          <div className="flex flex-col gap-2 items-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Bienvenu</h1>
            <p className="text-lg text-gray-600">Login to your account.</p>

            <div className="flex items-center w-75 gap-2">
              <div className="grow border-t border-gray-300" />
              <Link to="/signup" className="text-indigo-600 text-sm font-semibold hover:underline">
                Click here to create an account
              </Link>
              <div className="grow border-t border-gray-300" />
            </div>
          </div>

          {err && <p className="text-red-600 font-medium">{err}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-lg font-medium text-gray-900">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Votremail@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-12.5 border px-4 border-indigo-600 rounded-md focus:outline-none text-sm font-semibold bg-white"
              />
            </div>

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
                  autoComplete="current-password"
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
              {isSubmitting ? "Signing in..." : "Sign in to your account"}
            </button>

            <div className="flex items-center justify-between m-4 text-sm font-semibold">
              <label className="inline-flex items-center text-gray-600">
                <input type="checkbox" className="mr-2 w-4 h-4" />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="fixed inset-0 -z-10">
        <img src="/signin.jpg" alt="signin background" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
