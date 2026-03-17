import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from '../lib/jwt';
import { createError } from '../middleware/error.middleware';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return next(createError('Email already in use', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return next(createError('Invalid credentials', 401));
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const tokenId = uuidv4();
    const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(createError('Refresh token required', 400));
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return next(createError('Invalid or expired refresh token', 401));
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      return next(createError('Refresh token expired or not found', 401));
    }

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return next(createError('User not found', 404));
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email });
    const newTokenId = uuidv4();
    const newRefreshToken = generateRefreshToken({ userId: user.id, tokenId: newTokenId });

    await prisma.refreshToken.create({
      data: {
        id: newTokenId,
        token: newRefreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
