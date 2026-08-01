import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { employeeId?: string; status?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, employeeId: true, fullName: true, department: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Leave request with ID "${id}" not found`);
    }

    return request;
  }

  async create(dto: CreateLeaveDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new BadRequestException(`Employee with ID "${dto.employeeId}" not found`);
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    // Rule: Leave end date must be after the start date
    if (end <= start) {
      throw new BadRequestException('Leave end date must be after the start date');
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        leaveType: dto.leaveType,
        startDate: start,
        endDate: end,
        reason: dto.reason,
      },
      include: {
        employee: { select: { id: true, employeeId: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLeaveDto) {
    const existing = await this.findOne(id);

    const start = dto.startDate ? new Date(dto.startDate) : new Date(existing.startDate);
    const end = dto.endDate ? new Date(dto.endDate) : new Date(existing.endDate);

    if (end <= start) {
      throw new BadRequestException('Leave end date must be after the start date');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: dto,
      include: {
        employee: { select: { id: true, employeeId: true, fullName: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.leaveRequest.delete({
      where: { id },
    });
  }
}
