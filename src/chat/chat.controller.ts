

import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Sse,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';



@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('prompt')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send a prompt to AI (non-streaming)' })
  sendPrompt(@CurrentUser() user: any, @Body() dto: SendPromptDto) {
    return this.chatService.sendPrompt(user.sub, dto);
  }

  @Get('history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get chat history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getHistory(user.sub, page, limit);
  }

  @Delete('history/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a chat entry' })
  deleteHistory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatService.deleteHistory(id, user.sub);
  }

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream AI response via SSE. Pass ?prompt=...&token=...',
  })
  @ApiQuery({ name: 'prompt', required: true })
  @ApiQuery({ name: 'token', required: true })
  streamPrompt(
    @Query('prompt') prompt: string,
    @Query('token') token: string,
  ) {
    const userId = this.chatService.verifyStreamToken(token);
    return this.chatService.streamPrompt(userId, prompt);
  }
}