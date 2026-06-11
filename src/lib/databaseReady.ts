import { Pool } from "pg";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import snapshot from "./wikiSnapshot.json";

let readyPromise: Promise<void> | null = null;

type SnapshotPage = {
  title: string;
  content: string;
};

export function ensureDatabaseReady() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for writable database access.");
  }

  readyPromise ??= prepareDatabase(process.env.DATABASE_URL);
  return readyPromise;
}

async function prepareDatabase(connectionString: string) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("begin");

    await client.query(`
      create table if not exists "User" (
        "id" serial primary key,
        "username" text not null unique,
        "password" text not null,
        "canEdit" boolean not null default false,
        "isAdmin" boolean not null default false
      )
    `);

    await client.query(`
      create table if not exists "PermissionRequest" (
        "id" serial primary key,
        "userId" integer not null references "User"("id") on delete restrict on update cascade,
        "status" text not null default 'PENDING',
        "createdAt" timestamp(3) not null default current_timestamp
      )
    `);

    await client.query(`
      create table if not exists "WikiPage" (
        "id" serial primary key,
        "title" text not null unique,
        "content" text not null,
        "updatedAt" timestamp(3) not null default current_timestamp,
        "userId" integer not null references "User"("id") on delete restrict on update cascade
      )
    `);

    const ownerId = await ensureOwnerUser(client);
    await seedSnapshotPages(client, ownerId);

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    readyPromise = null;
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function ensureOwnerUser(client: PoolClientLike) {
  const adminUsername = process.env.YARRWIKI_ADMIN_USERNAME;
  const adminPassword = process.env.YARRWIKI_ADMIN_PASSWORD;

  if (adminUsername && adminPassword) {
    const password = await bcrypt.hash(adminPassword, 10);
    const result = await client.query<{ id: number }>(
      `
        insert into "User" ("username", "password", "canEdit", "isAdmin")
        values ($1, $2, true, true)
        on conflict ("username") do update
        set "canEdit" = true,
            "isAdmin" = true
        returning "id"
      `,
      [adminUsername, password],
    );

    return result.rows[0].id;
  }

  const result = await client.query<{ id: number }>(
    `
      insert into "User" ("username", "password", "canEdit", "isAdmin")
      values ('system', $1, false, false)
      on conflict ("username") do update
      set "username" = excluded."username"
      returning "id"
    `,
    [await bcrypt.hash(crypto.randomUUID(), 10)],
  );

  return result.rows[0].id;
}

async function seedSnapshotPages(client: PoolClientLike, ownerId: number) {
  const count = await client.query<{ count: string }>(
    `select count(*)::text as count from "WikiPage"`,
  );

  if (Number(count.rows[0].count) > 0) return;

  for (const page of snapshot.pages as SnapshotPage[]) {
    await client.query(
      `
        insert into "WikiPage" ("title", "content", "userId")
        values ($1, $2, $3)
        on conflict ("title") do nothing
      `,
      [page.title, page.content, ownerId],
    );
  }
}

type PoolClientLike = {
  query<T = unknown>(queryText: string, values?: unknown[]): Promise<{ rows: T[] }>;
};
