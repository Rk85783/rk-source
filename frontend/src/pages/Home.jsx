import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHealth } from "../lib/api";
import { useAuth } from "../context/useAuth";

export const Home = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    getHealth()
      .then((res) => {
        if (active) setHealth({ loading: false, data: res.data, error: null });
      })
      .catch((err) => {
        if (active)
          setHealth({ loading: false, data: null, error: err.message });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rk-source</h1>
            <p className="mt-2 text-slate-600">
              Express API and React frontend.
            </p>
          </div>

          {user ? (
            <Link
              to="/dashboard"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {health.loading && <p className="text-slate-500">Checking API...</p>}

          {health.error && (
            <p role="alert" className="text-red-600">
              API unreachable: {health.error}
            </p>
          )}

          {health.data && (
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-500">API status</dt>
                <dd className="font-medium text-green-600">
                  {health.data.status}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Environment</dt>
                <dd className="font-medium">{health.data.env}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Database</dt>
                <dd className="font-medium text-green-600">
                  {health.data.database.state}
                </dd>
              </div>
            </dl>
          )}
        </section>
      </div>
    </main>
  );
};
