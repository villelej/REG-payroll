import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { hr_users_role } from '@prisma/client';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Post()
  @ApiOperation({ summary: 'Create a new job post (Admin/HR only)' })
  create(@Body() createPostDto: any, @Req() req: RequestWithUser) {
    const companyId =
      req.user.role === hr_users_role.PlatformAdmin
        ? createPostDto.companyId || req.user.companyId
        : req.user.companyId;
    return this.postsService.create(createPostDto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  findAll(@Req() req: RequestWithUser) {
    return this.postsService.findAll(req.user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by id' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.findOne(+id, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin, hr_users_role.BranchHR)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a post' })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: any,
    @Req() req: RequestWithUser,
  ) {
    return this.postsService.update(+id, updatePostDto, req.user.companyId);
  }

  @Roles(hr_users_role.SuperAdmin)
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a post' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.postsService.remove(+id, req.user.companyId);
  }
}
