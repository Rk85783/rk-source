import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
} from "../components/ui";
import { useAuth } from "../context/useAuth";
import {
  cancelConnection,
  firstError,
  listConnections,
  respondConnection,
  searchDirectory,
  sendConnection,
} from "../lib/api";
import { roleLabel } from "../lib/roles";

const VIEWS = [
  { key: "received", label: "Requests received" },
  { key: "sent", label: "Invitations sent" },
  { key: "connected", label: "Connected" },
];

const Counters = ({ counters }) =>
  counters ? (
    <div className="flex flex-wrap gap-2">
      {VIEWS.map((v) => (
        <span
          key={v.key}
          className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
        >
          {v.label}: {counters[v.key]}
        </span>
      ))}
    </div>
  ) : null;

const Invite = ({ onDone }) => {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  // Only sets state after the await, so the mount effect below stays clean.
  // Turning the spinner on belongs to the interaction that triggered a search.
  const search = async (term) => {
    try {
      const res = await searchDirectory(term);
      setRows(res.data.users);
      setError(null);
    } catch (err) {
      setError(firstError(err));
    } finally {
      setLoading(false);
    }
  };

  const runSearch = (term) => {
    setLoading(true);
    setError(null);
    search(term);
  };

  // The directory is the only way to find someone to invite, so it loads on
  // mount rather than waiting for a search.
  // Inlined rather than calling search(), because a named function that sets
  // state trips react-hooks/set-state-in-effect even when the sets are after
  // the await. A promise chain inside the effect is the accepted shape.
  useEffect(() => {
    let active = true;
    searchDirectory("")
      .then((res) => {
        if (active) setRows(res.data.users);
      })
      .catch((err) => {
        if (active) setError(firstError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const invite = async (id) => {
    setBusy(id);
    setError(null);
    try {
      await sendConnection(id);
      setLoading(true);
      await search(query);
      onDone();
    } catch (err) {
      setError(firstError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Invite someone">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mb-3 flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Search
        </button>
      </form>

      <Alert>{error}</Alert>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState>Nobody to invite yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((u) => (
            <li key={u.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {u.name}
                </p>
                <p className="text-xs text-slate-500">{roleLabel(u.role)}</p>
              </div>

              {u.status === "accepted" && <Badge tone="green">Connected</Badge>}

              {u.status === "pending" && (
                <Badge tone="amber">
                  {u.direction === "sent"
                    ? "Invitation sent"
                    : "Wants to connect"}
                </Badge>
              )}

              {u.status === "rejected" && <Badge>Declined</Badge>}

              {u.status === "cancelled" && <Badge>Cancelled</Badge>}

              {!u.status && (
                <button
                  type="button"
                  onClick={() => invite(u.id)}
                  disabled={busy === u.id}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {busy === u.id ? "Sending..." : "Invite"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export const Network = () => {
  const { user } = useAuth();
  const [view, setView] = useState("received");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async (target) => {
    setLoading(true);
    setError(null);
    try {
      const res = await listConnections(target);
      setData(res.data);
    } catch (err) {
      setError(firstError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // The spinner is turned on by the tab click, not by this effect, so the
  // effect body only attaches handlers to a promise.
  useEffect(() => {
    let active = true;
    listConnections(view)
      .then((res) => active && setData(res.data))
      .catch((err) => active && setError(firstError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [view]);

  const act = async (id, fn) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
      await load(view);
    } catch (err) {
      setError(firstError(err));
    } finally {
      setBusy(null);
    }
  };

  const rows = data?.connections ?? [];
  const myRole = user?.role === "shipper" ? "shipper" : "carrier";

  return (
    <>
      <PageHeader
        title="Network"
        description={`Connect with ${myRole === "shipper" ? "carriers" : "shippers"} and manage your requests.`}
        actions={<Counters counters={data?.counters} />}
      />

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => {
              setLoading(true);
              setView(v.key);
            }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              view === v.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {v.label}
            {data?.counters?.[v.key] > 0 && (
              <span className="ml-1.5 rounded-full bg-slate-900 px-1.5 text-xs text-white">
                {data.counters[v.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Alert>{error}</Alert>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <EmptyState>
              {view === "received"
                ? "No requests waiting on you."
                : view === "sent"
                  ? "You have not sent any invitations."
                  : "Not connected to anyone yet."}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {c.counterpart?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.counterpart
                        ? roleLabel(c.counterpart.role)
                        : "details unavailable"}{" "}
                      &middot; {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {c.status === "pending" && c.direction === "received" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === c.id}
                        onClick={() =>
                          act(c.id, () => respondConnection(c.id, "accept"))
                        }
                        className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {busy === c.id ? "..." : "Accept"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === c.id}
                        onClick={() =>
                          act(c.id, () => respondConnection(c.id, "reject"))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {c.status === "pending" && c.direction === "sent" && (
                    <button
                      type="button"
                      disabled={busy === c.id}
                      onClick={() => act(c.id, () => cancelConnection(c.id))}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {busy === c.id ? "..." : "Cancel"}
                    </button>
                  )}

                  {c.status === "accepted" && (
                    <Badge tone="green">Connected</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Invite onDone={() => load(view)} />
      </div>
    </>
  );
};
