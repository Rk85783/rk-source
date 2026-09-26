import { useCallback, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  Spinner,
} from "../components/ui";
import { usePagedList } from "../hooks/usePagedList";
import { listUsers } from "../lib/api";
import { roleLabel } from "../lib/roles";

const filters = ["", "carrier", "shipper", "driver", "admin", "super_admin"];

export const UserManagement = () => {
  const [role, setRole] = useState("");

  const fetcher = useCallback(
    (page) =>
      listUsers({ role: role || undefined, page, limit: 20 }).then((res) => ({
        rows: res.data.users,
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total,
      })),
    [role],
  );

  const { rows, meta, loading, error, refresh } = usePagedList(fetcher);

  return (
    <>
      <PageHeader
        title="User management"
        description="Every account on the platform."
        actions={
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
          >
            {filters.map((f) => (
              <option key={f || "all"} value={f}>
                {f ? roleLabel(f) : "All roles"}
              </option>
            ))}
          </select>
        }
      />

      <Alert>{error}</Alert>

      <Card className="mt-4">
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState>No users found.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-500 uppercase">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Permissions</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{u.email}</td>
                    <td className="py-2 pr-4">
                      <Badge
                        tone={u.role === "super_admin" ? "amber" : "slate"}
                      >
                        {roleLabel(u.role)}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">
                      {u.role === "super_admin"
                        ? "All (implicit)"
                        : u.permissions?.length
                          ? u.permissions.join(", ")
                          : "-"}
                    </td>
                    <td className="py-2 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={meta.page}
          pages={meta.pages}
          total={meta.total}
          onPage={refresh}
        />
      </Card>
    </>
  );
};
