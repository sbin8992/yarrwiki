import { NextResponse } from "next/server";
import path from "path";
import { getSession } from "@/lib/auth";
import sharp from "sharp";
// @ts-ignore
import convert from "heic-convert";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session || !session.canEdit) {
    return NextResponse.json(
      { message: "업로드 권한이 없습니다." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "파일이 없습니다." },
        { status: 400 }
      );
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase();

    // Convert HEIC to JPEG if needed
    if (ext === ".heic" || ext === ".heif") {
      try {
        const outputBuffer = await convert({
          buffer: buffer,
          format: "JPEG",
          quality: 1
        });
        buffer = Buffer.from(outputBuffer);
      } catch (err) {
        console.error("HEIC conversion error:", err);
        return NextResponse.json(
          { message: "HEIC 파일 변환에 실패했습니다. JPG나 PNG 파일을 사용해주세요." },
          { status: 400 }
        );
      }
    }

    // Create a unique filename with .jpg extension for compatibility
    const filename = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-")}.jpg`;
    const uploadPath = path.join(process.cwd(), "public/uploads", filename);

    // Process with sharp: auto-orient based on EXIF and optimize
    await sharp(buffer)
      .rotate()
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(uploadPath);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "이미지 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
