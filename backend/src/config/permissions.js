export const PERMISSIONS = {
  CARRIER_LIST: "carrier:list",
  CARRIER_READ: "carrier:read",
  SHIPPER_LIST: "shipper:list",
  SHIPPER_READ: "shipper:read",
  DRIVER_LIST: "driver:list",
  DRIVER_READ: "driver:read",
};

export const PERMISSION_GROUPS = {
  carrier: [PERMISSIONS.CARRIER_LIST, PERMISSIONS.CARRIER_READ],
  shipper: [PERMISSIONS.SHIPPER_LIST, PERMISSIONS.SHIPPER_READ],
  driver: [PERMISSIONS.DRIVER_LIST, PERMISSIONS.DRIVER_READ],
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const isValidPermission = (permission) =>
  ALL_PERMISSIONS.includes(permission);
