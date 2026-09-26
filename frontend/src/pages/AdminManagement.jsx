import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from "../components/ui";
import {
  createAdmin,
  firstError,
  getUserPermissions,
  listPermissions,
  listUsers,
  setUserPermissions,
} from "../lib/api";
import { usePagedList } from "../hooks/usePagedList";
import { roleLabel } from "../lib/roles";

const emptyForm = { name: "", email: "", password: "" };

export const AdminManagement = () => {
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState(null);

  const [selected, setSelected] = useState(null);
  const [groups, setGroups] = useState({});
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetcher = useCallback(
    () =>
      listUsers({ limit: 100 }).then((res) => ({
        rows: res.data.users.filter(
          (u) => u.role === "admin" || u.role === "super_admin",
        ),
        page: 1,
        pages: 1,
        total: res.data.total,
      })),
    [],
  );

  const {
    rows: admins,
    loading,
    error,
    refresh,
    setError,
  } = usePagedList(fetcher);

  // The permission catalogue is identical for every admin, so it is fetched once
  // rather than per row.
  useEffect(() => {
    let active = true;
    listPermissions()
      .then((res) => active && setGroups(res.data.permissions))
      .catch(() => active && setGroups({}));
    return () => {
      active = false;
    };
  }, []);

  // The permission catalogue is the same for every admin, so it is fetched
  // once when the panel opens rather than per row.
  useEffect(() => {
    if (!groups.carrier) {
      import("../lib/api")
        .then((m) => m.listPermissions())
        .then((res) => setGroups(res.data.permissions))
        .catch(() => setGroups({}));
    }
  }, [groups.carrier]);

  const openPermissions = async (admin) => {
    setNotice(null);
    setError(null);
    setSelected(admin);
    setDraft(admin.permissions ?? []);
    try {
      const res = await getUserPermissions(admin.id);
      setSelected(res.data.user);
      setDraft(res.data.permissions ?? []);
    } catch (err) {
      setError(firstError(err));
    }
  };

  const toggle = (permission) =>
    setDraft((d) =>
      d.includes(permission)
        ? d.filter((p) => p !== permission)
        : [...d, permission],
    );

  const savePermissions = async () => {
    setSaving(true);
    setError(null);
    try {
      await setUserPermissions(selected.id, draft);
      setNotice(`Permissions updated for ${selected.email}.`);
      setSelected(null);
      refresh();
    } catch (err) {
      setError(firstError(err));
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    setCreating(true);
    try {
      const res = await createAdmin(form);
      setNotice(`Admin created: ${res.data.user.email}`);
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setFormError(firstError(err));
    } finally {
      setCreating(false);
    }
  };

  const all = Object.values(groups).flat();

  return (
    <>
      <PageHeader
        title="Admin management"
        description="Create admin accounts and decide what each one can see."
      />

      <Alert>{error}</Alert>
      <div className="mt-3">
        <Alert tone="success">{notice}</Alert>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Accounts" className="lg:col-span-2">
          {loading ? (
            <Spinner />
          ) : admins.length === 0 ? (
            <EmptyState>No admin accounts yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500 uppercase">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {a.name}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{a.email}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          tone={a.role === "super_admin" ? "amber" : "slate"}
                        >
                          {roleLabel(a.role)}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        {a.role === "super_admin" ? (
                          <span className="text-xs text-slate-400">
                            implicit access
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPermissions(a)}
                            className="text-sm font-medium text-slate-700 underline"
                          >
                            Permissions
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Create an admin">
          <form onSubmit={submit} className="space-y-3">
            <Alert>{formError}</Alert>

            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              placeholder="Temporary password (8+ characters)"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
              required
            />

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create admin"}
            </button>
          </form>
        </Card>
      </div>

      {selected && (
        <Card title={`Permissions for ${selected.email}`} className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(groups).map(([group, perms]) => (
              <fieldset key={group}>
                <legend className="mb-2 text-sm font-semibold text-slate-900 capitalize">
                  {group}
                </legend>
                <div className="space-y-1">
                  {perms.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={draft.includes(p)}
                        onChange={() => toggle(p)}
                        className="rounded border-slate-300"
                      />
                      <code className="text-xs">{p}</code>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setDraft(all)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setDraft([])}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={savePermissions}
              disabled={saving}
              className="ml-auto rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save permissions"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}
    </>
  );
};
