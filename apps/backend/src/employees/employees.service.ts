import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: { search?: string; departmentId?: string; status?: string }) {
    const where: Record<string, unknown> = {};

    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      const search = query.search;
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.employee.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        attendances: {
          take: 10,
          orderBy: { date: 'desc' },
        },
        leaveRequests: {
          take: 10,
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID "${id}" not found`);
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    // Unique check for employeeId
    const existingCode = await this.prisma.employee.findUnique({
      where: { employeeId: dto.employeeId },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Employee ID "${dto.employeeId}" is already assigned to another employee`,
      );
    }

    // Unique check for email
    const existingEmail = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new BadRequestException(`Email "${dto.email}" is already registered`);
    }

    // Check department exists
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!dept) {
      throw new BadRequestException(`Department with ID "${dto.departmentId}" does not exist`);
    }

    return this.prisma.employee.create({
      data: dto,
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    if (dto.employeeId) {
      const existing = await this.prisma.employee.findFirst({
        where: { employeeId: dto.employeeId, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(
          `Employee ID "${dto.employeeId}" is already assigned to another employee`,
        );
      }
    }

    if (dto.email) {
      const existing = await this.prisma.employee.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(`Email "${dto.email}" is already registered`);
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException(`Department with ID "${dto.departmentId}" does not exist`);
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: dto,
      include: {
        department: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
