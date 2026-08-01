import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployeeReport(query?: { departmentId?: string; status?: string }) {
    const where: Record<string, unknown> = {};
    if (query?.departmentId) where.departmentId = query.departmentId;
    if (query?.status) where.status = query.status;

    const employees = await this.prisma.employee.findMany({
      where,
      include: { department: { select: { name: true } } },
      orderBy: { fullName: 'asc' },
    });

    return employees.map((e) => ({
      employeeId: e.employeeId,
      fullName: e.fullName,
      department: e.department.name,
      position: e.position,
      email: e.email,
      phone: e.phone,
      dateJoined: e.dateJoined,
      salary: e.salary,
      status: e.status,
    }));
  }

  async getAttendanceReport(query?: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  }) {
    const where: Record<string, unknown> = {};

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    if (query?.departmentId) {
      where.employee = { departmentId: query.departmentId };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { employeeId: true, fullName: true, department: { select: { name: true } } },
        },
      },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      date: r.date,
      employeeId: r.employee.employeeId,
      employeeName: r.employee.fullName,
      department: r.employee.department.name,
      status: r.status,
      remarks: r.remarks || '-',
    }));
  }

  async getLeaveReport(query?: { status?: string; leaveType?: string }) {
    const where: Record<string, unknown> = {};
    if (query?.status) where.status = query.status;
    if (query?.leaveType) where.leaveType = query.leaveType;

    const requests = await this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { employeeId: true, fullName: true, department: { select: { name: true } } },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return requests.map((l) => ({
      id: l.id,
      employeeId: l.employee.employeeId,
      employeeName: l.employee.fullName,
      department: l.employee.department.name,
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason || '-',
      status: l.status,
      createdAt: l.createdAt,
    }));
  }
}
