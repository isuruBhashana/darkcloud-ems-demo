import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Valid email is required' })
  @IsOptional()
  email?: string;

  @IsArray({ message: 'Permissions must be an array of section strings' })
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
