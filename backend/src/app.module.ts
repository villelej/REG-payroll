import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { PostsModule } from './posts/posts.module';
import { SalaryComponentsModule } from './salary-components/salary-components.module';
import { LeavesModule } from './leaves/leaves.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { StatsModule } from './stats/stats.module';
import { CategoriesModule } from './categories/categories.module';
import { RolesModule } from './roles/roles.module';
import { SalarySettingsModule } from './salary-settings/salary-settings.module';
import { BranchDeductionsModule } from './branch-deductions/branch-deductions.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    DepartmentsModule,
    CategoriesModule,
    RolesModule,
    PostsModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,
    ReportsModule,
    NotificationsModule,
    LeavesModule,
    AuditModule,
    StatsModule,
    SalaryComponentsModule,
    SalarySettingsModule,
    BranchDeductionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
