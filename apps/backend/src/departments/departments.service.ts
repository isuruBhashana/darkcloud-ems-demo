import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeId: true,
            fullName: true,
            position: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    return department;
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Department "${dto.name}" already exists`);
    }

    return this.prisma.department.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.department.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(`Department "${dto.name}" already exists`);
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      throw new BadRequestException(
        `Cannot delete department containing ${employeeCount} employee(s). Reassign them first.`,
      );
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }
}
