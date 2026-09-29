
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({ example: 'NestJS best practices' })
  @IsString()
  @MinLength(2)
  query: string;
}