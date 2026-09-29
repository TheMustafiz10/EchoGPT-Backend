


import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: 'ADMIN' })
  @IsEnum(UserRole)
  role: UserRole;
}