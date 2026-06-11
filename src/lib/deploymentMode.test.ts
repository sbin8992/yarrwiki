import assert from "node:assert/strict";
import test from "node:test";
import { isReadOnlyDeployment } from "./deploymentMode.ts";

test("treats deployment without database url as read-only", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.VERCEL = "1";
  delete process.env.DATABASE_URL;

  try {
    assert.equal(isReadOnlyDeployment(), true);
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});

test("keeps deployment writable when database url is configured", () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.VERCEL = "1";
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

  try {
    assert.equal(isReadOnlyDeployment(), false);
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
