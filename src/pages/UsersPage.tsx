import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
import { api, type CompanyUserDTO } from "@/lib/api";
import { useAuth } from "@/auth/useAuth";
import { CountryCodeSelect } from "@/components/CountryCodeSelect";

export default function UsersPage() {
  const { user, subscription } = useAuth();
  const [users, setUsers] = useState<CompanyUserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const createModalRef = useRef<HTMLFormElement | null>(null);

  const isCompany = subscription?.plan === "ENTERPRISE";
  const isOwner = user?.role === "OWNER";
  const canManage = isCompany && isOwner;

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((item) =>
      [item.name, item.email, item.phone, item.role].some((value) => (value ?? "").toLowerCase().includes(q)),
    );
  }, [users, searchTerm]);

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

  useEffect(() => {
    if (!createOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        setCreateOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [createOpen, saving]);

  function closeCreateModal() {
    if (saving) return;
    setCreateOpen(false);
  }

  function closeOnBackdrop(e: MouseEvent<HTMLDivElement>) {
    if (saving) return;
    if (createModalRef.current && !createModalRef.current.contains(e.target as Node)) {
      setCreateOpen(false);
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr("");

    try {
      await api.createUser({
        name: name.trim() || undefined,
        countryCode,
        phone: phone.trim(),
        email: email.trim(),
        password,
      });
      setName("");
      setCountryCode("+1");
      setPhone("");
      setEmail("");
      setPassword("");
      await loadUsers();
      setCreateOpen(false);
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

  const inputClass =
    "form-control w-full rounded-md border text-xs font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const createUserModal =
    createOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-99">
            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center p-4" onMouseDown={closeOnBackdrop}>
              <form
                ref={createModalRef}
                onSubmit={handleCreate}
                className="w-full max-w-3xl max-h-[95vh] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
              >
                <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Ajouter User</div>

                  <button
                    type="button"
                    onClick={closeCreateModal}
                    aria-label="Fermer"
                    title="Fermer"
                    disabled={saving}
                    className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <CiCircleRemove size={28} />
                  </button>
                </div>

                {err ? <div className="px-5 pt-3 text-sm text-red-600">{err}</div> : null}

                <div className="px-5 py-4 overflow-auto">
                  <div className="flex flex-col gap-4">
                    <div className="text-sm font-semibold text-gray-800">Informations utilisateur</div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-700 mb-1" htmlFor="create-user-name">
                          Name
                        </label>
                        <input
                          id="create-user-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Name"
                          className={inputClass}
                        />
                      </div>

                      <CountryCodeSelect
                        value={countryCode}
                        onChange={setCountryCode}
                        label="Country code"
                        className="[&>label]:text-xs [&>label]:font-semibold [&>label]:text-gray-700"
                        buttonClassName="h-10"
                      />

                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-700 mb-1" htmlFor="create-user-phone">
                          Phone
                        </label>
                        <input
                          id="create-user-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone"
                          type="tel"
                          required
                          autoComplete="tel-national"
                          className={inputClass}
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-gray-700 mb-1" htmlFor="create-user-email">
                          Email
                        </label>
                        <input
                          id="create-user-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email"
                          type="email"
                          required
                          autoComplete="email"
                          className={inputClass}
                        />
                      </div>

                      <div className="flex flex-col md:col-span-2">
                        <label className="text-xs font-semibold text-gray-700 mb-1" htmlFor="create-user-password">
                          Password
                        </label>
                        <input
                          id="create-user-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          type="password"
                          required
                          minLength={8}
                          autoComplete="new-password"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="
                    rounded-b-xl bg-gray-50
                    border-t border-slate-900/10
                    px-3.5 pt-2.5 pb-3.5
                    flex items-center justify-between gap-3
                  "
                >
                  <div className="flex items-center justify-start gap-2 flex-1">
                    <button type="button" onClick={closeCreateModal} className="stepper__nav" disabled={saving}>
                      Annuler
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
                    <button type="submit" className="stepper__nav" disabled={saving}>
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <FaSpinner className="animate-spin" />
                          Création...
                        </span>
                      ) : (
                        "Terminer"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (!isCompany) {
    return <div className="rounded-lg bg-white p-5 shadow">This page is available only for company accounts.</div>;
  }

  if (!isOwner) {
    return <div className="rounded-lg bg-white p-5 shadow">Only the account owner can manage users.</div>;
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-16 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold uppercase">USERS</h1>
          <p className="text-sm text-slate-600">{subscription?.accountName ?? "Company account"}</p>
        </div>

        <button className="btn-fit-white-outline" type="button" onClick={() => setCreateOpen(true)}>
          Ajouter User
        </button>
      </div>

      <div className="flex justify-between items-end gap-6 h-17.5">
        <div className="flex items-center gap-2">
          <label className="font-medium" htmlFor="users-search">
            Recherche:
          </label>
          <input
            id="users-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom / email / téléphone"
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          />
        </div>
      </div>

      {err && !createOpen ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-(--primary) text-white">
            <tr>
              <th className="py-2 text-sm font-medium text-center">Name</th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">Email</th>
              <th className="py-2 text-sm font-medium text-center">Phone</th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">Role</th>
              <th className="w-1/6 py-2 text-sm font-medium text-center">Actions</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {filteredUsers.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {filteredUsers.map((item, index) => (
                  <tr key={item.id} className={index % 2 ? "bg-gray-100" : "bg-white"}>
                    <td className="py-2 text-center font-semibold truncate">{item.name || "-"}</td>
                    <td className="py-2 text-center truncate">{item.email}</td>
                    <td className="py-2 text-center truncate">{item.phone || "-"}</td>
                    <td className="py-2 text-center truncate">{item.role}</td>
                    <td className="py-2 w-1/6">
                      <div className="flex justify-center items-center gap-2">
                        {item.role === "MEMBER" && item.id !== user?.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          ) : null}
        </div>
      </div>

      {createUserModal}
    </div>
  );
}
