
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
}

export class CreateProviderDto {
  @ApiProperty({ example: 'OpenAI GPT-4' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ProviderType })
  @IsEnum(ProviderType)
  providerType: ProviderType;

  @ApiProperty()
  @IsString()
  apiKey: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}