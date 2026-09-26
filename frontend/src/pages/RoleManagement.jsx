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
import { firstError, getRoleDetail, listRole } from "../lib/api";
import { roleLabel } from "../lib/roles";

/**
 * One component serves shipper, carrier and driver management. The three
 * endpoints return the same shape, so anything role-specific belongs in the
 * page that mounts this rather than in here.
 */
export const RoleManagement = ({ role }) => {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const fetcher = useCallback(
    (page) =>
      listRole(role, { page, limit: 20, search }).then((res) => ({
        rows: res.data[`${role}s`] ?? [],
        page: res.data.page,
        pages: res.data.pages,
        total: res.data.total,
      })),
    [role, search],
  );

  const { rows, meta, loading, error, refresh } = usePagedList(fetcher);

  const open = async (userId) => {
    setDetailError(null);
    try {
      const res = await getRoleDetail(role, userId);
      setDetail(res.data[`${role}s`]);
    } catch (err) {
      setDetail(null);
      setDetailError(firstError(err));
    }
  };

  return (
    <>
      <PageHeader
        title={`${roleLabel(role)} management`}
        description={`Browse ${roleLabel(role).toLowerCase()} accounts and their profiles.`}
        actions={
          <form
            onSubmit={(e) => {
              e.preventDefault();
              refresh(1);
            }}
            className="flex gap-2"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Search
            </button>
          </form>
        }
      />

      <Alert>{error}</Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <EmptyState>No {role}s found.</EmptyState>
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
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{row.email}</td>
                      <td className="py-2 pr-4">
                        <Badge>{roleLabel(row.role)}</Badge>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => open(row.id)}
                          className="text-sm font-medium text-slate-700 underline"
                        >
                          Details
                        </button>
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

        <Card title="Details">
          <Alert>{detailError}</Alert>

          {!detail && !detailError && (
            <p className="text-sm text-slate-500">
              Select a {role} to see its profile.
            </p>
          )}

          {detail && (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Name</dt>
                <dd className="truncate font-medium text-slate-900">
                  {detail.name}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="truncate font-medium text-slate-900">
                  {detail.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-900">
                  {roleLabel(detail.role)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Joined</dt>
                <dd className="text-slate-700">
                  {new Date(detail.createdAt).toLocaleDateString()}
                </dd>
              </div>

              <div className="pt-2">
                <dt className="mb-1 text-slate-500">Profile</dt>
                {detail.profile ? (
                  <dd className="space-y-1 text-slate-700">
                    <p>
                      {detail.profile.firstName} {detail.profile.lastName}
                    </p>
                    {detail.profile.profileImage ? (
                      <img
                        src={detail.profile.profileImage}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <p className="text-xs text-slate-400">No profile image</p>
                    )}
                  </dd>
                ) : (
                  <dd className="text-slate-400">No profile yet</dd>
                )}
              </div>

              {detail.permissions?.length > 0 && (
                <div className="pt-2">
                  <dt className="mb-1 text-slate-500">Permissions</dt>
                  <dd className="flex flex-wrap gap-1">
                    {detail.permissions.map((p) => (
                      <Badge key={p} tone="blue">
                        {p}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </Card>
      </div>
    </>
  );
};
