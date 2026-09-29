

import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPromptDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  prompt: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  providerId?: string;
}