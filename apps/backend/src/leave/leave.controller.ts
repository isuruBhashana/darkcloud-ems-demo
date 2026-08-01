import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { LeaveService } from './leave.service';

@Controller('leave-requests')
@AllowAnonymous()
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string, @Query('status') status?: string) {
    return this.leaveService.findAll({ employeeId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateLeaveDto) {
    return this.leaveService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leaveService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }
}
