import { getSession } from "@/lib/auth";
import { isReadOnlyDeployment } from "@/lib/deploymentMode";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (isReadOnlyDeployment()) {
    return NextResponse.json(
      { message: "DB 설정이 없어 권한 요청을 처리할 수 없습니다." },
      { status: 503 }
    );
  }

  const session = await getSession();

  if (!session || !session.isAdmin) {
    return NextResponse.json(
      { message: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const { requestId, action } = await req.json(); // action: "APPROVE" or "REJECT"
    const { getPrisma } = await import("@/lib/prisma");
    const prisma = await getPrisma();

    const request = await prisma.permissionRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      return NextResponse.json(
        { message: "요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: request.userId },
          data: { canEdit: true },
        }),
        prisma.permissionRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED" },
        }),
      ]);
    } else if (action === "REJECT") {
      await prisma.permissionRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
    } else {
      return NextResponse.json(
        { message: "잘못된 작업입니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "성공적으로 처리되었습니다." });
  } catch (error) {
    return NextResponse.json(
      { message: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
