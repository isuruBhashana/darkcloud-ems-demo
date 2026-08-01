import { Controller, Get, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ReportsService } from './reports.service';

@Controller('reports')
@AllowAnonymous()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('employees')
  getEmployeeReport(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.reportsService.getEmployeeReport({ departmentId, status });
  }

  @Get('attendance')
  getAttendanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getAttendanceReport({ startDate, endDate, departmentId });
  }

  @Get('leave')
  getLeaveReport(@Query('status') status?: string, @Query('leaveType') leaveType?: string) {
    return this.reportsService.getLeaveReport({ status, leaveType });
  }
}
