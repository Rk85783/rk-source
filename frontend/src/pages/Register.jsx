import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FormAlert,
  FormField,
  SelectField,
  SubmitButton,
} from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { firstError } from "../lib/api";
import { registerSchema, toFieldErrors } from "../lib/schemas";

const empty = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "carrier",
};

// Only the roles the API accepts at signup. The server enforces this too, but
// the form should not offer a choice that is guaranteed to fail.
const roleOptions = [
  { value: "carrier", label: "Carrier" },
  { value: "shipper", label: "Shipper" },
];

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

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

    const result = registerSchema.safeParse(form);

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
      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

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
            Create account
          </h2>

          <FormAlert>{summary}</FormAlert>

          <FormField
            label="Full name"
            name="name"
            value={form.name}
            onChange={onChange}
            error={errors.name}
            placeholder="Asha Verma"
            autoComplete="name"
          />

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

          <SelectField
            label="I am a"
            name="role"
            value={form.role}
            onChange={onChange}
            error={errors.role}
            options={roleOptions}
          />

          <FormField
            label="Password"
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
            placeholder="Repeat your password"
            autoComplete="new-password"
          />

          <SubmitButton pending={pending}>Create account</SubmitButton>

          <p className="text-center text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-slate-900 underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
};
