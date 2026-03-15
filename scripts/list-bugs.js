const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bugs = await prisma.bugReport.findMany({
    where: {
      status: {
        in: ['PENDING', 'IN_PROGRESS', 'READY_FOR_TEST']
      }
    },
    include: {
      reporter: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(JSON.stringify(bugs, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
