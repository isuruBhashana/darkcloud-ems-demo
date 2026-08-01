import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsOptional()
  email?: string;

  @Type(() => Date)
  @IsDate({ message: 'Date joined must be a valid date' })
  @IsOptional()
  dateJoined?: Date;

  @IsNumber({}, { message: 'Salary must be a number' })
  @Min(0, { message: 'Salary cannot be negative' })
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  status?: string;
}
