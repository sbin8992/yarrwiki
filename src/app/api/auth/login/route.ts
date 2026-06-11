import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isReadOnlyDeployment } from "@/lib/deploymentMode";

export async function POST(req: Request) {
  if (isReadOnlyDeployment()) {
    return NextResponse.json(
      {
        message:
          "현재 Vercel 배포판은 읽기 전용이라 로그인을 사용할 수 없습니다. 문서 열람은 가능하며, 로그인/수정은 DB 이전 후 활성화됩니다.",
      },
      { status: 503 }
    );
  }

  try {
    const { username, password } = await req.json();
    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "아이디 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2시간
    const session = await encrypt({ userId: user.id, username: user.username, isAdmin: user.isAdmin, canEdit: user.canEdit, expires });

    (await cookies()).set("session", session, { expires, httpOnly: true });

    return NextResponse.json({ message: "로그인 성공" });
  } catch (error) {
    return NextResponse.json(
      { message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
