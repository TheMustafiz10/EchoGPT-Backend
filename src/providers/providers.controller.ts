

import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  @ApiOperation({ summary: 'List all AI providers' })
  findAll() {
    return this.providersService.findAll();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for all providers' })
  healthCheck() {
    return this.providersService.healthCheck();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new AI provider' })
  create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update provider' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateProviderDto>) {
    return this.providersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Enable/disable provider' })
  toggle(@Param('id') id: string) {
    return this.providersService.toggleEnabled(id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set provider as default' })
  setDefault(@Param('id') id: string) {
    return this.providersService.setDefault(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete provider' })
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }
}