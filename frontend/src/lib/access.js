import { PERMISSIONS } from "./roles";

/**
 * Which sidebar sections a viewer may open. A super admin passes every check,
 * because the backend grants it every permission implicitly — so nothing here
 * needs to special-case a stored list for that role.
 *
 * An admin is shown a role section only if it holds at least one of that
 * role's permissions. A carrier, shipper, or driver is shown none of them,
 * because the endpoints behind them are admin-only.
 */
export const canAccess = (user, section) => {
  if (!user) return false;

  // Creating admins and granting permissions are super admin only, so a regular
  // admin has nothing it can do on that page.
  if (section === "admins") {
    return user.role === "super_admin";
  }

  if (section === "users") {
    return user.role === "super_admin" || user.role === "admin";
  }

  // The network is a two-sided feature between shippers and carriers, so those
  // two roles get it and the rest of the platform does not.
  if (section === "network") {
    return user.role === "shipper" || user.role === "carrier";
  }

  const singular = section.replace(/s$/, "");
  const required = PERMISSIONS[singular];

  if (!required) return true;

  return (
    user.role === "super_admin" ||
    (user.role === "admin" &&
      required.some((p) => (user.permissions ?? []).includes(p)))
  );
};
