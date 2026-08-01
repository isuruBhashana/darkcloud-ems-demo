import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { auth } from '../auth/auth';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    return users.map((u) => ({
      ...u,
      permissionsList: u.permissions === 'all' ? ['all'] : u.permissions.split(',').filter(Boolean),
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Admin user with ID "${id}" not found`);
    }

    return {
      ...user,
      permissionsList:
        user.permissions === 'all' ? ['all'] : user.permissions.split(',').filter(Boolean),
    };
  }

  async create(dto: CreateAdminUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException(`An account with email "${dto.email}" already exists`);
    }

    const permissionsString = dto.permissions.includes('all') ? 'all' : dto.permissions.join(',');

    try {
      await auth.api.signUpEmail({
        body: {
          email: dto.email,
          password: dto.password,
          name: dto.name,
        },
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      throw new BadRequestException(msg || 'Failed to create administrator account via auth API');
    }

    // Set role and permissions on created user
    const updatedUser = await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        role: 'ADMIN',
        permissions: permissionsString || 'employees,departments,attendance,leave,reports',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    return {
      ...updatedUser,
      permissionsList:
        updatedUser.permissions === 'all'
          ? ['all']
          : updatedUser.permissions.split(',').filter(Boolean),
    };
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const user = await this.findOne(id);

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new BadRequestException(`Email "${dto.email}" already taken`);
      data.email = dto.email;
    }

    if (dto.permissions) {
      data.permissions = dto.permissions.includes('all') ? 'all' : dto.permissions.join(',');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });

    return {
      ...updated,
      permissionsList:
        updated.permissions === 'all' ? ['all'] : updated.permissions.split(',').filter(Boolean),
    };
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Cannot delete the primary System Super Administrator account');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
