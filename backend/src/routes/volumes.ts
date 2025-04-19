import { Router } from "express";
import {
  listVolumes,
  createVolume,
  deleteVolume,
  attachVolume,
  detachVolume,
} from "../controllers/volumes";

const router = Router();
router.get("/:projectId", listVolumes);
router.post("/:projectId", createVolume);
router.delete("/:projectId/:volumeId", deleteVolume);
router.post("/:projectId/:serverId/attach", attachVolume);
router.delete("/:projectId/:serverId/attach/:attachmentId", detachVolume);
export default router;