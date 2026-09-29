


import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async getRemaining(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    return {
      plan: sub.plan,
      remaining: Math.max(0, sub.requestsLimit - sub.requestsUsed),
      limit: sub.requestsLimit,
      used: sub.requestsUsed,
    };
  }

  async upgrade(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: { plan: 'PREMIUM', requestsLimit: 1000 },
    });
  }

  async downgrade(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: { plan: 'FREE', requestsLimit: 10, requestsUsed: 0 },
    });
  }

  async checkAndConsume(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return false;
    if (sub.requestsUsed >= sub.requestsLimit) return false;

    await this.prisma.subscription.update({
      where: { userId },
      data: { requestsUsed: { increment: 1 } },
    });
    return true;
  }
}