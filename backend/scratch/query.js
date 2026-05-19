const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

  // serialize bigint
BigInt.prototype.toJSON = function () {
    return this.toString();       
};

async function main() {
  try {
    console.log("Querying for real users...");
    const rawUsers = await prisma.$queryRawUnsafe(`SELECT * FROM hr_users;`);
    console.log("RAW USERS IN HR_USERS:");
    console.log(JSON.stringify(rawUsers, null, 2));
  } catch(e) { console.error(e) }
  try {
    console.log("Looking for other user tables...");
    const rawTables = await prisma.$queryRawUnsafe(`SHOW TABLES;`);
    console.log("TABLES:");
    console.log(JSON.stringify(rawTables, null, 2));
  } catch(e) { console.error(e) }
  
  // See if there's a Role table
  try {
    console.log("Querying Role table if exists...");
    const roles = await prisma.$queryRawUnsafe(`SELECT * FROM Role;`);
    console.log("ROLES TABLE:", JSON.stringify(roles, null, 2));
  } catch(e) { console.log(e.message) }

    // See if there's a User table
  try {
    console.log("Querying User table if exists...");
    const userz = await prisma.$queryRawUnsafe(`SELECT * FROM User;`);
    console.log("USER TABLE:", JSON.stringify(userz, null, 2));
  } catch(e) { console.log(e.message) }
}
main().catch(console.error).finally(() => prisma.$disconnect());
