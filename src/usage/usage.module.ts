

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsageService } from './usage.service.js';
import { UsageInterceptor } from './usage.interceptor.js';

@Module({
  providers: [
    UsageService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UsageInterceptor,
    },
  ],
})
export class UsageModule {}