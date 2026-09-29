

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { encrypt, decrypt } from '../common/utils/encryption.util.js';


@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.aiProvider.findMany({
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        enabled: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        providerType: true,
        baseUrl: true,
        enabled: true,
        isDefault: true,
        createdAt: true,
      },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async create(dto: CreateProviderDto) {
    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({ data: { isDefault: false } });
    }

    return this.prisma.aiProvider.create({
      data: {
        name: dto.name,
        providerType: dto.providerType,
        apiKey: encrypt(dto.apiKey),
        baseUrl: dto.baseUrl,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: string, dto: Partial<CreateProviderDto>) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.aiProvider.updateMany({ data: { isDefault: false } });
    }



    return this.prisma.aiProvider.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.apiKey && { apiKey: encrypt(dto.apiKey) }),
      }
    })
  }




  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.aiProvider.delete({ where: { id } });
    return { message: 'Provider deleted' };
  }

  async toggleEnabled(id: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id } });
    if (!provider) throw new NotFoundException('Provider not found');

    return this.prisma.aiProvider.update({
      where: { id },
      data: { enabled: !provider.enabled },
    });
  }

  async setDefault(id: string) {
    await this.prisma.aiProvider.updateMany({ data: { isDefault: false } });
    return this.prisma.aiProvider.update({
      where: { id },
      data: { isDefault: true, enabled: true },
    });
  }

  async healthCheck() {
    const providers = await this.prisma.aiProvider.findMany({
      where: { enabled: true },
    });
    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.enabled ? 'healthy' : 'disabled',
    }));
  }
}