import snapshot from "./wikiSnapshot.json";

export type WikiPageSummary = {
  id: number;
  title: string;
  content: string;
  updatedAt: string | Date;
  updatedBy: {
    username: string;
  };
};

type PageFilters = {
  q?: string;
  take?: number;
  orderBy?: "title" | "updatedAt";
};

const snapshotPages = snapshot.pages as WikiPageSummary[];

function sortPages(
  pages: WikiPageSummary[],
  orderBy: PageFilters["orderBy"] = "updatedAt",
) {
  return [...pages].sort((a, b) => {
    if (orderBy === "title") {
      return a.title.localeCompare(b.title, "ko-KR");
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function filterSnapshotPages({ q, take, orderBy }: PageFilters = {}) {
  const filtered = q
    ? snapshotPages.filter((page) => page.title.includes(q))
    : snapshotPages;

  const sorted = sortPages(filtered, orderBy);
  return typeof take === "number" ? sorted.slice(0, take) : sorted;
}

export async function findWikiPages(filters: PageFilters = {}) {
  try {
    const { prisma } = await import("@/lib/prisma");
    return await prisma.wikiPage.findMany({
      where: filters.q
        ? {
            title: {
              contains: filters.q,
            },
          }
        : undefined,
      take: filters.take,
      orderBy:
        filters.orderBy === "title" ? { title: "asc" } : { updatedAt: "desc" },
      include: { updatedBy: true },
    });
  } catch (error) {
    console.error("Falling back to read-only wiki snapshot:", error);
    return filterSnapshotPages(filters);
  }
}

export async function findWikiPageByTitle(title: string) {
  try {
    const { prisma } = await import("@/lib/prisma");
    return await prisma.wikiPage.findUnique({
      where: { title },
      include: { updatedBy: true },
    });
  } catch (error) {
    console.error("Falling back to read-only wiki snapshot:", error);
    return snapshotPages.find((page) => page.title === title) ?? null;
  }
}
