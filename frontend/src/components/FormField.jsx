const base =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2";

const tone = (invalid) =>
  invalid
    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
    : "border-slate-300 focus:border-slate-500 focus:ring-slate-100";

export const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
    </span>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      className={`${base} ${tone(error)}`}
    />
    {error && (
      <span
        id={`${name}-error`}
        role="alert"
        className="mt-1 block text-xs text-red-600"
      >
        {error}
      </span>
    )}
  </label>
);

export const SelectField = ({
  label,
  name,
  value,
  onChange,
  error,
  options,
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}
    </span>
    <select
      name={name}
      value={value}
      onChange={onChange}
      aria-invalid={Boolean(error)}
      className={`${base} ${tone(error)}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {error}
      </span>
    )}
  </label>
);

export const SubmitButton = ({ pending, children }) => (
  <button
    type="submit"
    disabled={pending}
    className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {pending ? "Please wait..." : children}
  </button>
);

export const FormAlert = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {children}
    </p>
  ) : null;
