import { Router } from "express";
import { root } from "../controllers/health.controller.js";
import adminsRoutes from "./admins.routes.js";
import authRoutes from "./auth.routes.js";
import carriersRoutes from "./carriers.routes.js";
import connectionsRoutes from "./connections.routes.js";
import driverInvitationsRoutes from "./driver-invitations.routes.js";
import driversRoutes from "./drivers.routes.js";
import healthRoutes from "./health.routes.js";
import shippersRoutes from "./shippers.routes.js";

const router = Router();

router.get("/", root);
router.use("/api", healthRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/connections", connectionsRoutes);
// Mounted before /api/carriers, because that router has a /:userId route which
// would otherwise swallow /api/carriers/invitations.
router.use("/api/carriers/invitations", driverInvitationsRoutes);
router.use("/api/shippers", shippersRoutes);
router.use("/api/carriers", carriersRoutes);
router.use("/api/drivers", driversRoutes);
router.use("/api/admins", adminsRoutes);

export default router;
