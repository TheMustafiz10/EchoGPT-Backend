


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}


  // Dashboard Statistics
  async getDashboardStats() {
    const [totalUsers, premiumUsers, totalChats, totalSearches] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { plan: 'PREMIUM' } }),
      this.prisma.chatHistory.count(),
      this.prisma.webSearch.count(),
    ]);

    return {
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      totalChats,
      totalSearches,
    };
  }


  

  // User Management
  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          subscription: { select: { plan: true, requestsUsed: true, requestsLimit: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        subscription: true,
        _count: { select: { chatHistories: true, webSearches: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, role: 'USER' | 'ADMIN') {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }


  


  // Subscription Management
  async getAllSubscriptions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.subscription.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      this.prisma.subscription.count(),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async updateUserSubscription(
    userId: string,
    data: { plan?: 'FREE' | 'PREMIUM'; requestsLimit?: number; resetUsage?: boolean },
  ) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    if (data.requestsLimit !== undefined && data.requestsLimit < 0) {
      throw new BadRequestException('requestsLimit cannot be negative');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        ...(data.plan && { plan: data.plan }),
        ...(data.requestsLimit !== undefined && { requestsLimit: data.requestsLimit }),
        ...(data.resetUsage && { requestsUsed: 0 }),
      },
    });
  }


  

  // API Usage Analytics
  async getUsageAnalytics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.apiUsageLog.groupBy({
      by: ['endpoint'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
      _avg: { durationMs: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  }

  


  // Request Logs
  async getRequestLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.apiUsageLog.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.apiUsageLog.count(),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }


  


  // System Health
  async getSystemHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}