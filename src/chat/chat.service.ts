

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  MessageEvent,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';
import { decrypt } from '../common/utils/encryption.util.js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
// import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';





@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private subscriptionService: SubscriptionService,
    private jwtService: JwtService,
  ) {}


  
  verifyStreamToken(token: string): string {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }


  
  // Non-streaming prompt
  async sendPrompt(userId: string, dto: SendPromptDto) {
    const canProceed = await this.subscriptionService.checkAndConsume(userId);
    if (!canProceed) {
      throw new BadRequestException('Request limit reached. Please upgrade your plan.');
    }

    const provider = await this.resolveProvider(dto.providerId);
    const { text: response, tokensUsed } = await this.callProvider(provider, dto.prompt);

    return this.prisma.chatHistory.create({
      data: {
        userId,
        providerId: provider.id,
        prompt: dto.prompt,
        response,
        tokensUsed,
      },
    });
  }


  


  // Streaming prompt (SSE)

  streamPrompt(userId: string, prompt: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        if (!prompt || prompt.trim().length < 1) {
          throw new BadRequestException('Prompt is required');
        }

        const canProceed = await this.subscriptionService.checkAndConsume(userId);
        if (!canProceed) {
          throw new BadRequestException(
            'Request limit reached. Please upgrade your plan.',
          );
        }

        const provider = await this.resolveProvider();
        const fullText = await this.streamFromProvider(provider, prompt, subject);

        await this.prisma.chatHistory.create({
          data: {
            userId,
            providerId: provider.id,
            prompt,
            response: fullText,
            tokensUsed: 0,
          },
        });

        subject.next({ data: { done: true } } as MessageEvent);
        subject.complete();
      } catch (err: any) {
        subject.next({
          data: { error: err?.message ?? 'Streaming failed' },
        } as MessageEvent);
        subject.complete();
      }
    })();

    return subject.asObservable();
  }


  

  // History
  async getHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.chatHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: { provider: { select: { name: true, providerType: true } } },
      }),
      this.prisma.chatHistory.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async deleteHistory(id: string, userId: string) {
    const chat = await this.prisma.chatHistory.findFirst({ where: { id, userId } });
    if (!chat) throw new NotFoundException('Chat not found');

    await this.prisma.chatHistory.delete({ where: { id } });
    return { message: 'Chat deleted' };
  }


  

  private async resolveProvider(providerId?: string) {
    let provider;
    if (providerId) {
      provider = await this.prisma.aiProvider.findUnique({
        where: { id: providerId },
      });
    } else {
      provider = await this.prisma.aiProvider.findFirst({
        where: { enabled: true, isDefault: true },
      });
    }

    if (!provider) throw new NotFoundException('No AI provider available');
    if (!provider.enabled) throw new BadRequestException('Selected provider is disabled');
    return provider;
  }


  



  // Non-streaming provider
  
  private async callProvider(
    provider: { providerType: string; apiKey: string; baseUrl?: string | null; name: string },
    prompt: string,
  ): Promise<{ text: string; tokensUsed: number }> {
    const apiKey = decrypt(provider.apiKey);

    switch (provider.providerType) {
      case 'openai': {
        const openai = new OpenAI({
          apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        });
        return {
          text: res.choices[0]?.message?.content ?? '',
          tokensUsed: res.usage?.total_tokens ?? 0,
        };
      }

      case 'anthropic': {
        const anthropic = new Anthropic({
          apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        const res = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        const textBlock = res.content.find((c) => c.type === 'text');
        return {
          text: textBlock && textBlock.type === 'text' ? textBlock.text : '',
          tokensUsed: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
        };
      }


      case 'gemini': {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return {
          text: response.text ?? '',
          tokensUsed: response.usageMetadata?.totalTokenCount ?? 0,
        };
      }

      // case 'gemini': {
      //   const genAI = new GoogleGenAI(apiKey);
      //   const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      //   const result = await model.generateContent(prompt);
      //   const text = result.response.text();
      //   const usage = result.response.usageMetadata;
      //   return {
      //     text,
      //     tokensUsed: usage?.totalTokenCount ?? 0,
      //   };
      // }

      default:
        throw new BadRequestException(
          `Unsupported provider type: ${provider.providerType}`,
        );
    }
  }


  



  // Streaming provider call 

  private async streamFromProvider(
    provider: { providerType: string; apiKey: string; baseUrl?: string | null },
    prompt: string,
    subject: Subject<MessageEvent>,
  ): Promise<string> {
    const apiKey = decrypt(provider.apiKey);
    let fullText = '';

    switch (provider.providerType) {
      case 'openai': {
        const openai = new OpenAI({
          apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        });
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) {
            fullText += token;
            subject.next({ data: { token } } as MessageEvent);
          }
        }
        return fullText;
      }

      case 'anthropic': {
        const anthropic = new Anthropic({
          apiKey,
          ...(provider.baseUrl && { baseURL: provider.baseUrl }),
        });
        const stream = await anthropic.messages.stream({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const token = event.delta.text;
            fullText += token;
            subject.next({ data: { token } } as MessageEvent);
          }
        }
        return fullText;
      }



      case 'gemini': {
        const genAI = new GoogleGenAI({ apiKey });
        const stream = await genAI.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        for await (const cn of stream) {
            const token = cn.text ?? '';
            if (token) {
              fullText += token;
              subject.next({ data: { token } } as MessageEvent);
            }
          }
          return fullText;
        }

      default:
        throw new BadRequestException(
          `Unsupported provider type: ${provider.providerType}`,
        );
    }
  }
}