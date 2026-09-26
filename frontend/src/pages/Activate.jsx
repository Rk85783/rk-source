import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "../components/ui";
import { FormField, SubmitButton } from "../components/FormField";
import { activateDriver, firstError } from "../lib/api";
import { activateDriverSchema, toFieldErrors } from "../lib/schemas";

const empty = { token: "", password: "", confirmPassword: "" };

export const Activate = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...empty,
    token: params.get("token") ?? "",
  });
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [done, setDone] = useState(null);
  const [pending, setPending] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSummary(null);

    const result = activateDriverSchema.safeParse(form);
    if (!result.success) {
      const { fields } = toFieldErrors(result);
      setErrors(fields);
      setSummary("Check the highlighted fields.");
      return;
    }

    const { confirmPassword, ...payload } = result.data;
    void confirmPassword;

    setPending(true);
    try {
      const res = await activateDriver(payload);
      setDone(res.data.user);
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rk-source
          </h1>
          <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Your password is set, {done.name}. You can sign in now.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Go to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rk-source
          </h1>
        </Link>

        <form
          onSubmit={onSubmit}
          noValidate
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Set your password
          </h2>
          <p className="text-sm text-slate-600">
            Choose a password of your own instead of the one from the
            invitation.
          </p>

          <Alert>{summary}</Alert>

          <FormField
            label="Invitation token"
            name="token"
            value={form.token}
            onChange={onChange}
            error={errors.token}
          />

          <FormField
            label="New password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={onChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <SubmitButton pending={pending}>Set password</SubmitButton>

          <p className="text-center text-sm text-slate-600">
            Already set it?{" "}
            <Link to="/login" className="font-medium text-slate-900 underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};
