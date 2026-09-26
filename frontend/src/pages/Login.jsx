import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FormAlert, FormField, SubmitButton } from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { firstError } from "../lib/api";
import { loginSchema, toFieldErrors } from "../lib/schemas";

const empty = { email: "", password: "" };

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [pending, setPending] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSummary(null);

    const result = loginSchema.safeParse(form);

    if (!result.success) {
      const { fields } = toFieldErrors(result);
      setErrors(fields);
      setSummary("Check the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      await login(result.data);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
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
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>

          <FormAlert>{summary}</FormAlert>

          <FormField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            error={errors.email}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            error={errors.password}
            placeholder="Your password"
            autoComplete="current-password"
          />

          <SubmitButton pending={pending}>Sign in</SubmitButton>

          <p className="text-center text-sm text-slate-600">
            No account?{" "}
            <Link
              to="/register"
              className="font-medium text-slate-900 underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};
