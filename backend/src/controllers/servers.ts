import { Request, Response } from "express";
import prisma from "../services/prisma";
import { openstack } from "../services/openstack";

/**
 * List all Nova servers for a project.
 */
export const listServers = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  const data = await openstack.listServers(project.keystoneId);
  res.json(data.servers ?? data);
};

/**
 * Delete a Nova server.
 */
export const deleteServer = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const serverId = req.params.serverId;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  await openstack.deleteServer(project.keystoneId, serverId);
  res.status(204).end();
};

/**
 * Perform an action (reboot/shutdown/start) on a Nova server.
 */
export const actionServer = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const serverId = req.params.serverId;
  const { action } = req.body;
  if (!["reboot", "shutdown", "start"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  await openstack.actionServer(project.keystoneId, serverId, action);
  res.status(202).end();
};
/**
 * Boot a new Nova server.
 */
export const createServer = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { name, imageRef, flavorRef, networks } = req.body;
  if (!name || !imageRef || !flavorRef || !Array.isArray(networks)) {
    return res.status(400).json({ message: 'Missing required server parameters' });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const data = await openstack.createServer(
    project.keystoneId,
    name,
    imageRef,
    flavorRef,
    networks
  );
  res.status(202).json(data.server ?? data);
};
/**
 * List available Nova flavors for a project.
 */
export const listFlavors = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const data = await openstack.listFlavors(project.keystoneId);
  res.json(data.flavors ?? data);
};
/**
 * List available Neutron networks for a project.
 */
export const listNetworks = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: 'Project not found' });
  }
  const data = await openstack.listNetworks(project.keystoneId);
  res.json(data.networks ?? data);
};