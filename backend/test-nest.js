const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { UsersService } = require('./dist/users/users.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  
  const actor = { userId: 11, role: 'BranchHR' };
  const query = { role: 'Employee' };
  
  const users = await usersService.findAll(actor, query);
  console.log("USERS FOUND:", users.length);
  if (users.length > 0) {
    console.log(users.map(u => u.full_name));
  }
  
  await app.close();
}
bootstrap();
