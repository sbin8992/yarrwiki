import { getSession } from "@/lib/auth";
import { isReadOnlyDeployment } from "@/lib/deploymentMode";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (isReadOnlyDeployment()) {
    return NextResponse.json(
      { message: "DB 설정이 없어 권한 요청을 보낼 수 없습니다." },
      { status: 503 }
    );
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  if (session.canEdit) {
    return NextResponse.json(
      { message: "이미 편집 권한을 가지고 있습니다." },
      { status: 400 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    // Check if there's already a pending request
    const existingRequest = await prisma.permissionRequest.findFirst({
      where: {
        userId: session.userId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { message: "이미 대기 중인 요청이 있습니다." },
        { status: 400 }
      );
    }

    const request = await prisma.permissionRequest.create({
      data: {
        userId: session.userId,
      },
    });

    return NextResponse.json({ request });
  } catch (error) {
    return NextResponse.json(
      { message: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (isReadOnlyDeployment()) {
    return NextResponse.json({ requests: [] });
  }

  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json(
      { message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const requests = await prisma.permissionRequest.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json(
      { message: "요청 목록을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
