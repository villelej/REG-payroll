import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get users with role-based filtering' })
  getUsers(@Req() req, @Query() query: Record<string, string>) {
    return this.usersService.findAll(req.user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user by id' })
  getUser(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(req.user, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user (SuperAdmin only)' })
  createUser(@Req() req, @Body() body: CreateUserDto) {
    return this.usersService.create(req.user, body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  updateUser(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(req.user, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (SuperAdmin only)' })
  deleteUser(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(req.user, id);
  }

  @Patch('status')
  @ApiOperation({ summary: 'Update user status (with approval workflow)' })
  patchStatus(@Req() req, @Body() body: UpdateUserStatusDto) {
    return this.usersService.updateStatus(req.user, body);
  }

  @Patch('role-status')
  @ApiOperation({ summary: 'Bulk update status for all users in a specific role' })
  patchRoleStatus(@Req() req, @Body() body: { roleName: string; status: 'ACTIVE' | 'INACTIVE' }) {
    return this.usersService.bulkUpdateRoleStatus(req.user, body.roleName, body.status);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password via email (SuperAdmin only)' })
  resetPassword(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.usersService.resetPasswordBySuperAdmin(req.user, id);
  }
}
