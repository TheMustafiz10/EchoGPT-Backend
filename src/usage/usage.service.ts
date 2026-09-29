



import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsageService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    durationMs: number;
  }) {
    return this.prisma.apiUsageLog.create({ data });
  }
}