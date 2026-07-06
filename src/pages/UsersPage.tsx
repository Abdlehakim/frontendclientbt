import { useEffect, useState } from "react";
import { api, type CompanyUserDTO } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";

export default function UsersPage() {
  const { user, subscription } = useAuth();
  const [users, setUsers] = useState<CompanyUserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isCompany = subscription?.plan === "ENTERPRISE";
  const isOwner = user?.role === "OWNER";
  const canManage = isCompany && isOwner;

  async function loadUsers() {
    if (!canManage) return;
    setLoading(true);
    setErr("");
    try {
      const res = await api.listUsers();
      setUsers(res.users ?? []);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [canManage]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      await api.createUser({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim(),
        password,
      });
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId: string) {
    setErr("");
    try {
      await api.deleteUser(userId);
      await loadUsers();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to delete user");
    }
  }

  if (!isCompany) {
    return <div className="rounded-lg bg-white p-5 shadow">This page is available only for company accounts.</div>;
  }

  if (!isOwner) {
    return <div className="rounded-lg bg-white p-5 shadow">Only the account owner can manage users.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
        <p className="text-sm text-slate-600">{subscription?.accountName ?? "Company account"}</p>
      </div>

      {err ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

      <form onSubmit={handleCreate} className="grid gap-3 rounded-lg bg-white p-5 shadow md:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 md:col-span-2"
        >
          {saving ? "Creating..." : "Create user"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
          {loading ? "Loading..." : `${users.length} user${users.length === 1 ? "" : "s"}`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{item.name || "-"}</td>
                  <td className="px-5 py-3">{item.email}</td>
                  <td className="px-5 py-3">{item.phone || "-"}</td>
                  <td className="px-5 py-3">{item.role}</td>
                  <td className="px-5 py-3 text-right">
                    {item.role === "MEMBER" && item.id !== user?.id ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
