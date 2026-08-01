import { Module } from '@nestjs/common';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EmployeesModule } from '../employees/employees.module';
import { LeaveModule } from '../leave/leave.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminUsersModule,
    DepartmentsModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    DashboardModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
