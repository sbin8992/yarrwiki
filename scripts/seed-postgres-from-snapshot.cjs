const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const snapshot = require("../src/lib/wikiSnapshot.json");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set; skipping Postgres seed.");
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const adminUsername = process.env.YARRWIKI_ADMIN_USERNAME;
  const adminPassword = process.env.YARRWIKI_ADMIN_PASSWORD;

  let owner = null;

  if (adminUsername && adminPassword) {
    owner = await prisma.user.upsert({
      where: { username: adminUsername },
      update: {
        canEdit: true,
        isAdmin: true,
      },
      create: {
        username: adminUsername,
        password: await bcrypt.hash(adminPassword, 10),
        canEdit: true,
        isAdmin: true,
      },
    });
  } else {
    owner = await prisma.user.upsert({
      where: { username: "system" },
      update: {},
      create: {
        username: "system",
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        canEdit: false,
        isAdmin: false,
      },
    });
  }

  for (const page of snapshot.pages) {
    await prisma.wikiPage.upsert({
      where: { title: page.title },
      update: {
        content: page.content,
        userId: owner.id,
      },
      create: {
        title: page.title,
        content: page.content,
        userId: owner.id,
      },
    });
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
