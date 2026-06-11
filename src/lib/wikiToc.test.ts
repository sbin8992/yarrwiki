import assert from "node:assert/strict";
import test from "node:test";
import { buildHeadingIdByLine, buildTableOfContents } from "./wikiToc.ts";

test("builds table of contents from markdown headings", () => {
  const markdown = [
    "# 개요",
    "본문입니다.",
    "## 설치 방법",
    "### 주의 사항",
    "#### 너무 작은 제목은 제외",
    "```",
    "## 코드 안 제목은 제외",
    "```",
    "## 설치 방법",
  ].join("\n");

  assert.deepEqual(buildTableOfContents(markdown), [
    { level: 1, text: "개요", id: "개요" },
    { level: 2, text: "설치 방법", id: "설치-방법" },
    { level: 3, text: "주의 사항", id: "주의-사항" },
    { level: 2, text: "설치 방법", id: "설치-방법-2" },
  ]);
});

test("strips inline markdown from heading labels", () => {
  const markdown = "## **굵은 제목** `코드` [링크](https://example.com)";

  assert.deepEqual(buildTableOfContents(markdown), [
    { level: 2, text: "굵은 제목 코드 링크", id: "굵은-제목-코드-링크" },
  ]);
});

test("maps heading ids by source line", () => {
  const markdown = ["# 개요", "", "## 설치 방법", "본문", "## 설치 방법"].join("\n");

  assert.deepEqual(Array.from(buildHeadingIdByLine(markdown).entries()), [
    [1, "개요"],
    [3, "설치-방법"],
    [5, "설치-방법-2"],
  ]);
});
