import { useState } from "react";
import { Alert, Card, PageHeader } from "../components/ui";
import { FormField, SubmitButton } from "../components/FormField";
import { useAuth } from "../context/useAuth";
import { changePassword, firstError } from "../lib/api";
import { changePasswordSchema, toFieldErrors } from "../lib/schemas";
import { roleLabel } from "../lib/roles";

const empty = { currentPassword: "", newPassword: "" };

export const Settings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
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
      await changePassword(result.data);
      setNotice("Password updated.");
      setForm(empty);
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your account details and password."
      />

      <div className="grid max-w-3xl gap-4">
        <Card title="Account">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Name</dt>
              <dd className="truncate font-medium text-slate-900">
                {user?.name}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="truncate font-medium text-slate-900">
                {user?.email}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-900">
                {roleLabel(user?.role)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Change password">
          <form onSubmit={onSubmit} className="max-w-sm space-y-3">
            <Alert>{summary}</Alert>
            <Alert tone="success">{notice}</Alert>

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
        </Card>
      </div>
    </>
  );
};
