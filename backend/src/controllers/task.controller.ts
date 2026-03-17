import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import { TaskStatus, Priority } from '@prisma/client';

export async function getTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '10', status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId };
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }
    if (search) {
      where.title = { contains: search as string };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { title, description, priority, dueDate } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || Priority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) return next(createError('Task not found', 404));

    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { title, description, status, priority, dueDate } = req.body;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return next(createError('Task not found', 404));

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return next(createError('Task not found', 404));

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function toggleTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) return next(createError('Task not found', 404));

    const nextStatus: Record<TaskStatus, TaskStatus> = {
      PENDING: TaskStatus.IN_PROGRESS,
      IN_PROGRESS: TaskStatus.COMPLETED,
      COMPLETED: TaskStatus.PENDING,
    };

    const task = await prisma.task.update({
      where: { id },
      data: { status: nextStatus[existing.status] },
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
}
