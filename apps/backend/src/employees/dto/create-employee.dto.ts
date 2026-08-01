import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Department ID is required' })
  departmentId: string;

  @IsString()
  @IsNotEmpty({ message: 'Position is required' })
  position: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Type(() => Date)
  @IsDate({ message: 'Date joined must be a valid date' })
  @IsNotEmpty({ message: 'Date joined is required' })
  dateJoined: Date;

  @IsNumber({}, { message: 'Salary must be a number' })
  @Min(0, { message: 'Salary cannot be negative' })
  @IsNotEmpty({ message: 'Salary is required' })
  salary: number;

  @IsString()
  @IsOptional()
  status?: string; // active | inactive | on-leave
}
