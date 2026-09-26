export const PERMISSIONS = {
  carrier: ["carrier:list", "carrier:read"],
  shipper: ["shipper:list", "shipper:read"],
  driver: ["driver:list", "driver:read"],
};

export const ROLE_LABELS = {
  carrier: "Carrier",
  shipper: "Shipper",
  driver: "Driver",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const roleLabel = (role) =>
  ROLE_LABELS[role] ?? String(role ?? "").replace(/_/g, " ");

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
