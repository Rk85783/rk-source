import { useEffect, useState } from "react";
import { firstError } from "../lib/api";

/**
 * Paginated list state shared by the user, admin, and role management pages.
 *
 * The effect body only attaches handlers to a promise and never calls setState
 * directly, which is what react-hooks/set-state-in-effect requires. The spinner
 * is turned on by refresh(), because that is an interaction, not a render.
 *
 * `fetcher` must be memoised by the caller with useCallback, and must resolve to
 * { rows, page, pages, total }.
 */
export const usePagedList = (fetcher) => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    fetcher(1)
      .then((data) => {
        if (!active) return;
        setRows(data.rows);
        setMeta({ page: data.page, pages: data.pages, total: data.total });
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(firstError(err));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetcher]);

  const refresh = (page = 1) => {
    setLoading(true);
    setError(null);
    fetcher(page)
      .then((data) => {
        setRows(data.rows);
        setMeta({ page: data.page, pages: data.pages, total: data.total });
        setLoading(false);
      })
      .catch((err) => {
        setError(firstError(err));
        setLoading(false);
      });
  };

  return { rows, meta, loading, error, refresh, setError };
};
