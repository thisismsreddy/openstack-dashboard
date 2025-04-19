import { Router } from "express";
import { listProjects, createProject } from "../controllers/projects";

const router = Router();
router.get("/", listProjects);
router.post("/", createProject);
export default router;