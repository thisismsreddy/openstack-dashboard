import { Request, Response } from "express";
import prisma from "../services/prisma";
import { openstack } from "../services/openstack";

/**
 * List all projects owned by the current user.
 */
export const listProjects = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const projects = await prisma.project.findMany({ where: { ownerId: userId } });
  res.json(projects);
};

/**
 * Create a new project in Keystone and locally.
 */
export const createProject = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Missing project name" });
  }
  // Create in OpenStack Keystone
  const ksProj = await openstack.createProject(name);
  // Assign default role
  await openstack.assignRole(req.user!.keystoneId, ksProj.id);
  // Store locally
  const project = await prisma.project.create({
    data: { name, keystoneId: ksProj.id, ownerId: req.user!.userId },
  });
  res.status(201).json(project);
};