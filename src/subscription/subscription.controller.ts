

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';



@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}


  @Get('status')
  @ApiOperation({ summary: 'Get subscription status' })
  getStatus(@CurrentUser() user: any) {
    return this.subscriptionService.getStatus(user.sub);
  }


  @Get('remaining')
  @ApiOperation({ summary: 'Get remaining requests' })
  getRemaining(@CurrentUser() user: any) {
    return this.subscriptionService.getRemaining(user.sub);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade to Premium' })
  upgrade(@CurrentUser() user: any) {
    return this.subscriptionService.upgrade(user.sub);
  }

  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade to Free' })
  downgrade(@CurrentUser() user: any) {
    return this.subscriptionService.downgrade(user.sub);
  }
}