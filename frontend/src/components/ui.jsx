export const PageHeader = ({ title, description, actions }) => (
  <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </div>
    {actions}
  </header>
);

export const Card = ({ title, children, className = "" }) => (
  <section
    className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    {title && (
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
    )}
    {children}
  </section>
);

export const Badge = ({ children, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export const Spinner = ({ label = "Loading" }) => (
  <p className="py-8 text-center text-sm text-slate-500">{label}...</p>
);

export const EmptyState = ({ children }) => (
  <p className="py-8 text-center text-sm text-slate-500">{children}</p>
);

export const Alert = ({ tone = "error", children }) => {
  if (!children) return null;
  const tones = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <p
      role="alert"
      className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
};

export const Pagination = ({ page, pages, total, onPage }) => {
  if (!pages || pages < 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-slate-500">
        Page {page} of {pages} ({total} total)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-3 py-1 font-medium text-slate-700 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="rounded-lg border border-slate-300 px-3 py-1 font-medium text-slate-700 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};
