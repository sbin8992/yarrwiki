const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dbPath = path.join(process.cwd(), "dev.db");
const outputPath = path.join(process.cwd(), "src", "lib", "wikiSnapshot.json");

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(outputPath, JSON.stringify({ pages: [] }, null, 2));
  process.exit(0);
}

const db = new Database(dbPath, { readonly: true });

const pages = db
  .prepare(`
    select
      WikiPage.id,
      WikiPage.title,
      WikiPage.content,
      WikiPage.updatedAt,
      User.username as updatedByUsername
    from WikiPage
    left join User on User.id = WikiPage.userId
    order by WikiPage.updatedAt desc
  `)
  .all()
  .map((page) => ({
    id: page.id,
    title: page.title,
    content: page.content,
    updatedAt: new Date(page.updatedAt).toISOString(),
    updatedBy: {
      username: page.updatedByUsername || "unknown",
    },
  }));

fs.writeFileSync(outputPath, JSON.stringify({ pages }, null, 2));
