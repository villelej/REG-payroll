import { SetMetadata } from '@nestjs/common';
import { hr_users_role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: hr_users_role[]) =>
  SetMetadata(ROLES_KEY, roles);
