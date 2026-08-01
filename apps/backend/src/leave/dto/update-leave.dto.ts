import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateLeaveDto {
  @IsString()
  @IsIn(['annual', 'sick', 'personal', 'unpaid'], {
    message: 'Leave type must be one of: annual, sick, personal, unpaid',
  })
  @IsOptional()
  leaveType?: string;

  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  @IsOptional()
  endDate?: Date;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsIn(['pending', 'approved', 'rejected'], {
    message: 'Status must be one of: pending, approved, rejected',
  })
  @IsOptional()
  status?: string;
}
