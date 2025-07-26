import { PrismaClient } from "../../generated/prisma";

import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();
    process.exit(1);
  });

export default prisma;
