import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormAlert, FormField, SubmitButton } from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { api, firstError } from "../lib/api";
import { changePasswordSchema, toFieldErrors } from "../lib/schemas";

const empty = { currentPassword: "", newPassword: "" };

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setSummary(null);
    setNotice(null);

    const result = changePasswordSchema.safeParse(form);

    if (!result.success) {
      const { fields } = toFieldErrors(result);
      setErrors(fields);
      setSummary("Check the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      await api.patch("/api/auth/me/password", result.data);
      setNotice("Password updated.");
      setForm(empty);
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Rk-source
            </h1>
            <p className="text-sm text-slate-600">Signed in as {user.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your account</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-900 capitalize">
                {user.role.replace("_", " ")}
              </dd>
            </div>
            {user.permissions && user.permissions.length > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Permissions</dt>
                <dd className="flex flex-wrap justify-end gap-1">
                  {user.permissions.map((p) => (
                    <span
                      key={p}
                      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700"
                    >
                      {p}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <form
          onSubmit={changePassword}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Change password
          </h2>

          <FormAlert>{summary}</FormAlert>

          {notice && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
          )}

          <FormField
            label="Current password"
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={onChange}
            error={errors.currentPassword}
            autoComplete="current-password"
          />

          <FormField
            label="New password"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={onChange}
            error={errors.newPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <SubmitButton pending={pending}>Update password</SubmitButton>
        </form>
      </div>
    </main>
  );
};
