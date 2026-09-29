

import {
  Controller, Get, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';




@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}



  // Dashboard
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }




  // User Management
  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getUsers(page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get a single user by ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update a user role (USER / ADMIN)' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user' })
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }






  // Subscription Management
  @Get('subscriptions')
  @ApiOperation({ summary: 'List all subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAllSubscriptions(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllSubscriptions(page, limit);
  }

  @Patch('subscriptions/:userId')
  @ApiOperation({ summary: 'Update a user subscription (plan, limit, reset usage)' })
  updateSubscription(
    @Param('userId') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateUserSubscription(userId, dto);
  }




  // API Usage Analytics
  @Get('analytics/usage')
  @ApiOperation({ summary: 'Get API usage analytics (last 7 days)' })
  getUsageAnalytics() {
    return this.adminService.getUsageAnalytics();
  }




  // Request Logs
  @Get('logs')
  @ApiOperation({ summary: 'Get request logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRequestLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getRequestLogs(page, limit);
  }

  

  // System Health
  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  getHealth() {
    return this.adminService.getSystemHealth();
  }
}