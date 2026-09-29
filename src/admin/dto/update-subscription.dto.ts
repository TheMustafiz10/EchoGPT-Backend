


import { IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: PlanType, required: false })
  @IsEnum(PlanType)
  @IsOptional()
  plan?: PlanType;

  @ApiProperty({ required: false, example: 1000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  requestsLimit?: number;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  resetUsage?: boolean;
}