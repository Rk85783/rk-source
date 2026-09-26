export const ROLES = ["carrier", "shipper", "driver", "admin", "super_admin"];

export const PUBLIC_ROLES = ["carrier", "shipper", "driver"];

export const ADMIN_ROLES = ["admin", "super_admin"];

export const ROLE_LEVELS = {
  carrier: 10,
  shipper: 10,
  driver: 10,
  admin: 20,
  super_admin: 30,
};

export const isValidRole = (role) => ROLES.includes(role);

export const isAdminRole = (role) => ADMIN_ROLES.includes(role);

export const atLeast = (role, minimum) =>
  (ROLE_LEVELS[role] || 0) >= (ROLE_LEVELS[minimum] || 0);
