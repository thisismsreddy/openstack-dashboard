import { Router } from "express";
import { listServers, deleteServer, actionServer, createServer, listFlavors, listNetworks } from "../controllers/servers";

const router = Router();
// List servers and boot a new server
router.get("/:projectId", listServers);
router.post("/:projectId", createServer);
// Server actions (reboot, shutdown, start)
router.post("/:projectId/:serverId/action", actionServer);
// Delete server
router.delete("/:projectId/:serverId", deleteServer);
// List flavors and networks
router.get("/:projectId/flavors", listFlavors);
router.get("/:projectId/networks", listNetworks);
export default router;