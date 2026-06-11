import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("keeps the app color scheme stable in mobile dark mode", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.equal(css.includes("prefers-color-scheme: dark"), false);
  assert.match(css, /color:\s*#171717;/);
});
