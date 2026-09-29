
import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SearchQueryDto } from './dto/search-query.dto.js';



@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  async search(userId: string, dto: SearchQueryDto) {
    const query = dto.query.trim();
    if (query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const normalized = query.toLowerCase();




    // DB cache
    const cached = await this.prisma.webSearch.findFirst({
      where: {
        query: normalized,
        results: { not: undefined },
        createdAt: { gte: new Date(Date.now() - this.CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cached) {
      this.logger.log(`Cache hit for query: "${normalized}"`);


      // reuse the cached result
      return this.prisma.webSearch.create({
        data: {
          userId,
          query: normalized,
          results: cached.results ?? [],
          cached: true,
        },
      });
    }




    // Cache miss
    this.logger.log(`Cache miss for query: "${normalized}" — generating results`);

    const results = this.buildLocalResults(query);

    return this.prisma.webSearch.create({
      data: {
        userId,
        query: normalized,
        results,
        cached: false,
      },
    });
  }




  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.webSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.webSearch.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }




  async getRecent(userId: string, limit = 5) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 20),
      select: { id: true, query: true, createdAt: true },
    });
  }

  
  async getSuggestions(query: string) {
    const clean = query.trim().slice(0, 50);
    if (!clean) {
      throw new BadRequestException('Query is required');
    }
    return [
      `${clean} tutorial`,
      `${clean} examples`,
      `how to use ${clean}`,
      `${clean} best practices`,
      `${clean} vs alternatives`,
      `${clean} documentation`,
    ];
  }


  
  private buildLocalResults(query: string) {
    const slug = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));

    return [
      {
        title: `${query} — Overview`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${slug}`,
        snippet: `General reference material and background information about ${query}.`,
        source: 'wikipedia',
      },
      {
        title: `${query} — Documentation`,
        url: `https://devdocs.io/#q=${slug}`,
        snippet: `API references and official documentation for ${query}.`,
        source: 'devdocs',
      },
      {
        title: `Latest articles about ${query}`,
        url: `https://news.google.com/search?q=${slug}`,
        snippet: `Recent news and articles mentioning ${query}.`,
        source: 'google-news',
      },
      {
        title: `${query} on Stack Overflow`,
        url: `https://stackoverflow.com/search?q=${slug}`,
        snippet: `Community Q&A, troubleshooting, and examples related to ${query}.`,
        source: 'stackoverflow',
      },
      {
        title: `${query} — GitHub repositories`,
        url: `https://github.com/search?q=${slug}`,
        snippet: `Open-source projects, code samples, and libraries for ${query}.`,
        source: 'github',
      },
    ];
  }
}