import { useAuth } from "@/auth/useAuth";

export default function AppPage() {
  const { user, subscriptionActive, logout } = useAuth();

  return (
    <div className="min-h-screen p-6 bg-neutral-50">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button onClick={logout} className="border rounded-lg px-3 py-1 bg-white">
            Logout
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-2">
          <div>
            Email: <span className="font-medium">{user?.email}</span>
          </div>

          <div>
            Subscription:{" "}
            <span className={`font-medium ${subscriptionActive ? "text-green-600" : "text-red-600"}`}>
              {subscriptionActive ? "active" : "inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
