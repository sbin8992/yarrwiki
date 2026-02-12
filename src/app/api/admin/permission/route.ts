import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json(
      { message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const { userId, canEdit } = await req.json();

    const user = await prisma.user.update({
      where: { id: userId },
      data: { canEdit },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { message: "권한 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
