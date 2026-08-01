import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  @IsNotEmpty({ message: 'Date is required' })
  date: Date;

  @IsString()
  @IsIn(['present', 'absent', 'late', 'half-day'], {
    message: 'Status must be one of: present, absent, late, half-day',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
