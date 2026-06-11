export type TocItem = {
  level: 1 | 2 | 3;
  text: string;
  id: string;
};

const HEADING_PATTERN = /^(#{1,3})\s+(.+?)\s*#*\s*$/;

export function buildTableOfContents(markdown: string): TocItem[] {
  return collectHeadings(markdown).map((item) => ({
    level: item.level,
    text: item.text,
    id: item.id,
  }));
}

export function buildHeadingIdByLine(markdown: string): Map<number, string> {
  return new Map(collectHeadings(markdown).map((item) => [item.line, item.id]));
}

function collectHeadings(markdown: string): Array<TocItem & { line: number }> {
  const seen = new Map<string, number>();
  const toc: Array<TocItem & { line: number }> = [];
  let inFence = false;
  const lines = markdown.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const match = line.match(HEADING_PATTERN);
    if (!match) continue;

    const text = normalizeHeadingText(match[2]);
    if (!text) continue;

    const baseId = slugifyHeading(text);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    toc.push({
      level: match[1].length as TocItem["level"],
      text,
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      line: index + 1,
    });
  }

  return toc;
}

export function normalizeHeadingText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(value: string): string {
  const slug = normalizeHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || "section";
}
