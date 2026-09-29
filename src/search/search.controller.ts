

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SearchQueryDto } from './dto/search-query.dto.js';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post('query')
  @ApiOperation({ summary: 'Perform a web search' })
  search(@CurrentUser() user: any, @Body() dto: SearchQueryDto) {
    return this.searchService.search(user.sub, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get search history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getHistory(user.sub, page, limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent searches' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecent(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.searchService.getRecent(user.sub, limit);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'q', required: true })
  getSuggestions(@Query('q') query: string) {
    return this.searchService.getSuggestions(query);
  }
}