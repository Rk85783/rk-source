export const ROLES = ["carrier", "shipper", "driver", "admin", "super_admin"];

// The only roles a visitor may choose for themselves at signup. driver is
// deliberately absent: it is added by a carrier, not self-claimed.
export const PUBLIC_ROLES = ["carrier", "shipper"];

export const ADMIN_ROLES = ["admin", "super_admin"];

export const ROLE_LEVELS = {
  carrier: 10,
  shipper: 10,
  driver: 10,
  admin: 20,
  super_admin: 30,
};

export const isAdminRole = (role) => ADMIN_ROLES.includes(role);

export const atLeast = (role, minimum) =>
  (ROLE_LEVELS[role] || 0) >= (ROLE_LEVELS[minimum] || 0);
