import { Request, Response } from "express";
import prisma from "../services/prisma";
import { hashPassword, comparePassword } from "../utils/bcrypt";
import { openstack } from "../services/openstack";
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const passwordHash = await hashPassword(password);
    // Create user in Keystone
    const ksUser = await openstack.createUser(name, password, email);
    // Create a default project for the user
    const projName = `project_${Date.now()}`;
    const ksProj = await openstack.createProject(projName);
    await openstack.assignRole(ksUser.id, ksProj.id);
    // Store in local database
    const user = await prisma.user.create({
      data: { email, name, passwordHash, keystoneId: ksUser.id },
    });
    await prisma.project.create({
      data: { name: projName, keystoneId: ksProj.id, ownerId: user.id },
    });
    const payload: TokenPayload = { userId: user.id, keystoneId: ksUser.id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    return res.status(201).json({ accessToken, refreshToken });
  } catch (err: any) {
    console.error('Registration error:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const payload: TokenPayload = { userId: user.id, keystoneId: user.keystoneId };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    return res.json({ accessToken, refreshToken });
  } catch (err: any) {
    console.error('Login error:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Missing token' });
    }
    const payload = verifyRefreshToken(refreshToken);
    const newAccess = signAccessToken(payload);
    return res.json({ accessToken: newAccess });
  } catch (err: any) {
    console.error('Refresh token error:', err.message || err);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};