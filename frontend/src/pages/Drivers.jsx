import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from "../components/ui";
import { FormField, SubmitButton } from "../components/FormField";
import {
  firstError,
  getInvitation,
  inviteDriver,
  listInvitations,
  revokeInvitation,
} from "../lib/api";
import { inviteDriverSchema, toFieldErrors } from "../lib/schemas";

const empty = { name: "", email: "", password: "" };

const TONE = {
  pending: "amber",
  activated: "green",
  revoked: "slate",
  expired: "slate",
};

const LABEL = {
  pending: "Invited",
  activated: "Registered",
  revoked: "Withdrawn",
  expired: "Expired",
};

const InviteForm = ({ onDone }) => {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSummary(null);
    setNotice(null);

    const result = inviteDriverSchema.safeParse(form);
    if (!result.success) {
      const { fields } = toFieldErrors(result);
      setErrors(fields);
      setSummary("Check the highlighted fields.");
      return;
    }

    setPending(true);
    try {
      const res = await inviteDriver(result.data);
      setNotice(
        res.data.email.delivered
          ? `Invitation emailed to ${res.data.invitation.email}.`
          : `SMTP is not set up, so the email was written to ${res.data.email.writtenTo}.`,
      );
      setForm(empty);
      onDone();
    } catch (err) {
      setSummary(firstError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card title="Invite a driver">
      <form onSubmit={onSubmit} className="space-y-3">
        <Alert>{summary}</Alert>
        <Alert tone={notice?.includes("written to") ? "info" : "success"}>
          {notice}
        </Alert>

        <FormField
          label="Driver name"
          name="name"
          value={form.name}
          onChange={onChange}
          error={errors.name}
          placeholder="Dee Driver"
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
          placeholder="dee@example.com"
        />
        <FormField
          label="Temporary password"
          name="password"
          type="text"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          placeholder="At least 8 characters"
        />

        <p className="text-xs text-slate-500">
          The driver receives this email and can sign in with it, or follow the
          link in it to choose their own password.
        </p>

        <SubmitButton pending={pending}>Send invitation</SubmitButton>
      </form>
    </Card>
  );
};

const Table = ({ title, items, onOpen, onRevoke, busyId }) =>
  items.length > 0 && (
    <Card title={`${title} (${items.length})`} className="mb-4">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-500 uppercase">
          <tr className="border-b border-slate-200">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Email</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-900">
                {r.driver?.name ?? "Unknown"}
              </td>
              <td className="py-2 pr-4 text-slate-600">{r.email}</td>
              <td className="py-2 pr-4">
                <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
              </td>
              <td className="py-2 text-right">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onOpen(r.id)}
                    className="text-sm font-medium text-slate-700 underline"
                  >
                    Details
                  </button>
                  {r.status === "pending" && (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => onRevoke(r.id)}
                      className="text-sm font-medium text-red-600 underline disabled:opacity-50"
                    >
                      {busyId === r.id ? "..." : "Withdraw"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

export const Drivers = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await listInvitations("all");
      setRows(res.data.invitations);
      setError(null);
    } catch (err) {
      setError(firstError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listInvitations("all")
      .then((res) => active && setRows(res.data.invitations))
      .catch((err) => active && setError(firstError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const open = async (id) => {
    setError(null);
    try {
      const res = await getInvitation(id);
      setDetail(res.data);
    } catch (err) {
      setDetail(null);
      setError(firstError(err));
    }
  };

  const revoke = async (id) => {
    setBusy(id);
    setError(null);
    try {
      await revokeInvitation(id);
      setDetail(null);
      await load();
    } catch (err) {
      setError(firstError(err));
    } finally {
      setBusy(null);
    }
  };

  const invited = rows.filter((r) => r.status === "pending");
  const registered = rows.filter((r) => r.status === "activated");
  const other = rows.filter(
    (r) => r.status !== "pending" && r.status !== "activated",
  );

  return (
    <>
      <PageHeader
        title="My drivers"
        description="Invite drivers and keep track of who has joined."
      />

      <Alert>{error}</Alert>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-0 lg:col-span-2">
            {rows.length === 0 ? (
              <Card>
                <EmptyState>
                  No drivers yet. Use the form to send the first invitation.
                </EmptyState>
              </Card>
            ) : (
              <>
                <Table
                  title="Invited"
                  items={invited}
                  onOpen={open}
                  onRevoke={revoke}
                  busyId={busy}
                />
                <Table
                  title="Registered"
                  items={registered}
                  onOpen={open}
                  onRevoke={revoke}
                  busyId={busy}
                />
                <Table
                  title="Withdrawn and expired"
                  items={other}
                  onOpen={open}
                  onRevoke={revoke}
                  busyId={busy}
                />
              </>
            )}

            {detail && (
              <Card title="Driver details">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium text-slate-900">
                      {detail.user?.name}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">
                      {detail.invitation.email}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Status</dt>
                    <dd>
                      <Badge tone={TONE[detail.invitation.status]}>
                        {LABEL[detail.invitation.status]}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Account active</dt>
                    <dd className="text-slate-700">
                      {detail.user?.isActive ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Invited</dt>
                    <dd className="text-slate-700">
                      {new Date(detail.invitation.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  {detail.invitation.activatedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Joined</dt>
                      <dd className="text-slate-700">
                        {new Date(
                          detail.invitation.activatedAt,
                        ).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Profile</dt>
                    <dd className="text-slate-700">
                      {detail.profile
                        ? `${detail.profile.firstName} ${detail.profile.lastName}`
                        : "Not created yet"}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </Card>
            )}
          </div>

          <InviteForm onDone={load} />
        </div>
      )}
    </>
  );
};
