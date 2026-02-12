import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

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
