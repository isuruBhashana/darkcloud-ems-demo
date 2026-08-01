import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAttendanceDto {
  @IsString()
  @IsIn(['present', 'absent', 'late', 'half-day'], {
    message: 'Status must be one of: present, absent, late, half-day',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
