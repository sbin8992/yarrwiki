import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 존재하는 아이디입니다." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // sbin8992 유저는 자동으로 관리자 및 편집 권한 부여
    const isAdmin = username === "sbin8992";
    const canEdit = isAdmin;

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin,
        canEdit,
      },
    });

    return NextResponse.json({ message: "회원가입 성공" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
