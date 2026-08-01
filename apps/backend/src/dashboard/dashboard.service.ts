import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalEmployees,
      totalDepartments,
      activeEmployees,
      recentEmployees,
      departmentDistribution,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.department.count(),
      this.prisma.employee.count({ where: { status: 'active' } }),
      this.prisma.employee.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { department: { select: { name: true } } },
      }),
      this.prisma.department.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { employees: true } },
        },
      }),
    ]);

    // Today's attendance summary
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const todayAttendance = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { date: today },
      _count: { status: true },
    });

    const attendanceStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
    };

    for (const item of todayAttendance) {
      if (item.status === 'present') attendanceStats.present = item._count.status;
      if (item.status === 'absent') attendanceStats.absent = item._count.status;
      if (item.status === 'late') attendanceStats.late = item._count.status;
      if (item.status === 'half-day') attendanceStats.halfDay = item._count.status;
    }

    // Pending leave requests count
    const pendingLeaves = await this.prisma.leaveRequest.count({
      where: { status: 'pending' },
    });

    return {
      totalEmployees,
      totalDepartments,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      pendingLeaves,
      attendanceToday: attendanceStats,
      recentEmployees,
      departmentDistribution: departmentDistribution.map((d) => ({
        id: d.id,
        name: d.name,
        count: d._count.employees,
      })),
    };
  }
}
