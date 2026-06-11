import { getSession } from "@/lib/auth";
import { findWikiPageByTitle } from "@/lib/wikiData";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");

  if (!title) {
    return NextResponse.json({ message: "제목이 필요합니다." }, { status: 400 });
  }

  const page = await findWikiPageByTitle(title);

  return NextResponse.json({ page });
}

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || !session.canEdit) {
    return NextResponse.json(
      { message: "편집 권한이 없습니다." },
      { status: 403 }
    );
  }

  try {
    const { originalTitle, title, content } = await req.json();
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = await getPrisma();

    if (!title) {
      return NextResponse.json({ message: "제목이 필요합니다." }, { status: 400 });
    }

    // Handle Rename or Edit
    if (originalTitle && originalTitle !== title) {
      // Check if the new title already exists
      const existing = await prisma.wikiPage.findUnique({ where: { title } });
      if (existing) {
        return NextResponse.json({ message: "이미 존재하는 문서 제목입니다." }, { status: 400 });
      }

      // Perform rename
      const page = await prisma.wikiPage.update({
        where: { title: originalTitle },
        data: {
          title,
          content,
          userId: session.userId,
        },
      });
      return NextResponse.json({ page });
    }

    // Standard Upsert
    const page = await prisma.wikiPage.upsert({
      where: { title },
      update: {
        content,
        userId: session.userId,
      },
      create: {
        title,
        content,
        userId: session.userId,
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { message: "저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
