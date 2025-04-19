import { Request, Response } from "express";
import prisma from "../services/prisma";
import { openstack } from "../services/openstack";

/**
 * List all Cinder volumes for a project.
 */
export const listVolumes = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  const data = await openstack.listVolumes(project.keystoneId);
  res.json(data.volumes ?? data);
};

/**
 * Create a new Cinder volume.
 */
export const createVolume = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { size, name } = req.body;
  if (!size) {
    return res.status(400).json({ message: "Missing size" });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  const vol = await openstack.createVolume(project.keystoneId, size, name);
  res.status(201).json(vol.volume ?? vol);
};

/**
 * Delete a Cinder volume.
 */
export const deleteVolume = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const volumeId = req.params.volumeId;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  await openstack.deleteVolume(project.keystoneId, volumeId);
  res.status(204).end();
};

/**
 * Attach a volume to a server.
 */
export const attachVolume = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const serverId = req.params.serverId;
  const { volumeId, device } = req.body;
  if (!volumeId) {
    return res.status(400).json({ message: "Missing volumeId" });
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  const att = await openstack.attachVolume(project.keystoneId, serverId, volumeId, device);
  res.json(att.volumeAttachment ?? att);
};

/**
 * Detach a volume from a server.
 */
export const detachVolume = async (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const serverId = req.params.serverId;
  const attachmentId = req.params.attachmentId;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== req.user!.userId) {
    return res.status(404).json({ message: "Project not found" });
  }
  await openstack.detachVolume(project.keystoneId, serverId, attachmentId);
  res.status(204).end();
};