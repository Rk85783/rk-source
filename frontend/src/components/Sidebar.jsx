import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { canAccess } from "../lib/access";
import { initials, roleLabel } from "../lib/roles";

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

const SidebarLink = ({ to, section, children }) => {
  const { user } = useAuth();
  if (!canAccess(user, section)) return null;
  return (
    <NavLink to={to} className={linkClass} end={to === "/dashboard"}>
      {children}
    </NavLink>
  );
};

const Avatar = ({ user }) => {
  const photo = user?.profileImage;
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white">
      {photo ? (
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initials(user?.name)
      )}
    </span>
  );
};

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user?.name}
          </p>
          <p className="truncate text-xs text-slate-500">
            {roleLabel(user?.role)}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <SidebarLink to="/dashboard" section="overview">
          Overview
        </SidebarLink>
        <SidebarLink to="/dashboard/users" section="users">
          User management
        </SidebarLink>
        <SidebarLink to="/dashboard/admins" section="admins">
          Admin management
        </SidebarLink>
        <SidebarLink to="/dashboard/shippers" section="shippers">
          Shipper management
        </SidebarLink>
        <SidebarLink to="/dashboard/carriers" section="carriers">
          Carrier management
        </SidebarLink>
        <SidebarLink to="/dashboard/drivers" section="drivers">
          Driver management
        </SidebarLink>
        <SidebarLink to="/dashboard/network" section="network">
          Network
        </SidebarLink>
        <SidebarLink to="/dashboard/settings" section="settings">
          Settings
        </SidebarLink>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};
