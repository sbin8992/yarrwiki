const { execFileSync } = require("node:child_process");
const path = require("node:path");

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set; skipping Postgres sync.");
  process.exit(0);
}

const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");

execFileSync(prismaBin, ["db", "push", "--skip-generate"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

require("./seed-postgres-from-snapshot.cjs");
