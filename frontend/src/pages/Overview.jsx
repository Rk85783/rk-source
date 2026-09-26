import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { getHealth } from "../lib/api";
import { roleLabel } from "../lib/roles";

export const Overview = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    getHealth()
      .then((res) => active && setHealth(res.data))
      .catch(() => active && setHealth(null));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Signed in to the Rk-source control panel."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Your account">
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

        <Card title="API">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium text-green-600">
                {health?.status ?? "unreachable"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Environment</dt>
              <dd className="font-medium text-slate-900">
                {health?.env ?? "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Database</dt>
              <dd className="font-medium text-slate-900">
                {health?.database?.state ?? "-"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Your access">
          {user?.permissions?.length ? (
            <ul className="space-y-1">
              {user.permissions.map((p) => (
                <li
                  key={p}
                  className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700"
                >
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              {user?.role === "super_admin"
                ? "Full access to every section. Permissions are implicit and not stored."
                : "No permissions granted yet. A super admin has to grant access."}
            </p>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Link
          to="/dashboard/settings"
          className="text-sm font-medium text-slate-700 underline"
        >
          Change your password
        </Link>
      </div>
    </>
  );
};
