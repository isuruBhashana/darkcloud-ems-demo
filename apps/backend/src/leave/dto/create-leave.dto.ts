import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

  @IsString()
  @IsIn(['annual', 'sick', 'personal', 'unpaid'], {
    message: 'Leave type must be one of: annual, sick, personal, unpaid',
  })
  @IsNotEmpty({ message: 'Leave type is required' })
  leaveType: string;

  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: Date;

  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: Date;

  @IsString()
  @IsOptional()
  reason?: string;
}
