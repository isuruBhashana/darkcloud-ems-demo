import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { employeeId?: string; startDate?: string; endDate?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) {
        (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (where.date as Record<string, unknown>).lte = new Date(query.endDate);
      }
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: { id: true, employeeId: true, fullName: true, position: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!record) {
      throw new NotFoundException(`Attendance record with ID "${id}" not found`);
    }

    return record;
  }

  async create(dto: CreateAttendanceDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new BadRequestException(`Employee with ID "${dto.employeeId}" not found`);
    }

    // Normalize date to YYYY-MM-DD
    const attendanceDate = new Date(dto.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Rule: Attendance can only be recorded once per employee per day
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: attendanceDate,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Attendance for employee "${employee.fullName}" on ${attendanceDate.toISOString().split('T')[0]} has already been recorded`,
      );
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: attendanceDate,
        status: dto.status,
        remarks: dto.remarks,
      },
      include: {
        employee: { select: { id: true, employeeId: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    await this.findOne(id);

    return this.prisma.attendance.update({
      where: { id },
      data: dto,
      include: {
        employee: { select: { id: true, employeeId: true, fullName: true } },
      },
    });
  }
}
