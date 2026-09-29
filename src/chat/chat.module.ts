

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [SubscriptionModule, JwtModule.register({})],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}