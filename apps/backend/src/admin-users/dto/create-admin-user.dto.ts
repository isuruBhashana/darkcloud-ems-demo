import { IsArray, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsArray({ message: 'Permissions must be an array of section strings' })
  @IsString({ each: true })
  permissions: string[];
}
